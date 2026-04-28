from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_roomplaybackstate'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='is_premium',
            field=models.BooleanField(default=False),
        ),
    ]
