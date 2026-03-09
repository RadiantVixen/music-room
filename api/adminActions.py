from rest_framework import permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser, Profile
from .serializers import UserSerializer, ProfileSerializer, ChangePasswordSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsStaffRoleUser, IsSuperUser
from django.shortcuts import get_object_or_404
from rest_framework import viewsets



class CreateStaffView(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            username=email.split('@')[0],
            role='STAFF'
        )
        return Response({'message': 'Staff user created successfully!'})


class StaffListView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        staff_users = CustomUser.objects.filter(role='STAFF')
        data = [
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "created_at": user.date_joined
            }
            for user in staff_users
        ]
        return Response(data, status=status.HTTP_200_OK)


class StaffDetailView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk, role="STAFF")
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperUser]
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer


class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperUser]
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "You can't delete your profile directly. Delete the user instead."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
