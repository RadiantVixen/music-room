"""
Action Log admin views (staff / superuser only).
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import serializers
from drf_spectacular.utils import extend_schema

from .models import ActionLog
from .permissions import IsStaffRoleUser


class ActionLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)

    class Meta:
        model = ActionLog
        fields = [
            'id', 'user_id', 'user_email', 'action', 'detail',
            'ip_address', 'platform', 'device', 'app_version', 'created_at',
        ]
        read_only_fields = fields

class ActionLogListResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    offset = serializers.IntegerField()
    limit = serializers.IntegerField()
    results = ActionLogSerializer(many=True)


class ActionLogListView(APIView):
    """
    GET /api/admin/logs/
    Returns paginated action logs. Staff / admin only.
    Query params:
      ?user_id=<id>     filter by user
      ?action=<str>     filter by action name (exact)
      ?limit=<n>        default 50, max 500
      ?offset=<n>       pagination offset
    """
    permission_classes = [IsAuthenticated, IsStaffRoleUser]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        tags=['Admin'],
        operation_id='admin_action_logs_list',
        responses={200: ActionLogListResponseSerializer},
    )
    def get(self, request):
        qs = ActionLog.objects.select_related('user')

        user_id = request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)

        action = request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)

        try:
            limit = min(int(request.query_params.get('limit', 50)), 500)
            offset = int(request.query_params.get('offset', 0))
        except ValueError:
            return Response({'detail': 'limit and offset must be integers.'}, status=status.HTTP_400_BAD_REQUEST)

        total = qs.count()
        qs = qs[offset: offset + limit]
        return Response({
            'count': total,
            'offset': offset,
            'limit': limit,
            'results': ActionLogSerializer(qs, many=True).data,
        })
