# Generated by Django 4.1.6 on 2023-03-28 08:33

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("sharing", "0009_alter_order_book_available"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="rejected",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="order",
            name="book_available",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="order",
                to="sharing.bookavailable",
            ),
        ),
    ]