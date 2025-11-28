from django.core.management.base import BaseCommand
from reservations.models import User, Product


class Command(BaseCommand):
    help = "Seed database with admin user and products"

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin", email="admin@example.com", password="Admin@12345"
            )
            self.stdout.write(self.style.SUCCESS("Admin user created"))
        else:
            self.stdout.write("Admin already exists")

        if Product.objects.count() == 0:
            Product.objects.create(
                name="Flight A1",
                category="flight",
                price=100,
                total_quantity=100,
                available_quantity=100,
            )
            Product.objects.create(
                name="Flight B2",
                category="flight",
                price=150,
                total_quantity=50,
                available_quantity=50,
            )
            self.stdout.write(self.style.SUCCESS("Products seeded"))
        else:
            self.stdout.write("Products already seeded")
