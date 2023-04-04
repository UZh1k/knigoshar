# Generated by Django 4.1.6 on 2023-03-24 10:56

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("sharing", "0008_bookavailable_hidden"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="book_available",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="order",
                to="sharing.bookavailable",
            ),
        ),
    ]