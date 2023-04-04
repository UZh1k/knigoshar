import os
import shutil
import sys

import django
from PIL import ImageFile, Image
import easyocr
import Levenshtein

ImageFile.LOAD_TRUNCATED_IMAGES = True


sys.path.append('..')
sys.path.append('.')
sys.path.append('sharing')
sys.path.append('../sharing')


os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
django.setup()

from sharing.models import Author, Book, User
from sharing.serializers import BookSerializer


EXCEPTION_TITLES = ['произведения', 'повести', 'рассказы', 'поэмы', 'стихотворения', 'сочинения', 'пьесы']


def collect_books(image, user, progress_bar):
    im = Image.open(image)
    image_path = '/'.join(image.split('/')[:-1])
    rotations = [90, 180, 270]

    progress_bar.stage = 'Идет поиск текста на изображении...'
    progress_bar.percent = 10
    progress_bar.save()

    reader = easyocr.Reader(['ru'])
    result = reader.readtext(image, detail=0)
    progress_bar.percent = 20
    progress_bar.save()

    for rotation in rotations:
        rotated_image = f'{image_path}/photo_{rotation}.jpg'
        im.rotate(rotation).save(rotated_image, 'jpeg')
        result.extend(reader.readtext(rotated_image, detail=0))
        progress_bar.percent += 20
        progress_bar.save()

    # print(result)
    shutil.rmtree(image_path)
    progress_bar.stage = 'Идет сопоставление текста с базой книг...'
    progress_bar.save()

    all_books = Book.objects.all()
    result_books = set()

    for i, el in enumerate(result):
        if len(el) <= 2:
            continue

        el_lower = el.lower()
        similarity_dict = {}

        if el_lower in EXCEPTION_TITLES and i >= 1:
            full_title = f'{result[i-1]} {el_lower}'.lower()
            for book in all_books:
                if rate := Levenshtein.ratio(full_title, str(book).lower()) >= 0.65:
                    similarity_dict[book] = rate
        else:
            full_title = el
            for book in all_books:
                if rate := Levenshtein.ratio(el_lower, book.title.lower()) >= 0.65:
                    similarity_dict[book] = rate

        if similarity_dict:
            # print(full_title, '-', str(max(similarity_dict, key=lambda x: similarity_dict[x])))
            result_books.add(max(similarity_dict, key=lambda x: similarity_dict[x]))

    progress_bar.stage = 'Готово!'
    progress_bar.percent = 100
    progress_bar.result = BookSerializer(result_books, many=True).data
    progress_bar.save()
    print(progress_bar.result)
    return result_books


if __name__ == '__main__':
    user = User.objects.first()
    collect_books(user, 'lib/tmp_books_1/photo.jpg')
