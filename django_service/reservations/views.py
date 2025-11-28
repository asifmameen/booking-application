from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from .models import Product, Booking
from .serializers import ProductSerializer
from .authentication import verify_internal_token
from django.http import JsonResponse


class  ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.all()
        category = request.query_params.get("category")
        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")
        q = request.query_params.get("q")

        if category:
            qs = qs.filter(category=category)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if q:
            qs = qs.filter(name__icontains=q)

        serializer = ProductSerializer(qs, many=True)
        return Response({"success": True, "products": serializer.data})


class ReserveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not verify_internal_token(request):
            return JsonResponse(
                {"success": False, "error": "Missing internal token"}, status=403
            )

        product_id = request.data.get("product_id")
        qty = int(request.data.get("quantity", 1))
        user = request.user

        if qty < 1:
            return JsonResponse(
                {"success": False, "error": "Invalid quantity"}, status=400
            )

        try:
            with transaction.atomic():
                product = Product.objects.select_for_update().get(id=product_id)
                if product.available_quantity < qty:
                    return JsonResponse(
                        {"success": False, "error": "Not enough inventory"}, status=400
                    )

                product.available_quantity -= qty
                product.save()

                booking = Booking.objects.create(
                    user=user, product=product, quantity=qty, status="CONFIRMED"
                )

            return JsonResponse({"success": True, "booking_id": str(booking.id)})

        except Product.DoesNotExist:
            return JsonResponse(
                {"success": False, "error": "Product not found"}, status=404
            )
        except Exception as e:
            return JsonResponse({"success": False, "error": "Server error"}, status=500)
