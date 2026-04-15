"""
License / permission check utility.

Centralises all room-level access control:
  - Is the room active and within its time window?
  - Does the user meet the licence requirements (default / invited / location)?
  - Is the user within the geo-fence (if applicable)?

Usage from any view:
    from api.license_utils import check_license

    allowed, reason = check_license(request.user, room, user_lat=..., user_lon=...)
    if not allowed:
        return Response({'detail': reason}, status=403)
"""

import math
from django.utils import timezone
from .models import RoomLicenseType, RoomVisibility


# ── Geo helpers ──────────────────────────────────────────────────────────────

def _haversine_meters(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.  Returns distance in **meters**.
    """
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Main check ───────────────────────────────────────────────────────────────

def check_license(user, room, user_lat=None, user_lon=None):
    """
    Validate whether *user* is allowed to perform an action inside *room*.

    Returns
    -------
    (allowed: bool, reason: str)
        ``reason`` is an empty string when allowed is True.
    """
    # 1. Room must be active
    if not room.is_active:
        return False, 'This room is no longer active.'

    # 2. Time-window check
    now = timezone.now()
    if room.active_from and now < room.active_from:
        return False, 'This room is not open yet.'
    if room.active_until and now > room.active_until:
        return False, 'This room has ended.'

    # 3. License-specific checks ──────────────────────────────────────────────

    if room.license_type == RoomLicenseType.DEFAULT:
        # Public rooms → everyone; private rooms → owner + accepted members
        if room.visibility == RoomVisibility.PUBLIC:
            return True, ''
        if room.owner == user:
            return True, ''
        if room.memberships.filter(user=user, status='accepted').exists():
            return True, ''
        return False, 'You are not a member of this private room.'

    if room.license_type == RoomLicenseType.INVITED:
        # Only owner + explicitly invited (accepted) users
        if room.owner == user:
            return True, ''
        if room.memberships.filter(user=user, status='accepted').exists():
            return True, ''
        return False, 'Only invited users can perform this action.'

    if room.license_type == RoomLicenseType.LOCATION:
        # Must be an accepted member (or owner) AND within geo-fence
        if room.owner != user:
            if not room.memberships.filter(user=user, status='accepted').exists():
                if room.visibility == RoomVisibility.PRIVATE:
                    return False, 'You are not a member of this room.'

        # Geo-fence validation
        if room.geo_lat is not None and room.geo_lon is not None and room.geo_radius_meters:
            if user_lat is None or user_lon is None:
                return False, 'Your location is required for this room.'
            distance = _haversine_meters(room.geo_lat, room.geo_lon, user_lat, user_lon)
            if distance > room.geo_radius_meters:
                return False, (
                    f'You are {int(distance)}m away — must be within '
                    f'{room.geo_radius_meters}m of the room location.'
                )

        return True, ''

    # Unknown license type — deny by default
    return False, 'Unknown license type.'
