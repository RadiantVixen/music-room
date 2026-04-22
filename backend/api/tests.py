from rest_framework import status
from rest_framework.test import APITestCase

from .models import CustomUser, UserRole


class AuthAndUserApiTests(APITestCase):
	def test_signup_returns_user_and_tokens(self):
		payload = {
			'full_name': 'Test User',
			'phone': '+212600000000',
			'email': 'signup@example.com',
			'password': 'StrongPass1!',
			'confirm_password': 'StrongPass1!',
		}

		response = self.client.post('/api/signup/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertIn('data', response.data)
		self.assertIn('user', response.data['data'])
		self.assertIn('access', response.data['data'])
		self.assertIn('refresh', response.data['data'])
		self.assertEqual(response.data['data']['user']['email'], payload['email'])

	def test_change_password_allows_login_with_new_password(self):
		user = CustomUser.objects.create_user(
			username='changepass',
			email='changepass@example.com',
			password='OldPass1!',
		)

		login_response = self.client.post(
			'/api/token/',
			{'email': user.email, 'password': 'OldPass1!'},
			format='json',
		)
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)

		access = login_response.data['access']
		refresh = login_response.data['refresh']
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

		change_response = self.client.post(
			'/api/change-password/',
			{
				'old_password': 'OldPass1!',
				'new_password': 'NewPass1!',
				'confirm_password': 'NewPass1!',
				'refresh_token': refresh,
			},
			format='json',
		)
		self.assertEqual(change_response.status_code, status.HTTP_200_OK)

		old_login_response = self.client.post(
			'/api/token/',
			{'email': user.email, 'password': 'OldPass1!'},
			format='json',
		)
		self.assertEqual(old_login_response.status_code, status.HTTP_401_UNAUTHORIZED)

		new_login_response = self.client.post(
			'/api/token/',
			{'email': user.email, 'password': 'NewPass1!'},
			format='json',
		)
		self.assertEqual(new_login_response.status_code, status.HTTP_200_OK)

	def test_staff_can_crud_users(self):
		staff = CustomUser.objects.create_user(
			username='staffuser',
			email='staff@example.com',
			password='StaffPass1!',
			role=UserRole.STAFF,
		)
		target = CustomUser.objects.create_user(
			username='targetuser',
			email='target@example.com',
			password='TargetPass1!',
		)
		victim = CustomUser.objects.create_user(
			username='victimuser',
			email='victim@example.com',
			password='VictimPass1!',
		)

		token_response = self.client.post(
			'/api/token/',
			{'email': staff.email, 'password': 'StaffPass1!'},
			format='json',
		)
		self.assertEqual(token_response.status_code, status.HTTP_200_OK)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}")

		list_response = self.client.get('/api/users/')
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertIn('data', list_response.data)

		retrieve_response = self.client.get(f'/api/users/{target.id}/')
		self.assertEqual(retrieve_response.status_code, status.HTTP_200_OK)
		self.assertEqual(retrieve_response.data['data']['id'], target.id)

		patch_response = self.client.patch(
			f'/api/users/{target.id}/',
			{'first_name': 'Updated'},
			format='json',
		)
		self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
		self.assertEqual(patch_response.data['data']['first_name'], 'Updated')

		delete_response = self.client.delete(f'/api/users/{victim.id}/')
		self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
