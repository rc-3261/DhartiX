from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import BuyerProfile, FarmerProfile, User
from crops.models import Crop
from fields.models import Field
from marketplace.models import Product, ProductCategory
from orders.models import Cart, CartItem, Order, OrderItem
from resources.models import Resource
from sensors.models import SensorDevice, SensorReading
from tasks.models import Task


class Command(BaseCommand):
    help = 'Seed the database with demo users and data.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # Users
        admin, _ = User.objects.update_or_create(
            username='admin',
            defaults={'email': 'admin@dhartix.com', 'role': 'ADMIN', 'is_staff': True,
                      'is_superuser': True, 'first_name': 'System', 'last_name': 'Admin'},
        )
        admin.set_password('admin123')
        admin.save()

        farmer, _ = User.objects.update_or_create(
            username='farmer',
            defaults={'email': 'farmer@dhartix.com', 'role': 'FARMER',
                      'first_name': 'Ravi', 'last_name': 'Kumar', 'phone': '9876543210'},
        )
        farmer.set_password('farmer123')
        farmer.save()
        FarmerProfile.objects.update_or_create(
            user=farmer,
            defaults={'farm_name': 'Green Valley Farms', 'location': 'Sangli, Maharashtra',
                      'bio': 'Organic farming focused on vegetables and grains.'},
        )

        buyer, _ = User.objects.update_or_create(
            username='buyer',
            defaults={'email': 'buyer@dhartix.com', 'role': 'BUYER',
                      'first_name': 'Priya', 'last_name': 'Sharma', 'phone': '9123456780'},
        )
        buyer.set_password('buyer123')
        buyer.save()
        BuyerProfile.objects.update_or_create(
            user=buyer,
            defaults={'address': 'MG Road, Pune', 'city': 'Pune', 'phone': '9123456780'},
        )

        buyer2, _ = User.objects.update_or_create(
            username='buyer2',
            defaults={'email': 'buyer2@dhartix.com', 'role': 'BUYER',
                      'first_name': 'Amit', 'last_name': 'Patel'},
        )
        buyer2.set_password('buyer123')
        buyer2.save()

        # Farm / Fields / Crops
        farm, _ = farmer.farms.get_or_create(
            name='Green Valley Main Farm',
            defaults={'location': 'Sangli, Maharashtra', 'area': 12.5, 'soil_type': 'LOAMY',
                      'irrigation_type': 'DRIP'},
        )
        farm2, _ = farmer.farms.get_or_create(
            name='River Side Farm',
            defaults={'location': 'Kolhapur Road', 'area': 7.0, 'soil_type': 'ALLUVIAL',
                      'irrigation_type': 'SPRINKLER'},
        )

        field1, _ = farm.fields.get_or_create(
            name='North Field',
            defaults={'area': 5.0, 'soil_type': 'LOAMY', 'irrigation_type': 'DRIP',
                      'location': 'North side, Green Valley', 'status': 'ACTIVE'},
        )
        field2, _ = farm.fields.get_or_create(
            name='South Field',
            defaults={'area': 4.5, 'soil_type': 'LOAMY', 'irrigation_type': 'DRIP',
                      'location': 'South side, Green Valley', 'status': 'ACTIVE'},
        )
        field3, _ = farm2.fields.get_or_create(
            name='River Field',
            defaults={'area': 7.0, 'soil_type': 'ALLUVIAL', 'irrigation_type': 'SPRINKLER',
                      'location': 'Near river bank', 'status': 'ACTIVE'},
        )

        crop_tomato, _ = Crop.objects.update_or_create(
            field=field1, name='Tomato',
            defaults={'variety': 'Hybrid 432', 'planting_date': date.today() - timedelta(days=30),
                      'expected_harvest_date': date.today() + timedelta(days=50),
                      'current_growth_stage': 'VEGETATIVE', 'quantity': 200, 'status': 'GROWING'},
        )
        crop_wheat, _ = Crop.objects.update_or_create(
            field=field2, name='Wheat',
            defaults={'variety': 'HD-3086', 'planting_date': date.today() - timedelta(days=70),
                      'expected_harvest_date': date.today() + timedelta(days=30),
                      'current_growth_stage': 'FLOWERING', 'quantity': 500, 'status': 'GROWING'},
        )
        crop_rice, _ = Crop.objects.update_or_create(
            field=field3, name='Rice',
            defaults={'variety': 'Basmati', 'planting_date': date.today() - timedelta(days=90),
                      'expected_harvest_date': date.today() + timedelta(days=15),
                      'current_growth_stage': 'MATURITY', 'quantity': 1200, 'status': 'READY'},
        )

        # Sensors
        sensor_data = [
            (field1, 'Soil Moisture Sensor A', 'SOIL_MOISTURE', '%', 42),
            (field1, 'Temperature Sensor A', 'TEMPERATURE', 'C', 27),
            (field1, 'Humidity Sensor A', 'HUMIDITY', '%', 63),
            (field2, 'Soil Moisture Sensor B', 'SOIL_MOISTURE', '%', 55),
            (field2, 'Temperature Sensor B', 'TEMPERATURE', 'C', 28),
            (field3, 'Soil Moisture Sensor C', 'SOIL_MOISTURE', '%', 38),
        ]
        idx = 0
        for field, name, dtype, unit, base in sensor_data:
            device, _ = SensorDevice.objects.get_or_create(
                field=field, name=name,
                defaults={'device_type': dtype, 'status': 'ONLINE',
                          'device_id': f'demo-{dtype.lower()}-{field.id}-{idx}'},
            )
            device.status = 'ONLINE'
            device.save()
            # generate 10 days of readings
            existing = device.readings.count()
            for day in range(max(existing, 1), 11):
                value = base + ((day * 7) % 9) - 4
                if not device.readings.filter(
                        timestamp__date=timezone.now().date() - timedelta(days=11 - day)).exists():
                    SensorReading.objects.create(
                        device=device, reading_type=dtype, value=float(value), unit=unit,
                        timestamp=timezone.now() - timedelta(days=11 - day, hours=idx),
                    )
            latest = device.readings.first()
            if latest:
                device.last_reading_at = latest.timestamp
                device.save()
            idx += 1

        # Tasks
        for data in [
            ('Irrigate North Field tomato bed', 'IRRIGATION', field1, crop_tomato, 1, 'HIGH'),
            ('Apply fertilizer to wheat', 'FERTILIZER', field2, crop_wheat, 3, 'MEDIUM'),
            ('Pest inspection on rice', 'PEST_INSPECTION', field3, crop_rice, 5, 'MEDIUM'),
            ('Check drip lines', 'EQUIPMENT_MAINTENANCE', field1, None, 8, 'LOW'),
        ]:
            title, ttype, field, crop, days, priority = data
            Task.objects.get_or_create(
                farmer=farmer, title=title,
                defaults={'task_type': ttype, 'field': field, 'crop': crop,
                          'priority': priority, 'status': 'PENDING',
                          'due_date': date.today() + timedelta(days=days)},
            )

        # Resources
        for data in [
            ('Urea 46% N', 'FERTILIZER', 50, 'kg', 4, 'LOW_STOCK',
             date.today() - timedelta(days=20), date.today() + timedelta(days=300), 1200),
            ('Hybrid Tomato Seeds', 'SEED', 8, 'kg', 10, 'LOW_STOCK',
             date.today() - timedelta(days=45), date.today() + timedelta(days=320), 3600),
            ('Neem Oil Pesticide', 'PESTICIDE', 30, 'L', 5, 'OK',
             date.today() - timedelta(days=10), date.today() + timedelta(days=365), 1500),
            ('Drip Irrigation Kit', 'EQUIPMENT', 6, 'unit', 2, 'OK',
             date.today() - timedelta(days=90), date.today() + timedelta(days=3650), 24000),
        ]:
            name, cat, qty, unit, threshold, stock, pdate, edate, cost = data
            Resource.objects.get_or_create(
                farmer=farmer, name=name,
                defaults={'category': cat, 'quantity': qty, 'unit': unit,
                          'low_stock_threshold': threshold, 'purchase_date': pdate,
                          'expiry_date': edate, 'cost': cost, 'notes': stock},
            )

        # Categories
        categories = [
            ('Vegetables', 'Fresh seasonal vegetables'),
            ('Fruits', 'Fresh fruits from local farms'),
            ('Grains', 'Cereals and grains'),
            ('Pulses', 'Dals and legumes'),
            ('Seeds', 'Certified seeds'),
            ('Organic Products', 'Certified organic produce'),
            ('Other Agricultural Products', 'Other agri products'),
        ]
        for name, desc in categories:
            ProductCategory.objects.get_or_create(name=name, defaults={'description': desc})

        veg = ProductCategory.objects.get(name='Vegetables')
        grains = ProductCategory.objects.get(name='Grains')
        fruit = ProductCategory.objects.get(name='Fruits')

        # Products
        products = [
            ('Fresh Tomatoes', veg, 35, 100, 'kg', 'Sangli, Maharashtra'),
            ('Basmati Rice (new crop)', grains, 85, 500, 'kg', 'Kolhapur Road'),
            ('Wheat Grain', grains, 32, 800, 'kg', 'Sangli, Maharashtra'),
            ('Farm Fresh Bananas', fruit, 40, 60, 'dozen', 'Sangli, Maharashtra'),
        ]
        for name, cat, price, qty, unit, loc in products:
            Product.objects.update_or_create(
                farmer=farmer, name=name,
                defaults={'category': cat, 'price': price, 'quantity': qty, 'unit': unit,
                          'location': loc, 'availability': True, 'status': 'PUBLISHED'},
            )

        # Sample order
        product = Product.objects.filter(farmer=farmer).first()
        if product and not Order.objects.filter(buyer=buyer).exists():
            order = Order.objects.create(
                buyer=buyer, total=product.price * 5, status='CONFIRMED',
                payment_method='COD', payment_status='PENDING',
                shipping_address='MG Road, Pune',
            )
            OrderItem.objects.create(
                order=order, product=product, farmer=farmer,
                product_name=product.name, quantity=5, price=product.price, status='CONFIRMED',
            )
            product.quantity -= 5
            product.save()
            cart, _ = Cart.objects.get_or_create(buyer=buyer)
            CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': 2})

        self.stdout.write(self.style.SUCCESS(
            'Done! Login users -> admin/admin123, farmer/farmer123, buyer/buyer123'))