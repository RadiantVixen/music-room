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

# ─── Friends ──────────────────────────────────────────────────────────────────
from .views_friends import (
    SendFriendRequestView, FriendRequestDetailView,
    FriendListView, PendingFriendRequestsView, SentFriendRequestsView,
    RemoveFriendView, UserSearchView,
)

# ─── Rooms ────────────────────────────────────────────────────────────────────
from .views_rooms import (
    RoomListCreateView, RoomDetailView, RoomMembersView,
    InviteToRoomView, RoomInvitationResponseView,
    KickMemberView, LeaveRoomView, MyRoomsView, MyInvitationsView,
)

# ─── Music Preferences ────────────────────────────────────────────────────────
from .views_music_prefs import MusicPreferencesView

# ─── Action Logs (admin) ──────────────────────────────────────────────────────
from .views_logs import ActionLogListView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profiles', ProfileViewSet)

TokenRefreshView = token_refresh_schema(TokenRefreshView)


urlpatterns = [
    # ── API docs ──────────────────────────────────────────────────────────────
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ── Auth / tokens ─────────────────────────────────────────────────────────
    path('token/refresh/', TokenRefreshView.as_view()),
    path('token/', CustomTokenObtainPairView.as_view()),
    path('signup/', UserRegistrationView.as_view(), name='user-register'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('oauth/', SocialLoginView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # ── Password reset deeplink ───────────────────────────────────────────────
    path('deeplink/<uidb64>/<token>/', DeepLinkRedirectView.as_view(), name='deeplink-redirect'),
    path('reset-password/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset-password'),

    # ── Phone OTP verification ────────────────────────────────────────────────
    path('phone/send-otp/', SendPhoneOTPView.as_view(), name='phone-send-otp'),
    path('phone/verify-otp/', VerifyPhoneOTPView.as_view(), name='phone-verify-otp'),

    # ── Music preferences ─────────────────────────────────────────────────────
    path('music-preferences/', MusicPreferencesView.as_view(), name='music-preferences'),

    # ── Friends ───────────────────────────────────────────────────────────────
    path('friends/', FriendListView.as_view(), name='friend-list'),
    path('friends/request/', SendFriendRequestView.as_view(), name='friend-request-send'),
    path('friends/request/<int:pk>/', FriendRequestDetailView.as_view(), name='friend-request-detail'),
    path('friends/requests/pending/', PendingFriendRequestsView.as_view(), name='friend-requests-pending'),
    path('friends/requests/sent/', SentFriendRequestsView.as_view(), name='friend-requests-sent'),
    path('friends/<int:user_id>/', RemoveFriendView.as_view(), name='friend-remove'),

    # ── User search ───────────────────────────────────────────────────────────
    path('users/search/', UserSearchView.as_view(), name='user-search'),

    # ── Rooms ─────────────────────────────────────────────────────────────────
    path('rooms/', RoomListCreateView.as_view(), name='room-list-create'),
    path('rooms/mine/', MyRoomsView.as_view(), name='room-mine'),
    path('rooms/invitations/', MyInvitationsView.as_view(), name='room-my-invitations'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<int:pk>/members/', RoomMembersView.as_view(), name='room-members'),
    path('rooms/<int:pk>/invite/', InviteToRoomView.as_view(), name='room-invite'),
    path('rooms/<int:pk>/invitation/', RoomInvitationResponseView.as_view(), name='room-invitation-response'),
    path('rooms/<int:pk>/members/<int:user_id>/', KickMemberView.as_view(), name='room-kick'),
    path('rooms/<int:pk>/leave/', LeaveRoomView.as_view(), name='room-leave'),

    # ── Internal service endpoints ────────────────────────────────────────────
    path('internal/chat-access/', grant_chat_access, name='grant-chat-access'),
    path('internal/chat-access/check/', get_chat_access, name='get-chat-access'),
    path('internal/subscription/', get_my_subscription, name='get-subscription'),
    path('internal/user/', get_user_info, name='get-user-info'),
    path('internal/owner-phone/', get_owner_phone, name='get-owner-phone'),

    # ── Admin: user management (DRF ViewSets) ────────────────────────────────
    path('admin/', include(router.urls)),
    path('admin/staff/', CreateStaffView.as_view(), name='create-staff'),
    path('admin/staff/list/', StaffListView.as_view(), name='staff-list'),
    path('admin/staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),

    # ── Admin: action logs ────────────────────────────────────────────────────
    path('admin/logs/', ActionLogListView.as_view(), name='action-logs'),
]


