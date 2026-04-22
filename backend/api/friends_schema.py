from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import PublicUserSerializer, FriendRequestSerializer

# ===== Friends List =====
friends_list_schema = extend_schema(
    tags=["Friends"],
    summary="Get friends list",
    description="Returns all accepted friends of the current user.",
    responses=PublicUserSerializer(many=True),
)

# ===== Pending Requests =====
pending_requests_schema = extend_schema(
    tags=["Friends"],
    summary="Get pending friend requests",
    responses=FriendRequestSerializer(many=True),
)

# ===== Sent Requests =====
sent_requests_schema = extend_schema(
    tags=["Friends"],
    summary="Get sent friend requests",
    responses=FriendRequestSerializer(many=True),
)

# ===== Send Friend Request =====
send_request_schema = extend_schema(
    tags=["Friends"],
    summary="Send friend request",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "receiver_id": {"type": "integer"},
            },
            "required": ["receiver_id"],
        }
    },
    responses={
        201: OpenApiResponse(description="Friend request sent"),
        400: OpenApiResponse(description="Validation error"),
    },
)

# ===== Respond to Request =====
respond_request_schema = extend_schema(
    tags=["Friends"],
    summary="Respond to friend request",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["accept", "decline", "block"],
                }
            },
            "required": ["action"],
        }
    },
    responses={
        200: OpenApiResponse(description="Request handled"),
        400: OpenApiResponse(description="Invalid action"),
    },
)

# ===== Remove Friend =====
remove_friend_schema = extend_schema(
    tags=["Friends"],
    summary="Remove a friend",
    responses={
        204: OpenApiResponse(description="Friend removed"),
    },
)

# ===== Search Users =====
search_users_schema = extend_schema(
    tags=["Friends"],
    summary="Search users",
    parameters=[
        {
            "name": "q",
            "required": True,
            "in": "query",
            "description": "Search query",
            "schema": {"type": "string"},
        }
    ],
    responses=PublicUserSerializer(many=True),
)