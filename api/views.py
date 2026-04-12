from .permissions import IsChatService
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model, authenticate
from django.http import HttpResponse
from django.conf import settings
from .models import CustomUser, Profile
from .serializers import (
    UserSerializer, ProfileSerializer, ChangePasswordSerializer,
    LoginSerializer, TokenResponseSerializer, RegisterSerializer,
    LogoutSerializer, TokenRefreshSerializer, ForgotPasswordSerializer, VerifyResetCodeSerializer,
    ResetPasswordSerializer, UpdateProfileSerializer, SocialLoginSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.throttling import AnonRateThrottle
import requests
import os
from .extend_schema import (
    login_schema, logout_schema, register_schema, profile_schema,
    change_password_schema, forgot_password_schema,
    deeplink_redirect_schema, reset_password_schema, verify_reset_code_schema,
)
from .logging_utils import log_action
from .permissions import IsStaffRoleUser
import random
from datetime import timedelta
from django.utils import timezone
from .models import CustomUser, Profile, PasswordResetCode
from .serializers import VerifyResetCodeSerializer
User = get_user_model()

def generate_reset_code():
    return f"{random.randint(0, 999999):06d}"
# ─── Custom throttle scopes ───────────────────────────────────────────────────
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'

    def allow_request(self, request, view):
        # Skip throttling for CORS preflight / HEAD to avoid blocking browsers before actual POST
        if request.method in ('OPTIONS', 'HEAD'):
            return True
        return super().allow_request(request, view)

class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'password_reset'


# ─── Views ───────────────────────────────────────────────────────────────────

@login_schema
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Log successful login — user is resolved via the serializer
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                email = request.data.get('email', '')
                user = User.objects.get(email=email)
                log_action(request, 'login', f'User {user.id} logged in')
            except Exception:
                pass
        return response


@register_schema
class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        user_payload = UserSerializer(user, context={'request': request}).data
        log_action(request, 'register', f'New user id={user.id}')
        return Response(
            {
                'message': 'User registered and logged in successfully.',
                'data': {
                    'user': user_payload,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )



@profile_schema
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        # select_related avoids a second DB query for the profile on every GET /me/
        return (
            CustomUser.objects
            .select_related('profile')
            .get(pk=self.request.user.pk)
        )

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user_payload = UserSerializer(user, context={'request': request}).data

        auth_header = request.headers.get('Authorization', '')
        token = auth_header.removeprefix('Bearer ').strip() if auth_header.startswith('Bearer ') else None
        if not token:
            return Response({'detail': 'Token not found in request.'}, status=status.HTTP_401_UNAUTHORIZED)


        # Blacklist all outstanding refresh tokens so the user can't keep using them
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        for outstanding in OutstandingToken.objects.filter(user=user):
            try:
                RefreshToken(outstanding.token).blacklist()
            except TokenError:
                pass  # already blacklisted

        user.delete()
        return Response(
            {
                'message': 'Account deleted successfully.',
                'data': {'user': user_payload},
            },
            status=status.HTTP_200_OK,
        )

@change_password_schema
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response({'errors': {'old_password': 'Wrong password.'}}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        verified_user = authenticate(request=request, email=user.email, password=new_password)
        if verified_user is None:
            return Response(
                {'error': 'Password updated but verification failed. Please contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Blacklist the refresh token sent in the request body
        # (mobile apps send it in the body, not a cookie)
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass  # already expired — fine, password is changed anyway

        return Response(
            {
                'message': 'Password updated successfully.',
                'data': {
                    'user': UserSerializer(user, context={'request': request}).data,
                    'relogin_required': True,
                },
            },
            status=status.HTTP_200_OK,
        )

@forgot_password_schema
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()

        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            return Response(
                {
                    'error': 'Email service is not configured.',
                    'details': 'Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in environment variables.',
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {
                    'message': 'If an account with that email exists, a reset code has been sent.',
                    'data': None,
                },
                status=status.HTTP_200_OK,
            )

        PasswordResetCode.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True, used_at=timezone.now())

        code = generate_reset_code()
        expires_at = timezone.now() + timedelta(minutes=10)

        PasswordResetCode.objects.create(
            user=user,
            email=email,
            code=code,
            expires_at=expires_at,
        )

        subject = 'Your Password Reset Code'
        from_email = os.getenv('EMAIL_HOST_USER')
        to = [email]

        text_content = (
            f'Your password reset code is: {code}\n\n'
            f'This code expires in 10 minutes.\n'
            f'If you did not request this, ignore this email.'
        )

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Password Reset</h2>
            <p>Hello {user.email},</p>
            <p>Your password reset code is:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 20px 0;">
                {code}
            </div>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, ignore this email.</p>
        </body>
        </html>
        """

        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, 'text/html')
        msg.send()

        return Response(
            {
                'message': 'If an account with that email exists, a reset code has been sent.',
                'data': {'email': email},
            },
            status=status.HTTP_200_OK,
        )


@verify_reset_code_schema
class VerifyResetCodeView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        code = serializer.validated_data['code']

        latest_entry = (
            PasswordResetCode.objects
            .filter(email=email, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not latest_entry:
            return Response(
                {'error': 'Invalid code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if latest_entry.is_expired():
            return Response(
                {'error': 'Code expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if latest_entry.attempts >= 5:
            return Response(
                {'error': 'Too many attempts. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if latest_entry.code != code:
            latest_entry.attempts += 1
            latest_entry.save(update_fields=['attempts'])
            return Response(
                {'error': 'Invalid code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latest_entry.is_verified = True
        latest_entry.verified_at = timezone.now()
        latest_entry.save(update_fields=['is_verified', 'verified_at'])

        return Response(
            {
                'message': 'Code verified successfully.',
                'data': {
                    'reset_token': str(latest_entry.reset_token),
                    'email': email,
                },
            },
            status=status.HTTP_200_OK,
        )

# @deeplink_redirect_schema
# class DeepLinkRedirectView(APIView):
#     def get(self, request, uidb64, token):
#         reset_url = f"/api/reset-password/{uidb64}/{token}/"
#         deep_link = f"myapp://ResetPassword/{uidb64}/{token}"

#         html = f"""
#         <html>
#         <head>
#             <meta name="viewport" content="width=device-width, initial-scale=1.0">
#             <title>Reset Password</title>
#             <style>
#                 body {{
#                     font-family: Arial, sans-serif;
#                     display: flex;
#                     justify-content: center;
#                     align-items: center;
#                     height: 100vh;
#                     background: #f7f7f7;
#                 }}
#                 .card {{
#                     background: white;
#                     padding: 20px;
#                     border-radius: 10px;
#                     box-shadow: 0 0 10px rgba(0,0,0,0.1);
#                     width: 90%;
#                     max-width: 350px;
#                     text-align: center;
#                 }}
#                 input {{
#                     width: 100%;
#                     padding: 10px;
#                     margin-top: 10px;
#                     border: 1px solid #ccc;
#                     border-radius: 5px;
#                 }}
#                 button {{
#                     width: 100%;
#                     margin-top: 15px;
#                     padding: 10px;
#                     background-color: #007bff;
#                     color: white;
#                     border: none;
#                     border-radius: 5px;
#                     cursor: pointer;
#                     font-size: 16px;
#                 }}
#             </style>
#         </head>
#         <body>
#             <div class="card">
#                 <h3>Reset Your Password</h3>

#                 <p>If you're on your phone, use this:</p>
#                 <a href="{deep_link}" class="button" 
#                    style="display:block;background:#007bff;color:white;padding:10px;border-radius:5px;margin-bottom:15px;">
#                     Open in App
#                 </a>

#                 <p style="color:#666;">Or reset manually:</p>

#                 <form method="POST" action="{reset_url}">
#                     <input name="password" type="password" placeholder="New password" required>
#                     <input name="confirm_password" type="password" placeholder="Confirm password" required>
#                     <button type="submit">Submit</button>
#                 </form>
#             </div>
#         </body>
#         </html>
#         """

#         return HttpResponse(html)



@reset_password_schema
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_token = serializer.validated_data['reset_token']
        password = serializer.validated_data['password']

        reset_entry = (
            PasswordResetCode.objects
            .filter(
                reset_token=reset_token,
                is_used=False,
                is_verified=True,
            )
            .select_related('user')
            .first()
        )

        if not reset_entry:
            return Response(
                {'error': 'Invalid reset session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_entry.is_expired():
            return Response(
                {'error': 'Reset session expired. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_entry.user
        user.set_password(password)
        user.save(update_fields=['password'])

        reset_entry.is_used = True
        reset_entry.used_at = timezone.now()
        reset_entry.save(update_fields=['is_used', 'used_at'])

        return Response(
            {'message': 'Password reset successfully.'},
            status=status.HTTP_200_OK,
        )
@logout_schema
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            serializer = LogoutSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            refresh_token = serializer.validated_data["refresh_token"]

            token = RefreshToken(refresh_token)
            token.blacklist()

            log_action(request, 'logout', f'User {request.user.id} logged out')
            return Response(
                {
                    'message': 'Successfully logged out.',
                    'data': {'user_id': request.user.id},
                },
                status=status.HTTP_200_OK,
            )

        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Something went wrong."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsStaffRoleUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        users = CustomUser.objects.select_related('profile').all().order_by('id')
        data = UserSerializer(users, many=True, context={'request': request}).data
        return Response({'count': len(data), 'data': data}, status=status.HTTP_200_OK)


class UserAdminDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStaffRoleUser]
    authentication_classes = [JWTAuthentication]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _get_user(self, pk):
        return generics.get_object_or_404(CustomUser.objects.select_related('profile'), pk=pk)

    def get(self, request, pk):
        user = self._get_user(pk)
        data = UserSerializer(user, context={'request': request}).data
        return Response({'data': data}, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        user = self._get_user(pk)
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user = self._get_user(pk)
        user_data = UserSerializer(user, context={'request': request}).data
        user.delete()
        return Response(
            {
                'message': 'User deleted successfully.',
                'data': user_data,
            },
            status=status.HTTP_200_OK,
        )


