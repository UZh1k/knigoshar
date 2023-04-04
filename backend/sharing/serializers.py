import rest_framework.serializers

from .models import *


class AuthorSerializer(rest_framework.serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['first_name', 'last_name']


class BookSerializer(rest_framework.serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'author']


class AddressSerializer(rest_framework.serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['name', 'longitude', 'latitude']


class UserSerializer(rest_framework.serializers.ModelSerializer):
    avatar = rest_framework.serializers.URLField()
    address = AddressSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'avatar', 'address']


class BookAvailableSerializer(rest_framework.serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = BookAvailable
        fields = '__all__'


class OrderSerializer(rest_framework.serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    book_available = BookAvailableSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class MessageSerializer(rest_framework.serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = '__all__'


class UserFullInfoSerializer(rest_framework.serializers.ModelSerializer):
    avatar = rest_framework.serializers.URLField()
    closed_from_orders_count = rest_framework.serializers.IntegerField(source='get_closed_from_orders_count')
    closed_to_orders_count = rest_framework.serializers.IntegerField(source='get_closed_to_orders_count')
    from_orders = OrderSerializer(read_only=True, many=True)
    to_orders = OrderSerializer(read_only=True, many=True)
    books_available = BookAvailableSerializer(read_only=True, many=True, source='get_books_available')

    class Meta:
        model = User
        fields = ['id', 'first_name', 'avatar', 'address', 'from_orders', 'to_orders', 'books_available',
                  'closed_from_orders_count', 'closed_to_orders_count', 'last_seen']
        read_only_fields = (
            'closed_from_orders_count', 'closed_to_orders_count'
        )


class ProgressBarSerializer(rest_framework.serializers.ModelSerializer):

    class Meta:
        model = ProgressBarSession
        fields = '__all__'
