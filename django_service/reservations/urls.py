from django.urls import path
from .views import ProductListView, ReserveView

urlpatterns = [
    path('products/', ProductListView.as_view(), name='products'),
    path('reserve/', ReserveView.as_view(), name='reserve'),
]
