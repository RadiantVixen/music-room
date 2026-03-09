from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import  UserRegistrationView, ForgotPasswordView, ResetPasswordView, LogoutView, DeepLinkRedirectView
from .views import UserDetailView, ChangePasswordView, CustomTokenObtainPairView
from .views import SendPhoneOTPView, VerifyPhoneOTPView
from .adminActions import UserViewSet, ProfileViewSet, CreateStaffView, StaffListView, StaffDetailView
from .utils import grant_chat_access, get_chat_access, get_my_subscription, get_owner_phone, get_user_info
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .oauth import SocialLoginView
from .extend_schema import token_refresh_schema

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ProfileViewSet)

TokenRefreshView = token_refresh_schema(TokenRefreshView)


urlpatterns = [
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('token/refresh/', TokenRefreshView.as_view()),
    
    path('token/', CustomTokenObtainPairView.as_view()),
    path('signup/', UserRegistrationView.as_view(), name='user-register'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path("oauth/", SocialLoginView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('logout/', LogoutView.as_view(), name='logout'),


    path('deeplink/<uidb64>/<token>/', DeepLinkRedirectView.as_view(), name='deeplink-redirect'),
    path('reset-password/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Phone OTP verification
    path('phone/send-otp/', SendPhoneOTPView.as_view(), name='phone-send-otp'),
    path('phone/verify-otp/', VerifyPhoneOTPView.as_view(), name='phone-verify-otp'),

]



