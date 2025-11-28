from rest_framework import serializers
from .models import Product, Booking, User


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "category", "price", "available_quantity"]


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["id", "user", "product", "quantity", "status", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]
