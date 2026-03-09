# Generated migration — adds MusicPreferences, FriendRequest, Room,
# RoomMembership, ActionLog models (chat / phone models already exist).

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_phone_otp'),
    ]

    operations = [
        # ── MusicPreferences ───────────────────────────────────────────────
        migrations.CreateModel(
            name='MusicPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('favorite_genres', models.JSONField(blank=True, default=list,
                                                     help_text='List of genre strings, e.g. ["rock", "jazz"]')),
                ('favorite_artists', models.JSONField(blank=True, default=list,
                                                      help_text='List of artist name strings')),
                ('favorite_tracks', models.JSONField(blank=True, default=list,
                                                     help_text='List of track identifiers or names')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('profile', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='music_preferences',
                    to='api.profile',
                )),
            ],
        ),

        # ── FriendRequest ──────────────────────────────────────────────────
        migrations.CreateModel(
            name='FriendRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('accepted', 'Accepted'),
                        ('declined', 'Declined'),
                        ('blocked', 'Blocked'),
                    ],
                    default='pending',
                    max_length=10,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('sender', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sent_friend_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('receiver', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='received_friend_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='friendrequest',
            constraint=models.UniqueConstraint(
                fields=['sender', 'receiver'], name='unique_friend_request'
            ),
        ),

        # ── Room ───────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='Room',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('room_type', models.CharField(
                    choices=[
                        ('vote', 'Music Track Vote'),
                        ('delegation', 'Music Control Delegation'),
                        ('playlist', 'Music Playlist Editor'),
                    ],
                    max_length=20,
                )),
                ('visibility', models.CharField(
                    choices=[('public', 'Public'), ('private', 'Private')],
                    default='public',
                    max_length=10,
                )),
                ('license_type', models.CharField(
                    choices=[
                        ('default', 'Default (everyone)'),
                        ('invited', 'Invited users only'),
                        ('location', 'Location / time restricted'),
                    ],
                    default='default',
                    max_length=20,
                )),
                ('geo_lat', models.FloatField(blank=True, null=True,
                                              help_text='Latitude for location restriction')),
                ('geo_lon', models.FloatField(blank=True, null=True,
                                              help_text='Longitude for location restriction')),
                ('geo_radius_meters', models.PositiveIntegerField(blank=True, null=True,
                                                                   help_text='Radius in meters for geo-fencing')),
                ('active_from', models.DateTimeField(blank=True, null=True,
                                                      help_text='Voting/editing allowed from')),
                ('active_until', models.DateTimeField(blank=True, null=True,
                                                       help_text='Voting/editing allowed until')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='owned_rooms',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),

        # ── RoomMembership ─────────────────────────────────────────────────
        migrations.CreateModel(
            name='RoomMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('accepted', 'Accepted'),
                        ('declined', 'Declined'),
                        ('kicked', 'Kicked'),
                    ],
                    default='pending',
                    max_length=10,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('room', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='memberships',
                    to='api.room',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='room_memberships',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('invited_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='sent_invitations',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='roommembership',
            constraint=models.UniqueConstraint(
                fields=['room', 'user'], name='unique_room_membership'
            ),
        ),

        # ── ActionLog ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name='ActionLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=100,
                                             help_text='Short action identifier, e.g. "login", "room_created"')),
                ('detail', models.TextField(blank=True,
                                            help_text='JSON or human-readable extra context')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('platform', models.CharField(blank=True, max_length=50,
                                               help_text='e.g. "iOS", "Android", "Web"')),
                ('device', models.CharField(blank=True, max_length=100,
                                             help_text='Device model or identifier')),
                ('app_version', models.CharField(blank=True, max_length=20,
                                                  help_text='Client app version, e.g. "1.2.3"')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='action_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
