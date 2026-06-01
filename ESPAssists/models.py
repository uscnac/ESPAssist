from django.db import models

class Entry(models.Model):
    prompt = models.TextField(blank=True, default='')   
    code = models.TextField(blank=True, default='')     
    feedback = models.TextField(blank=True, default='') 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Entry {self.id} — {self.created_at:%Y-%m-%d %H:%M}"
