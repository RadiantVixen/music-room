"""
Action Logging utility.

Call log_action(request, action, detail) from any view to record an action.
The request object is used to extract: user, IP, platform, device, app_version.

Headers read from the client:
  X-Platform     : 'iOS' | 'Android' | 'Web'
  X-Device       : device model / identifier string
  X-App-Version  : semantic version string, e.g. '1.2.3'
"""

import json
from .models import ActionLog


def get_client_ip(request):
    """Extract the real client IP, respecting common proxy headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(request, action: str, detail: str = '', extra: dict = None):
    """
    Create an ActionLog entry.

    :param request:  DRF / Django request object
    :param action:   Short identifier string, e.g. 'login', 'room_created'
    :param detail:   Human-readable or JSON string with extra context
    :param extra:    Optional dict — will be JSON-serialised and merged into detail
    """
    if extra:
        try:
            detail = json.dumps({'msg': detail, **extra})
        except (TypeError, ValueError):
            pass  # keep detail as-is if serialisation fails

    user = request.user if request.user.is_authenticated else None

    ActionLog.objects.create(
        user=user,
        action=action,
        detail=detail,
        ip_address=get_client_ip(request),
        platform=request.headers.get('X-Platform', ''),
        device=request.headers.get('X-Device', ''),
        app_version=request.headers.get('X-App-Version', ''),
    )
