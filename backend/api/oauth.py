from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
import requests
from .serializers import SocialLoginSerializer, UserSerializer
from .extend_schema import social_login_schema

User = get_user_model()


def verify_google_id_token(token):
    print("Verifying Google ID token...")  # Debug log
    try:
        # Support multiple audiences (Client IDs from Web, Android, iOS)
        audience = settings.GOOGLE_ALLOWED_CLIENT_IDS if settings.GOOGLE_ALLOWED_CLIENT_IDS else settings.GOOGLE_CLIENT_ID
        # print settings.GOOGLE_ALLOWED_CLIENT_IDS
        print(f"Google allowed client IDs: {settings.GOOGLE_ALLOWED_CLIENT_IDS}")  # Debug log
        print(f"Using Google audience: {token}")  # Debug log
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience
        )
        
        print("Google ID token verified. Payload:", idinfo)  # Debug log
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            return None, "Wrong issuer."
        print("Google token issuer verified.")  # Debug log

        if not idinfo.get("email_verified"):
            return None, "Email not verified by Google."
        print("Google email verified.")  # Debug log
        return {
            "email": idinfo["email"],
            "first_name": idinfo.get("given_name", ""),
            "last_name": idinfo.get("family_name", ""),
        }, None

    except ValueError:
        # Bad token signature / expired
        return None, "Invalid or expired Google token."
    except Exception as e:
        # Network error, Google outage, etc.
        return None, f"Google verification failed: {e}"


def verify_facebook_token(token):
    app_id = settings.FACEBOOK_CLIENT_ID
    app_secret = settings.FACEBOOK_CLIENT_SECRET

    if not app_id or not app_secret or app_id.startswith('your-') or app_secret.startswith('your-'):
        return None, 'Facebook OAuth is not configured. Set FACEBOOK_OAUTH_CLIENT_ID and FACEBOOK_OAUTH_CLIENT_SECRET.'

    app_token = f"{app_id}|{app_secret}"

    debug_url = "https://graph.facebook.com/debug_token"
    user_url = "https://graph.facebook.com/me?fields=id,email,first_name,last_name"

    try:
        debug_response = requests.get(
            debug_url,
            params={"input_token": token, "access_token": app_token},
            timeout=5,
        ).json()
    except requests.RequestException as e:
        return None, f"Could not reach Facebook: {e}"

    if not debug_response.get("data", {}).get("is_valid"):
        return None, "Invalid or expired Facebook token."

    try:
        user_response = requests.get(
            user_url,
            params={"access_token": token},
            timeout=5,
        ).json()
    except requests.RequestException as e:
        return None, f"Could not fetch Facebook user info: {e}"

    return {
        "email": user_response.get("email"),
        "first_name": user_response.get("first_name", ""),
        "last_name": user_response.get("last_name", ""),
    }, None


@social_login_schema
class SocialLoginView(APIView):
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        print("Received social login request:", request.data)  # Debug log
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        provider = serializer.validated_data['provider']
        token = serializer.validated_data['token']
        print(f"Processing {provider} login with token: {token[:10]}...")  # Debug log

        if provider == "google":
            user_data, error = verify_google_id_token(token)
        elif provider == "facebook":
            user_data, error = verify_facebook_token(token)
        else:
            return Response(
                {"error": "Invalid provider"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"User data from {provider}: {user_data}, error: {error}")  # Debug log

        if not user_data or not user_data.get("email"):
            return Response(
                {"error": error or "OAuth verification failed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"Creating or updating user for email: {user_data['email']}")  # Debug log
        user, created = User.objects.get_or_create(
            email=user_data["email"],
            defaults={
                "username": user_data["email"],
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
            }
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'message': 'OAuth login successful.',
                'data': {
                    'user': UserSerializer(user, context={'request': request}).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )