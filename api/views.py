from .permissions import IsChatService
from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from .models import CustomUser, Profile, ChatAccess, PhoneOTP
from .serializers import (
    UserSerializer, ProfileSerializer, ChangePasswordSerializer,
    LoginSerializer, TokenResponseSerializer, RegisterSerializer,
    LogoutSerializer, TokenRefreshSerializer, ForgotPasswordSerializer,
    ResetPasswordSerializer, UpdateProfileSerializer, SocialLoginSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.throttling import AnonRateThrottle
import requests
import os
from .extend_schema import (
    login_schema, logout_schema, register_schema, profile_schema,
    change_password_schema, forgot_password_schema,
    deeplink_redirect_schema, reset_password_schema,
)

User = get_user_model()


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


@register_schema
class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': 'User registered successfully.'},
            status=status.HTTP_201_CREATED,
        )



@profile_schema
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        # select_related avoids a second DB query for the profile on every GET /me/
        return (
            CustomUser.objects
            .select_related('profile')
            .get(pk=self.request.user.pk)
        )

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

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
        return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_200_OK)

@change_password_schema
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Blacklist the refresh token sent in the request body
        # (mobile apps send it in the body, not a cookie)
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass  # already expired — fine, password is changed anyway

        return Response({'detail': 'Password updated. Please log in again.'}, status=status.HTTP_200_OK)


@forgot_password_schema
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        # SECURITY: always return 200 regardless of whether the email exists
        # — prevents account enumeration attacks
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'message': 'If an account with that email exists, a reset link has been sent.'},
                status=status.HTTP_200_OK,
            )

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = request.build_absolute_uri(
            reverse('deeplink-redirect', args=[uid, token])
        )

        subject = 'Reset Your Password'
        from_email = os.getenv('EMAIL_HOST_USER')
        to = [email]
        text_content = f'Click the link below to reset your password:\n{reset_link}'
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Password Reset</h2>
            <p>Hello {user.email},</p>
            <p>You requested a password reset. Click the button below:</p>
            <a href="{reset_link}"
               style="background-color: #007bff; padding: 10px 20px;
                      color: white; text-decoration: none; border-radius: 5px;">
                Reset Password
            </a>
            <p>If you didn't request this, ignore this email.</p>
        </body>
        </html>
        """

        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, 'text/html')
        msg.send()

        return Response(
            {'message': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


@deeplink_redirect_schema
class DeepLinkRedirectView(APIView):
    def get(self, request, uidb64, token):
        reset_url = f"/api/reset-password/{uidb64}/{token}/"
        deep_link = f"myapp://ResetPassword/{uidb64}/{token}"

        html = f"""
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #f7f7f7;
                }}
                .card {{
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    width: 90%;
                    max-width: 350px;
                    text-align: center;
                }}
                input {{
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }}
                button {{
                    width: 100%;
                    margin-top: 15px;
                    padding: 10px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <h3>Reset Your Password</h3>

                <p>If you're on your phone, use this:</p>
                <a href="{deep_link}" class="button" 
                   style="display:block;background:#007bff;color:white;padding:10px;border-radius:5px;margin-bottom:15px;">
                    Open in App
                </a>

                <p style="color:#666;">Or reset manually:</p>

                <form method="POST" action="{reset_url}">
                    <input name="password" type="password" placeholder="New password" required>
                    <input name="confirm_password" type="password" placeholder="Confirm password" required>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </body>
        </html>
        """

        return HttpResponse(html)



@reset_password_schema
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        # 1. Decode user
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'Invalid link.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validate token
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Validate passwords via serializer
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 4. Set new password
        user.set_password(serializer.validated_data['password'])
        user.save()

        html = """
        <html>
        <body style="font-family: Arial; padding: 40px;">
            <h2>Password reset successful 🎉</h2>
            <p>Your password has been updated. You can now go back to the app and log in.</p>
        </body>
        </html>
        """
        return HttpResponse(html)

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

            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Something went wrong."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

