from api.spotify_service import search_spotify_tracks
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SpotifyTrackSearchView, UserDetailView, ChangePasswordView, CustomTokenObtainPairView, UserListView, UserAdminDetailView
from .views import UserRegistrationView, ForgotPasswordView, ResetPasswordView, LogoutView, VerifyResetCodeView
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

    path('logout/', LogoutView.as_view(), name='logout'),

    # ── Password reset deeplink ───────────────────────────────────────────────
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('verify-reset-code/', VerifyResetCodeView.as_view(), name='verify-reset-code'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),


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
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserAdminDetailView.as_view(), name='user-detail-admin'),

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

    path('tracks/search/', SpotifyTrackSearchView.as_view(), name='spotify-track-search'),
    


    # ── Admin: action logs ────────────────────────────────────────────────────
    path('admin/logs/', ActionLogListView.as_view(), name='action-logs'),
]


