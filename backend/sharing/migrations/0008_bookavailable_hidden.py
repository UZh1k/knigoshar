# Generated by Django 4.1.6 on 2023-03-24 10:07

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sharing", "0007_address_alter_user_address"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookavailable",
            name="hidden",
            field=models.BooleanField(default=False),
        ),
    ]