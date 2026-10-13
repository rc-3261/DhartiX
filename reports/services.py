"""Report generation helpers shared by the report API views."""

from datetime import date, timedelta

from django.db.models import Sum
from django.utils import timezone


def farm_report(farm):
    fields_data = []
    for field in farm.fields.all():
        fields_data.append({
            'id': field.id,
            'name': field.name,
            'area': float(field.area),
            'soil_type': field.soil_type,
            'irrigation_type': field.irrigation_type,
            'status': field.status,
            'crops': [
                {
                    'id': c.id,
                    'name': c.name,
                    'variety': c.variety,
                    'status': c.status,
                    'growth_stage': c.current_growth_stage,
                    'planting_date': str(c.planting_date or ''),
                    'expected_harvest_date': str(c.expected_harvest_date or ''),
                }
                for c in field.crops.all()
            ],
        })
    sensor_records = []
    for field in farm.fields.all():
        for device in field.sensors.all():
            latest = device.readings.first()
            sensor_records.append({
                'id': device.id,
                'name': device.name,
                'device_type': device.device_type,
                'status': device.status,
                'field': field.name,
                'latest_value': latest.value if latest else None,
                'latest_unit': latest.unit if latest else None,
                'last_reading_at': str(device.last_reading_at or ''),
            })
    tasks = [
        {
            'id': t.id,
            'title': t.title,
            'task_type': t.task_type,
            'status': t.status,
            'priority': t.priority,
            'due_date': str(t.due_date or ''),
            'field': t.field.name if t.field else None,
            'crop': t.crop.name if t.crop else None,
        }
        for t in farm.tasks.all()
    ]
    return {
        'farm': {
            'id': farm.id,
            'name': farm.name,
            'location': farm.location,
            'area': float(farm.area),
            'soil_type': farm.soil_type,
            'irrigation_type': farm.irrigation_type,
            'created_at': str(farm.created_at.date()) if farm.created_at else '',
        },
        'fields': fields_data,
        'sensors': sensor_records,
        'tasks': tasks,
        'summary': {
            'total_fields': len(fields_data),
            'total_crops': sum(len(f['crops']) for f in fields_data),
            'total_sensors': len(sensor_records),
            'pending_tasks': sum(1 for t in tasks if t['status'] == 'PENDING'),
        },
        'generated_at': str(timezone.now()),
    }


def crop_report(farm=None, field=None, crop=None, status_filter=None):
    from crops.models import Crop
    qs = Crop.objects.select_related('field__farm').all()
    if crop:
        qs = qs.filter(id=crop)
    elif field:
        qs = qs.filter(field=field)
    elif farm:
        qs = qs.filter(field__farm=farm)
    if status_filter:
        qs = qs.filter(status=status_filter)
    crops = [
        {
            'id': c.id,
            'name': c.name,
            'variety': c.variety,
            'farm': c.field.farm.name,
            'field': c.field.name,
            'planting_date': str(c.planting_date or ''),
            'expected_harvest_date': str(c.expected_harvest_date or ''),
            'actual_harvest_date': str(c.actual_harvest_date or ''),
            'growth_stage': c.current_growth_stage,
            'quantity': float(c.quantity),
            'status': c.status,
        }
        for c in qs
    ]
    return {
        'crops': crops,
        'count': len(crops),
        'by_status': {
            status: sum(1 for c in crops if c['status'] == status)
            for status in ('PLANNED', 'GROWING', 'READY', 'HARVESTED')
        },
        'generated_at': str(timezone.now()),
    }


def sensor_report(farm=None, field=None, reading_type=None, days=7):
    from sensors.models import SensorReading
    qs = SensorReading.objects.select_related('device__field__farm')
    if farm:
        qs = qs.filter(device__field__farm=farm)
    if field:
        qs = qs.filter(device__field=field)
    if reading_type:
        qs = qs.filter(reading_type=reading_type.upper())
    since = timezone.now() - timedelta(days=days)
    qs = qs.filter(timestamp__gte=since)

    by_device = {}
    for r in qs:
        key = f'{r.reading_type}-{r.device_id}'
        entry = by_device.setdefault(key, {
            'device': r.device.name,
            'device_type': r.reading_type,
            'field': r.device.field.name,
            'values': [],
            'unit': r.unit,
        })
        entry['values'].append({'timestamp': str(r.timestamp), 'value': r.value})

    devices_out = []
    for key, entry in by_device.items():
        values = [v['value'] for v in entry['values']]
        devices_out.append({
            'device': entry['device'],
            'device_type': entry['device_type'],
            'field': entry['field'],
            'unit': entry['unit'],
            'count': len(values),
            'min': min(values) if values else None,
            'max': max(values) if values else None,
            'avg': round(sum(values) / len(values), 2) if values else None,
            'latest': values[-1] if values else None,
            'readings': entry['values'],
        })

    summary_types = {}
    for d in devices_out:
        summary_types[d['device_type']] = {
            'count_total': d['count'],
            'min': d['min'],
            'max': d['max'],
            'avg': d['avg'],
            'latest': d['latest'],
        }
    return {
        'devices': devices_out,
        'summary': summary_types,
        'days': days,
        'generated_at': str(timezone.now()),
    }


def sales_report(farm=None, date_from=None, date_to=None):
    from orders.models import OrderItem
    qs = OrderItem.objects.select_related('order', 'product', 'product__farmer')
    if farm:
        # match products whose farmer owns the farm (approx via farm ownership lookups)
        farmer_ids = list(farm.fields.values_list('farm_id', flat=True))
        qs = qs.filter(product__farmer__in=farm.fields.values_list('farm__farmer_id', flat=True).distinct())
    if date_from:
        qs = qs.filter(order__created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(order__created_at__date__lte=date_to)

    items = [
        {
            'id': i.id,
            'order': i.order_id,
            'product': i.product_name,
            'farmer': i.farmer.username,
            'quantity': int(i.quantity),
            'price': float(i.price),
            'revenue': float(i.subtotal),
            'status': i.status,
            'date': str(i.order.created_at.date()),
        }
        for i in qs
    ]
    total_revenue = sum(i['revenue'] for i in items if i['status'] != 'CANCELLED')
    total_quantity = sum(i['quantity'] for i in items if i['status'] != 'CANCELLED')
    return {
        'items': items,
        'summary': {
            'total_orders': len(set(i['order'] for i in items)),
            'total_items': len(items),
            'total_quantity': total_quantity,
            'total_revenue': round(total_revenue, 2),
        },
        'generated_at': str(timezone.now()),
    }


def resource_report(farmer):
    from resources.models import Resource
    resources = Resource.objects.filter(farmer=farmer)
    categories = {}
    total_cost = 0
    low_stock = []
    for r in resources:
        total_cost += float(r.cost)
        cat = categories.setdefault(r.category, {'count': 0, 'value': 0})
        cat['count'] += 1
        cat['value'] += float(r.cost)
        if r.is_low_stock:
            low_stock.append({
                'id': r.id,
                'name': r.name,
                'quantity': float(r.quantity),
                'threshold': float(r.low_stock_threshold),
                'unit': r.unit,
            })
    return {
        'resources': [
            {
                'id': r.id,
                'name': r.name,
                'category': r.category,
                'quantity': float(r.quantity),
                'unit': r.unit,
                'purchase_date': str(r.purchase_date or ''),
                'expiry_date': str(r.expiry_date or ''),
                'cost': float(r.cost),
                'low_stock': r.is_low_stock,
            }
            for r in resources
        ],
        'summary': {
            'total_resources': len(resources),
            'total_cost': round(total_cost, 2),
            'low_stock_count': len(low_stock),
            'by_category': {k: {'count': v['count'], 'value': round(v['value'], 2)} for k, v in categories.items()},
        },
        'low_stock': low_stock,
        'generated_at': str(timezone.now()),
    }


def to_rows(data):
    """Flatten report dict into a list of CSV rows."""
    rows = []
    kind = data.get('farm') and 'farm' or (data.get('crops') and 'crop') or \
        (data.get('devices') and 'sensor') or (data.get('items') and 'sales') or 'resource'

    if kind == 'crop':
        rows.append(['Crop', 'Variety', 'Farm', 'Field', 'Planting Date', 'Expected Harvest',
                     'Growth Stage', 'Quantity', 'Status'])
        for c in data['crops']:
            rows.append([c['name'], c['variety'], c['farm'], c['field'], c['planting_date'],
                         c['expected_harvest_date'], c['growth_stage'], str(c['quantity']), c['status']])
    elif kind == 'sensor':
        rows.append(['Device', 'Type', 'Field', 'Count', 'Min', 'Max', 'Avg', 'Latest'])
        for d in data['devices']:
            rows.append([d['device'], d['device_type'], d['field'], str(d['count']),
                         str(d['min']), str(d['max']), str(d['avg']), str(d['latest'])])
    elif kind == 'sales':
        rows.append(['Order ID', 'Product', 'Farmer', 'Quantity', 'Price', 'Revenue', 'Status', 'Date'])
        for i in data['items']:
            rows.append([str(i['order']), i['product'], i['farmer'], str(i['quantity']),
                         str(i['price']), str(i['revenue']), i['status'], i['date']])
        rows.append(['TOTAL', '', '', str(data['summary']['total_quantity']), '',
                     str(data['summary']['total_revenue']), '', ''])
    elif kind == 'resource':
        rows.append(['Name', 'Category', 'Quantity', 'Unit', 'Purchase Date', 'Expiry Date', 'Cost', 'Low Stock'])
        for r in data['resources']:
            rows.append([r['name'], r['category'], str(r['quantity']), r['unit'],
                         r['purchase_date'], r['expiry_date'], str(r['cost']), str(r['low_stock'])])
    else:
        f = data['farm']
        rows.append(['Farm Report', f['name']])
        rows.append(['Location', f['location']])
        rows.append(['Area', str(f['area'])])
        rows.append(['Soil Type', f['soil_type']])
        rows.append([])
        rows.append(['Field', 'Area', 'Soil', 'Status', 'Crops'])
        for field in data['fields']:
            rows.append([field['name'], str(field['area']), field['soil_type'], field['status'],
                         ', '.join(c['name'] for c in field['crops']) or '-'])
    return rows