import os
import sys

import django
import pandas as pd


sys.path.append('..')
sys.path.append('.')
sys.path.append('sharing')
sys.path.append('../sharing')


os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
django.setup()

from sharing.models import Author, Book


def main():
    df = pd.read_csv('lib/tmp/books.csv')
    for _, row in df.iterrows():
        author = row['author']
        author_splitted = author.split()
        if len(author_splitted) != 2:
            continue
        author, _ = Author.objects.get_or_create(first_name=author_splitted[0],
                                                 last_name=author_splitted[1])
        book, _ = Book.objects.get_or_create(title=row['title'], author=author)


if __name__ == "__main__":
    main()
