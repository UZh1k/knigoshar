import datetime
import os
import hashlib
import hmac

from django.utils import timezone
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import requests

from backend.settings import YA_MAPS_APIKEY


def telegram_string_prepare(data_incoming):
    data = data_incoming.copy()
    del data['hash']
    keys = sorted(data.keys())
    string_arr = []
    for key in keys:
        if data[key] != None:
            string_arr.append(f"{key}={data[key]}")
    string_cat = '\n'.join(string_arr)
    return string_cat


def telegram_login_data_check(bot_token, tg_data):
    data_check_string = telegram_string_prepare(tg_data)
    secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()
    secret_key_bytes = secret_key
    data_check_string_bytes = bytes(data_check_string, 'utf-8')
    hmac_string = hmac.new(secret_key_bytes, data_check_string_bytes, hashlib.sha256).hexdigest()
    if hmac_string == tg_data['hash']:
        return True
    else:
        return False


def load_image_to_tmp(image, user):
    image_path = os.path.join(settings.BASE_DIR, f'lib/tmp/tmp_books_{user.id}/photo.jpg')
    default_storage.save(image_path, ContentFile(image.read()))
    return image_path


def get_metro_by_coords(longitude, latitude):
    resp = requests.get(f'https://geocode-maps.yandex.ru/1.x?geocode={longitude},{latitude}&apikey={YA_MAPS_APIKEY}'
                        '&format=json&kind=metro')
    json_data = resp.json()
    metro_station = json_data['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['metaDataProperty'][
        'GeocoderMetaData']['text']
    return metro_station


def get_coords_by_address(address):
    resp = requests.get(f'https://geocode-maps.yandex.ru/1.x?geocode={address}&apikey={YA_MAPS_APIKEY}&format=json')
    json_data = resp.json()
    coords = map(float,
                 json_data['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos'].split())
    return coords


def update_user_last_seen(user):
    user.last_seen = timezone.now()
    user.save()
