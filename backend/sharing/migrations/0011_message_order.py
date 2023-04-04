# Generated by Django 4.1.6 on 2023-03-28 09:38

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("sharing", "0010_order_rejected_alter_order_book_available"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="messages",
                to="sharing.order",
            ),
        ),
    ]