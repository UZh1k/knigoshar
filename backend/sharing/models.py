from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    tg_id = models.IntegerField(unique=True)
    tg_username = models.CharField(max_length=128, null=True, blank=True)
    first_name = models.CharField(_('first name'), max_length=100, blank=True)
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    is_active = models.BooleanField(_('active'), default=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, default='default_avatar.png')
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    address = models.ForeignKey('Address', on_delete=models.SET_NULL, related_name='users', null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'tg_id'
    REQUIRED_FIELDS = []

    def __str__(self):
        return str(self.tg_id)

    def get_closed_from_orders_count(self):
        return self.from_orders.filter(accepted_by_from_user=True, accepted_by_to_user=True).count()

    def get_closed_to_orders_count(self):
        return self.to_orders.filter(accepted_by_from_user=True, accepted_by_to_user=True).count()

    def get_books_available(self):
        return self.books_available.filter(hidden=False).all()

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')


class Author(models.Model):
    first_name = models.CharField(max_length=256, null=True, blank=True)
    last_name = models.CharField(max_length=256)

    def __str__(self):
        return self.last_name


class Book(models.Model):
    title = models.CharField(max_length=256)
    author = models.ForeignKey(Author, on_delete=models.SET_NULL, related_name='books', null=True, blank=True)

    def __str__(self):
        return self.title if not self.author else f'{self.author.last_name} {self.title}'


class Message(models.Model):
    text = models.TextField(blank=True, null=True)
    is_read = models.BooleanField(default=False)

    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')

    message_id = models.IntegerField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='messages', null=True, blank=True)


class BookAvailable(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='books_available')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='books_available')
    hidden = models.BooleanField(default=False)


class Order(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='from_orders')  # giver
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='to_orders')  # taker

    book_available = models.ForeignKey(BookAvailable, on_delete=models.SET_NULL, related_name='order',
                                       null=True, blank=True)
    accepted_by_from_user = models.BooleanField(default=False)
    accepted_by_to_user = models.BooleanField(default=False)

    rejected = models.BooleanField(default=False)

    date_open = models.DateTimeField(auto_now_add=True)
    date_close = models.DateTimeField(null=True, blank=True)


class ProgressBarSession(models.Model):
    percent = models.IntegerField(default=0)
    stage = models.CharField(default='Загрузка...', max_length=250)
    result = models.JSONField(default=list)


class Address(models.Model):
    name = models.CharField(max_length=256, unique=True)
    longitude = models.FloatField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)

    def __str__(self):
        if self.longitude and self.latitude:
            return f"{self.name} {self.longitude} {self.latitude}"
        return self.name
