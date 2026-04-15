"""URL patterns for the Music Control Delegation service."""

from django.urls import path
from .views import (
    DeviceListCreateView,
    DelegateControlView,
    RevokeControlView,
    DeviceStatusView,
    ControlActionView,
)

urlpatterns = [
    path('<int:room_id>/devices/', DeviceListCreateView.as_view(), name='delegation-devices'),
    path('<int:room_id>/devices/<int:device_id>/delegate/', DelegateControlView.as_view(), name='delegation-delegate'),
    path('<int:room_id>/devices/<int:device_id>/revoke/', RevokeControlView.as_view(), name='delegation-revoke'),
    path('<int:room_id>/devices/<int:device_id>/status/', DeviceStatusView.as_view(), name='delegation-status'),
    path('<int:room_id>/devices/<int:device_id>/control/', ControlActionView.as_view(), name='delegation-control'),
]
