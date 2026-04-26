from rest_framework.permissions import BasePermission


class IsPremiumUser(BasePermission):
    """
    Grants access only to users with an active PremiumSubscription.
    Safe to use even if the user has no subscription row yet.
    """
    message = "A premium subscription is required to access this feature."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.premiumsubscription.is_premium
        except Exception:
            return False
