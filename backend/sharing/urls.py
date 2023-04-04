from django.urls import path
import rest_framework.routers

from .views import *

router = rest_framework.routers.DefaultRouter()
router.register('books', BookViewSet)
router.register('books_available', BookAvailableViewSet)
router.register('api/v1/books_available', BookAvailableViewSet)  # Todo: delete this

urlpatterns = router.urls
urlpatterns += [
    path('telegram_login', LoginByTelegram.as_view()),
    path('set_name', SetName.as_view()),
    path('get_user', GetUserInfo.as_view()),
    path('get_user_full', GetUserFullInfo.as_view()),
    path('refresh_user', RefreshUser.as_view()),
    path('upload_bookshelf', UploadBookshelf.as_view()),
    path('get_progress', GetProgressBar.as_view()),
    path('update_books', UpdateBooksAvailable.as_view()),
    path('get_books_by_string', GetBooksByString.as_view()),
    path('remove_book', RemoveBookAvailable.as_view()),
    path('create_order', CreateOrder.as_view()),
    path('reject_order', RejectOrder.as_view()),
    path('accept_order', AcceptOrder.as_view()),
    path('get_messages', GetMessages.as_view()),
    path('create_message', CreateMessage.as_view()),
]