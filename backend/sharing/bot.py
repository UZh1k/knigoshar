import os
import sys
import time
import threading

import django
import telebot


sys.path.append('..')
sys.path.append('.')
sys.path.append('backend')
sys.path.append('../backend')

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from backend.settings import BOT_TOKEN
from sharing.models import Message, User

bot = telebot.TeleBot(BOT_TOKEN)


@bot.message_handler(commands=['start', 'help'])
def start(message):
    bot.send_message(message.chat.id, 'Привет! Это телеграм-бот некоммерческого сервиса '
                                      'по обмену книгами "Книгошар".\n\n'
                                      'Здесь вы можете '
                                      'ответить на сообщение пользователя, который вам пишет. Для этого достаточно '
                                      'написать сообщение. Если вы хотите написать пользователю, с которым давно '
                                      'не общались, отправьте ответ на любое его сообщение.')


def send_delayed_message(message_record, order=None):
    time.sleep(7)
    message = Message.objects.filter(id=message_record.id).first()
    if not message.is_read:
        if order:
            text = f'Пользователь {message_record.from_user.first_name} запрашивает у вас книгу ' \
                   f'{order.book_available.book.author.first_name} {order.book_available.book.author.last_name} - ' \
                   f'{order.book_available.book.title}: \n\n' \
                   f'{message_record.text}'
        else:
            text = f'{message_record.from_user.first_name}: \n' \
                   f'{message_record.text}'
        msg = bot.send_message(message_record.to_user.tg_id, text)
        message_record.message_id = msg.id
        message_record.save()


@bot.message_handler(content_types=['text'])
def write_message_about_order(message):
    print(message)
    user = User.objects.filter(tg_id=message.from_user.id).first()
    if message.reply_to_message:
        last_message = Message.objects.filter(to_user=user, message_id=message.reply_to_message.id).last()
    else:
        last_message = Message.objects.filter(to_user=user).last()
    message_record = Message.objects.create(text=message.text, from_user=user, to_user=last_message.from_user)
    thread = threading.Thread(target=send_delayed_message, args=(message_record, ))
    thread.start()


if __name__ == "__main__":
    print(bot.get_me())
    bot.polling(none_stop=True)
