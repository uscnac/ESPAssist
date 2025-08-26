from django.contrib import admin
from .models import Entry


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at')
    search_fields = ('prompt', 'code', 'feedback')
    readonly_fields = ('created_at',)