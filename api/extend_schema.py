"""
All drf-spectacular @extend_schema decorators live here.
Views stay clean — just import the decorator and apply it.

Usage in views.py:
    from .extend_schema import login_schema, register_schema, ...
    @login_schema
    class MyView(...): ...
"""

from drf_spectacular.utils import (
    extend_schema, extend_schema_view,
    OpenApiResponse, OpenApiExample,
)
from .serializers import (
    LoginSerializer, TokenResponseSerializer,
    RegisterSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer,
    ResetPasswordSerializer, LogoutSerializer,
    TokenRefreshSerializer, SocialLoginSerializer,
    UserSerializer, VerifyResetCodeSerializer,
)


# ─── Auth ────────────────────────────────────────────────────────────────────

login_schema = extend_schema(
    tags=['Auth'],
    summary='Login — obtain JWT tokens',
    description=(
        'Authenticate with **email** and **password**.\n\n'
        'Returns an `access` token (lifetime: 1 day) and a `refresh` token (lifetime: 30 days).\n\n'
        'Add the access token to every protected request as:\n'
        '`Authorization: Bearer <access>`'
    ),
    request=LoginSerializer,
    responses={
        200: TokenResponseSerializer,
        401: OpenApiResponse(description='Invalid email or password'),
    },
    examples=[
        OpenApiExample(
            'Login example',
            value={'email': 'user@example.com', 'password': 'strongpassword123'},
            request_only=True,
        )
    ],
)

logout_schema = extend_schema(
    tags=['Auth'],
    summary='Logout — blacklist refresh token',
    description=(
        'Blacklists the provided `refresh_token`, effectively logging the user out.\n\n'
        'The access token remains valid until it naturally expires (1 day).\n'
        'Store neither token after calling this endpoint.'
    ),
    request=LogoutSerializer,
    responses={
        200: OpenApiResponse(description='Successfully logged out'),
        400: OpenApiResponse(description='Refresh token missing or already expired / blacklisted'),
        401: OpenApiResponse(description='Missing or invalid access token in Authorization header'),
    },
)

token_refresh_schema = extend_schema(
    tags=['Auth'],
    summary='Refresh access token',
    description=(
        'Exchange a valid `refresh` token for a new `access` token.\n\n'
        'Refresh tokens **rotate** on every use — you will receive a new refresh token too.\n'
        'The old refresh token is blacklisted immediately.'
    ),
    request=TokenRefreshSerializer,
    responses={
        200: TokenResponseSerializer,
        401: OpenApiResponse(description='Refresh token expired or blacklisted'),
    },
)


# ─── Register ────────────────────────────────────────────────────────────────

register_schema = extend_schema(
    tags=['Register'],
    summary='Register a new user',
    description=(
        'Create a new user account.\n\n'
        '- `email` must be unique across all users.\n'
        '- `password` minimum 8 characters.\n'
        '- `role` is always set to `USER` automatically — it cannot be set manually.'
    ),
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(description='User registered successfully'),
        400: OpenApiResponse(description='Validation errors — e.g. email already taken, password too short'),
    },
    examples=[
        OpenApiExample(
            'Register example',
            value={'full_name': 'john', 'email': 'john@example.com', 'password': 'Strongpass123@', 'confirm_password': 'Strongpass123@'},
            request_only=True,
        )
    ],
)


# ─── Profile ─────────────────────────────────────────────────────────────────

profile_schema = extend_schema_view(
    get=extend_schema(
        tags=['Profile'],
        summary='Get current user profile',
        description=(
            'Returns the full profile of the currently authenticated user, '
            'including nested `profile` fields (bio, phone, location, avatar, provider).'
        ),
        responses={
            200: UserSerializer,
            401: OpenApiResponse(description='Missing or invalid Authorization header'),
        },
    ),
    patch=extend_schema(
        tags=['Profile'],
        summary='Update current user profile',
        description=(
            'Partially update the authenticated user\'s profile.\n\n'
            'Send as `multipart/form-data` if uploading an avatar, otherwise `application/json`.\n'
            'All fields are optional.'
        ),
        request=UpdateProfileSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Unauthorized'),
        },
    ),
    delete=extend_schema(
        tags=['Profile'],
        summary='Delete current user account',
        description=(
            'Permanently deletes the authenticated user and cascades deletion '
            
        ),
        responses={
            200: OpenApiResponse(description='User and related data deleted successfully'),
            401: OpenApiResponse(description='Unauthorized'),
        },
    ),
)


# ─── Password ────────────────────────────────────────────────────────────────

change_password_schema = extend_schema(
    tags=['Password'],
    summary='Change password',
    description=(
        'Change the password for the currently authenticated user.\n\n'
        'The refresh token is blacklisted after this call — '
        'the user will need to log in again with the new password.'
    ),
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiResponse(description='Password updated — please log in again'),
        400: OpenApiResponse(description='Old password incorrect, or new passwords do not match'),
        401: OpenApiResponse(description='Unauthorized'),
    },
)

forgot_password_schema = extend_schema(
    tags=['Password'],
    summary='Forgot password — send reset email',
    description=(
        'Sends a password reset link to the given email address.\n\n'
        'The link opens a page that deep-links into the mobile app '
        '(`myapp://ResetPassword/<uidb64>/<token>`) with a web form fallback.\n\n'
        '**Always returns 200** regardless of whether the email exists '
        '— this prevents account enumeration attacks.'
    ),
    request=ForgotPasswordSerializer,
    responses={
        200: OpenApiResponse(description='Reset email sent (or silently ignored if email not found)'),
        400: OpenApiResponse(description='Email field missing or invalid'),
        429: OpenApiResponse(description='Too many requests — rate limited (5/min)'),
    },
)

deeplink_redirect_schema = extend_schema(
    tags=['Password'],
    summary='Password reset redirect page (opened from email)',
    description=(
        'This endpoint is opened by clicking the reset link in the email.\n\n'
        'Returns an HTML page that attempts to open the mobile app via deep link. '
        'Falls back to a web form if the app is not installed.'
    ),
    responses={200: OpenApiResponse(description='HTML page returned')},
)

reset_password_schema = extend_schema(
    tags=['Password'],
    summary='Reset password',
    description=(
        'Set a new password using the `uidb64` and `token` from the reset email.\n\n'
        '`password` and `confirm_password` must match.\n'
        'The token is single-use and expires after a short period.'
    ),
    request=ResetPasswordSerializer,
    responses={
        200: OpenApiResponse(description='Password reset successful'),
        400: OpenApiResponse(description='Invalid / expired token, or passwords do not match'),
    },
)

verify_reset_code_schema = extend_schema(
    tags=['Password'],
    summary='Verify password reset code',
    description=(
        'Verify the 6-digit code sent to the user\'s email for password reset.\n\n'
        'Returns a `reset_token` if the code is valid, which can be used to reset the password without needing the uidb64/token pair from the email link.\n'    
    ),
    request=VerifyResetCodeSerializer,
    responses={
        200: OpenApiResponse(description='Code verified, reset_token returned'),
        400: OpenApiResponse(description='Invalid code, email, or code expired/used'),
    },
)
# ─── OAuth ───────────────────────────────────────────────────────────────────

social_login_schema = extend_schema(
    tags=['OAuth'],
    summary='Social login — Google or Facebook',
    description=(
        'Authenticate using a third-party OAuth token.\n\n'
        '**Google:** pass `provider: "google"` with the `id_token` from Google Sign-In SDK.\n\n'
        '**Facebook:** pass `provider: "facebook"` with the `access_token` from Facebook Login SDK.\n\n'
        'If the email does not exist yet, a new account is created automatically.\n'
        'Returns the same JWT pair as the standard login endpoint.'
    ),
    request=SocialLoginSerializer,
    responses={
        200: TokenResponseSerializer,
        400: OpenApiResponse(description='Missing/invalid provider or token, OAuth verification failed'),
    },
    examples=[
        OpenApiExample(
            'Google login',
            value={'provider': 'google', 'token': 'eyJhbGciOiJS...'},
            request_only=True,
        ),
        OpenApiExample(
            'Facebook login',
            value={'provider': 'facebook', 'token': 'EAABsbCS...'},
            request_only=True,
        ),
    ],
)
