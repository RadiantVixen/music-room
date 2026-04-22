from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0004_add_spotify_id_to_track'),
    ]

    operations = [
        migrations.RenameField(
            model_name='track',
            old_name='spotify_id',
            new_name='deezer_id',
        ),
        migrations.AlterField(
            model_name='track',
            name='deezer_id',
            field=models.CharField(max_length=255, help_text='Deezer track ID'),
        ),
        migrations.AlterField(
            model_name='track',
            name='audio_url',
            field=models.URLField(blank=True, null=True, help_text='Deezer 30s preview_url'),
        ),
        migrations.AlterUniqueTogether(
            name='track',
            unique_together={('room', 'deezer_id')},
        ),
    ]
