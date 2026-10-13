"""Dashboard aggregation logic."""

from collections import OrderedDict
from datetime import date, timedelta

from django.db.models import Count, Sum
from django.utils import timezone


def farmer_dashboard(user):
    farms = user.farms.all()
    farm_ids = farms.values_list('id', flat=True)
    from fields.models import Field
    from crops.models import Crop
    from sensors.models import SensorDevice, SensorReading
    from tasks.models import Task
    from resources.models import Resource
    from marketplace.models import Product
    from orders.models import OrderItem, Order

    fields = Field.objects.filter(farm_id__in=farm_ids)
    field_ids = fields.values_list('id', flat=True)
    crops = Crop.objects.filter(field_id__in=field_ids)
    active_crops = crops.exclude(status__in=['PLANNED', 'HARVESTED'])
    sensors = SensorDevice.objects.filter(field_id__in=field_ids)
    tasks = Task.objects.filter(farmer=user)
    resources = Resource.objects.filter(farmer=user)
    products = Product.objects.filter(farmer=user)
    order_items = OrderItem.objects.filter(farmer=user)
    delivered_items = order_items.exclude(status='CANCELLED')

    total_revenue = sum(float(i.subtotal) for i in delivered_items)

    # Sensor stats
    days = 7
    since = timezone.now() - timedelta(days=days)
    readings = SensorReading.objects.filter(
        device__field_id__in=field_ids, timestamp__gte=since)

    def sensor_stat(reading_type):
        sub = readings.filter(reading_type=reading_type)
        latest = sub.order_by('-timestamp').first()
        avg = sub.aggregate(a=Sum('value') / Count('id'))['a']
        return {
            'latest': latest.value if latest else None,
            'avg': round(avg, 2) if avg else None,
            'unit': latest.unit if latest else '',
        }

    soil = sensor_stat('SOIL_MOISTURE')
    temperature = sensor_stat('TEMPERATURE')
    humidity = sensor_stat('HUMIDITY')

    # Sensor history chart
    sensor_history = OrderedDict()
    for reading in readings:
        day = reading.timestamp.date().isoformat()
        entry = sensor_history.setdefault(day, {'SOIL_MOISTURE': None, 'TEMPERATURE': None, 'HUMIDITY': None})
        if entry[reading.reading_type] is None:
            entry[reading.reading_type] = reading.value
    sensor_chart = [
        {'date': d, 'soil_moisture': v['SOIL_MOISTURE'],
         'temperature': v['TEMPERATURE'], 'humidity': v['HUMIDITY']}
        for d, v in sensor_history.items()
    ]

    # Sales analytics: daily, weekly, monthly
    def sales_series(delta, freq):
        buckets = OrderedDict()
        end = date.today()
        if freq == 'D':
            for i in range(delta, -1, -1):
                buckets[(end - timedelta(days=i)).isoformat()] = 0
        elif freq == 'W':
            for i in range(delta, -1, -1):
                buckets[str(end - timedelta(weeks=i))] = 0
        else:
            for i in range(delta, -1, -1):
                buckets[str(end - timedelta(days=30 * i))[:7]] = 0
        for item in delivered_items:
            d = item.order.created_at.date()
            if freq == 'D':
                key = d.isoformat()
            elif freq == 'W':
                key = str(d - timedelta(days=d.weekday()))
            else:
                key = d.isoformat()[:7]
            if key in buckets:
                buckets[key] += float(item.subtotal)
        return [{'label': k, 'revenue': round(v, 2)} for k, v in buckets.items()]

    daily = sales_series(6, 'D')
    weekly = sales_series(8, 'W')
    monthly = sales_series(12, 'M')

    # Crop performance
    crop_performance = [
        {
            'name': c.name,
            'status': c.status,
            'growth_stage': c.current_growth_stage,
            'quantity': float(c.quantity),
            'field': c.field.name,
        }
        for c in crops
    ]

    # Recent orders (for farmer) -> items
    recent_order_items = order_items.order_by('-order__created_at')[:6]
    recent_sales = [
        {
            'order_id': i.order_id,
            'product': i.product_name,
            'quantity': int(i.quantity),
            'price': float(i.price),
            'revenue': float(i.subtotal),
            'status': i.status,
            'date': str(i.order.created_at.date()),
            'buyer': i.order.buyer.username,
        }
        for i in recent_order_items
    ]

    low_stock_resources = [
        {'name': r.name, 'quantity': float(r.quantity), 'unit': r.unit}
        for r in resources if r.is_low_stock
    ]

    return {
        'totals': {
            'farms': farms.count(),
            'fields': fields.count(),
            'active_crops': active_crops.count(),
            'pending_tasks': tasks.filter(status='PENDING').count(),
            'products_listed': products.count(),
            'orders': order_items.count(),
            'sales': delivered_items.count(),
            'revenue': round(total_revenue, 2),
            'sensors': sensors.count(),
            'active_sensors': sensors.filter(status='ONLINE').count(),
            'low_stock_resources': low_stock_resources,
        },
        'sensor_stats': {
            'soil_moisture': soil,
            'temperature': temperature,
            'humidity': humidity,
        },
        'sensor_chart': sensor_chart,
        'sales_charts': {
            'daily': daily,
            'weekly': weekly,
            'monthly': monthly,
        },
        'crop_performance': crop_performance,
        'recent_sales': recent_sales,
        'pending_tasks': [
            {
                'id': t.id,
                'title': t.title,
                'task_type': t.task_type,
                'priority': t.priority,
                'due_date': str(t.due_date or ''),
            }
            for t in tasks.filter(status='PENDING').order_by('due_date')[:6]
        ],
    }


def buyer_dashboard(user):
    from orders.models import Cart, Order
    from marketplace.models import Product

    cart = Cart.objects.filter(buyer=user).first()
    cart_items = cart.items.count() if cart else 0
    orders = Order.objects.filter(buyer=user)
    orders_data = [
        {
            'id': o.id,
            'status': o.status,
            'total': float(o.total),
            'items': o.items.count(),
            'date': str(o.created_at.date()),
        }
        for o in orders[:10]
    ]
    return {
        'totals': {
            'orders': orders.count(),
            'pending_orders': orders.filter(status='PENDING').count(),
            'delivered_orders': orders.filter(status='DELIVERED').count(),
            'total_spent': round(sum(float(o.total) for o in orders), 2),
            'cart_items': cart_items,
            'marketplace_products': Product.objects.filter(status='PUBLISHED', availability=True).count(),
        },
        'orders_by_status': list(
            orders.values('status').annotate(count=Count('id')).order_by('status')
        ),
        'recent_orders': orders_data,
        'spending_chart': [
            {
                'order': o.id,
                'total': float(o.total),
                'date': str(o.created_at.date()),
            }
            for o in orders[:12]
        ],
    }


def admin_dashboard():
    from accounts.models import User
    from farms.models import Farm
    from crops.models import Crop
    from marketplace.models import Product
    from orders.models import Order, OrderItem
    from sensors.models import SensorDevice

    total_revenue = sum(float(i.subtotal) for i in OrderItem.objects.exclude(status='CANCELLED'))

    def month_series(qs, date_field, value_field='count', agg='count'):
        items = list(qs)
        buckets = OrderedDict()
        for item in items:
            d = getattr(item, date_field)
            if d is None:
                continue
            key = d.strftime('%Y-%m')
            bucket = buckets.setdefault(key, {'month': key})
            if agg == 'count':
                bucket['count'] = bucket.get('count', 0) + 1
            else:
                bucket['revenue'] = round(bucket.get('revenue', 0) + float(item.subtotal), 2)
        return list(buckets.values())[-12:]

    user_growth = month_series(
        User.objects.filter(is_superuser=False).order_by('date_joined'), 'date_joined')
    product_listings = month_series(
        Product.objects.order_by('created_at'), 'created_at')

    orders_by_status = list(Order.objects.values('status').annotate(count=Count('id')))
    sensor_activity = list(SensorDevice.objects.values('status').annotate(count=Count('id')))

    revenue_qs = []
    for item in OrderItem.objects.select_related('order').filter(
            order__status__in=['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PROCESSING']):
        revenue_qs.append(item)
    revenue_by_month = OrderedDict()
    for item in revenue_qs:
        key = item.order.created_at.strftime('%Y-%m')
        entry = revenue_by_month.setdefault(key, {'month': key, 'revenue': 0})
        entry['revenue'] += float(item.subtotal)
    revenue_by_month = [{'month': k, 'revenue': round(v['revenue'], 2)}
                        for k, v in revenue_by_month.items()][-12:]

    return {
        'totals': {
            'users': User.objects.count(),
            'farmers': User.objects.filter(role='FARMER').count(),
            'buyers': User.objects.filter(role='BUYER').count(),
            'farms': Farm.objects.count(),
            'crops': Crop.objects.count(),
            'products': Product.objects.count(),
            'orders': Order.objects.count(),
            'revenue': round(total_revenue, 2),
            'active_iot_devices': SensorDevice.objects.filter(status='ONLINE').count(),
        },
        'charts': {
            'user_growth': [
                {'month': m['month'], 'count': m.get('count', 0)} for m in user_growth
            ],
            'product_listings': [
                {'month': m['month'], 'count': m.get('count', 0)} for m in product_listings
            ],
            'orders_by_status': [
                {'status': o['status'], 'count': o['count']} for o in orders_by_status
            ],
            'sensor_activity': [
                {'status': s['status'], 'count': s['count']} for s in sensor_activity
            ],
            'revenue_by_month': revenue_by_month,
        },
    }