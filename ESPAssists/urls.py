from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/generate', views.generate_code, name='generate_code'),
    path('api/ota', views.send_ota, name='send_ota'),
    path('api/agent/next', views.agent_next, name='agent_next'),
    path('api/agent/reset', views.agent_reset, name='agent_reset'),
]
