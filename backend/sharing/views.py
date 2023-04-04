import datetime
import json
import threading

import telebot
from django.contrib.auth import login
import django_filters.rest_framework
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
import rest_framework.views
import rest_framework.viewsets

from backend.settings import BOT_TOKEN
from lib.collect_books import collect_books

from .bot import bot, send_delayed_message
from .models import Author, Book, User, ProgressBarSession, BookAvailable, Address, Order, Message
from .serializers import BookSerializer, UserSerializer, UserFullInfoSerializer, ProgressBarSerializer, \
    BookAvailableSerializer, MessageSerializer
from .filters import BookAvailableFilter
from .services import telegram_login_data_check, load_image_to_tmp, get_metro_by_coords, get_coords_by_address, \
    update_user_last_seen


@csrf_exempt
def process_tg_message(request):
    try:
        bot.process_new_updates([telebot.types.Update.de_json(request.body.decode())])
    except json.decoder.JSONDecodeError as err:
        return HttpResponse(str(err))
    return HttpResponse('OK')


class LoginByTelegram(rest_framework.views.APIView):
    def post(self, request, format=None):
        init_data_raw = request.data.get('init_data')
        if not init_data_raw:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        init_data = json.loads(init_data_raw)
        if not telegram_login_data_check(BOT_TOKEN, init_data):
            return Response({'success': False, 'message': 'Incorrect data'}, 400)
        telegram_id = init_data['id']
        telegram_username = init_data.get('username', '')
        first_name = init_data.get('first_name', '')
        if not telegram_id:
            return Response({'success': False, 'error': 'No telegram id or username'}, 400)

        user, created = User.objects.get_or_create(tg_id=telegram_id)
        user.tg_username = telegram_username

        if created:
            user.first_name = first_name
            if avatar := init_data.get('photo_url'):
                user.avatar = avatar

        user.save()
        login(request, user)
        user_data = UserSerializer(user).data
        return Response({'success': True, 'user_created': created, 'user_data': user_data}, 200)


class RefreshUser(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': True, 'message': 'User is anonymous'}, 403)
        user_data = UserSerializer(user).data
        update_user_last_seen(user)
        return Response({'success': True, 'user_data': user_data}, 200)


class SetName(rest_framework.views.APIView):
    def post(self, request, format=None):
        if request.user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        first_name = request.data.get('name')
        if not first_name:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        user = request.user
        user.first_name = first_name
        user.save()
        user_data = UserSerializer(user).data
        return Response({'success': True, 'user_data': user_data}, 200)


class GetUserInfo(rest_framework.views.APIView):
    def get(self, request, format=None):
        user_data = UserSerializer(request.user).data
        return Response({'success': True, 'user_data': user_data}, 200)


class GetUserFullInfo(rest_framework.views.APIView):
    def post(self, request, format=None):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        user = User.objects.filter(id=user_id).get()
        if not user:
            return Response({'success': False, 'message': 'No such user'}, 404)
        user_data = UserFullInfoSerializer(user).data
        return Response({'success': True, 'user_data': user_data}, 200)


class UploadBookshelf(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        image = request.data.get('image')
        if not image:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        image_path = load_image_to_tmp(image, user)
        progress_bar = ProgressBarSession.objects.create()
        thread = threading.Thread(target=collect_books, args=(image_path, user, progress_bar))
        thread.start()
        update_user_last_seen(user)
        progress_data = ProgressBarSerializer(progress_bar).data
        return Response({'success': True, 'progress_data': progress_data}, 200)


class GetProgressBar(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        pb_id = request.data.get('pb_id')
        if not pb_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        progress_bar = ProgressBarSession.objects.filter(id=pb_id).get()
        progress_data = ProgressBarSerializer(progress_bar).data
        update_user_last_seen(user)
        return Response({'success': True, 'progress_data': progress_data}, 200)


class UpdateBooksAvailable(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        pb_id = request.data.get('pb_id')
        result = request.data.get('result')
        if not pb_id or not result:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        ProgressBarSession.objects.filter(id=pb_id).first().delete()
        for book_dict in result:
            if book_dict['added']:
                book = Book.objects.filter(id=book_dict['id']).first()
                BookAvailable.objects.create(user=user, book=book)
        longitude = request.data.get('longitude')
        latitude = request.data.get('latitude')
        if not user.address:
            user_address = get_metro_by_coords(longitude, latitude)
            address, created = Address.objects.get_or_create(name=user_address)
            if created:
                address.longitude, address.latitude = get_coords_by_address(user_address)
                address.save()
            user.address = address
            user.save()
        update_user_last_seen(user)
        return Response({'success': True}, 200)


class GetBooksByString(rest_framework.views.APIView):
    def get(self, request, format=None):
        string = request.GET.get('string')
        if not string:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        books_by_name = Book.objects.filter(title__icontains=string).all()
        books_by_author = Book.objects.filter(author__last_name__icontains=string).all()
        books = books_by_name | books_by_author
        books_data = BookSerializer(books, many=True).data
        return Response({'success': True, 'books': books_data}, 200)


class RemoveBookAvailable(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        book_id = request.data.get('book_id')
        if not book_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)
        book_available = BookAvailable.objects.filter(id=book_id).first()
        if request.user != book_available.user:
            return Response({'success': False, 'message': 'Forbidden'}, 403)
        book_available.delete()
        update_user_last_seen(user)
        return Response({'success': True}, 200)


class CreateOrder(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)

        message_text = request.data.get('message_text')
        book_available_id = request.data.get('book_available_id')
        if not message_text or not book_available_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)

        book_available = BookAvailable.objects.filter(id=book_available_id).first()
        if book_available.user == request.user or book_available.hidden:
            return Response({'success': False, 'message': 'Forbidden'}, 403)

        order = Order.objects.create(from_user=book_available.user, to_user=user, book_available=book_available)
        book_available.hidden = True
        book_available.save()
        message = Message.objects.create(text=message_text, from_user=user, to_user=book_available.user, order=order)
        thread = threading.Thread(target=send_delayed_message, args=(message, order))
        thread.start()
        update_user_last_seen(user)
        return Response({'success': True}, 200)


class RejectOrder(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)

        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)

        order = Order.objects.filter(id=order_id).first()
        if not order or order.from_user.id != request.user.id:
            return Response({'success': False, 'message': 'Forbidden'}, 403)

        order.rejected = True
        order.date_close = datetime.datetime.now()
        order.save()

        book_available = order.book_available
        book_available.hidden = False
        book_available.save()
        update_user_last_seen(user)
        return Response({'success': True}, 200)


class AcceptOrder(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)

        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)

        order = Order.objects.filter(id=order_id).first()
        if not order or not (order.from_user.id == request.user.id or order.to_user.id == request.user.id):
            return Response({'success': False, 'message': 'Forbidden'}, 403)

        if order.from_user.id == request.user.id:
            order.accepted_by_from_user = True
        if order.to_user.id == request.user.id:
            order.accepted_by_to_user = True

        if order.accepted_by_from_user and order.accepted_by_to_user:
            order.date_close = datetime.datetime.now()

        order.save()
        update_user_last_seen(user)
        return Response({'success': True}, 200)


class GetMessages(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        user_companion_id = request.data.get('user_companion_id')
        if not user_companion_id:
            return Response({'success': False, 'message': 'No data provided'}, 400)

        user_companion = User.objects.filter(id=user_companion_id).first()
        messages_from = Message.objects.filter(from_user=user, to_user=user_companion)
        messages_to = Message.objects.filter(to_user=user, from_user=user_companion)
        messages_to.all().update(is_read=True)
        all_messages = (messages_from | messages_to).order_by('-date').all()
        messages_data = MessageSerializer(all_messages, many=True).data
        update_user_last_seen(user)
        return Response({'success': True, 'messages': messages_data}, 200)


class CreateMessage(rest_framework.views.APIView):
    def post(self, request, format=None):
        user = request.user
        if user.is_anonymous:
            return Response({'success': False, 'message': 'User is anonymous'}, 403)
        user_companion_id = request.data.get('user_companion_id')
        message_text = request.data.get('message_text')
        if not user_companion_id or not message_text:
            return Response({'success': False, 'message': 'No data provided'}, 400)

        user_companion = User.objects.filter(id=user_companion_id).first()
        message = Message.objects.create(from_user=user, to_user=user_companion, text=message_text)
        thread = threading.Thread(target=send_delayed_message, args=(message, ))
        thread.start()

        messages_from = Message.objects.filter(from_user=user, to_user=user_companion)
        messages_to = Message.objects.filter(to_user=user, from_user=user_companion)
        all_messages = (messages_from | messages_to).order_by('-date').all()
        messages_data = MessageSerializer(all_messages, many=True).data
        update_user_last_seen(user)
        return Response({'success': True, 'messages': messages_data}, 200)


class BookViewSet(rest_framework.viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    http_method_names = ['get']


class BookAvailableViewSet(rest_framework.viewsets.ModelViewSet):
    queryset = BookAvailable.objects.filter(hidden=False).all()
    serializer_class = BookAvailableSerializer
    http_method_names = ['get']
    filter_backends = (django_filters.rest_framework.DjangoFilterBackend,)
    filterset_class = BookAvailableFilter
