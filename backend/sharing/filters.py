from django_filters import rest_framework as filters

from .models import BookAvailable


class BookAvailableFilter(filters.FilterSet):
    title_or_author = filters.CharFilter(field_name='title', method='get_by_title_or_author')

    def get_by_title_or_author(self, queryset, name, value):
        query_by_title = queryset.filter(book__title__icontains=value)
        query_by_author = queryset.filter(book__author__last_name__icontains=value)
        return query_by_title | query_by_author

    class Meta:
        model = BookAvailable
        fields = ['title_or_author']
