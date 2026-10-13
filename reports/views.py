import csv
import io

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from farms.models import Farm

from . import services


class ReportBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_farm_or_deny(self, request, farm_id):
        farm = get_object_or_404(Farm, pk=farm_id)
        if not (request.user.is_admin_user or farm.farmer_id == request.user.id):
            raise PermissionDenied('You do not have access to this farm.')
        return farm

    def _resolve_field(self, request, field_id):
        from fields.models import Field
        field = get_object_or_404(Field, pk=field_id)
        if not (request.user.is_admin_user or field.farm.farmer_id == request.user.id):
            raise PermissionDenied('You do not have access to this field.')
        return field

    def _resolve_crop(self, request, crop_id):
        from crops.models import Crop
        crop = get_object_or_404(Crop, pk=crop_id)
        if not (request.user.is_admin_user or crop.field.farm.farmer_id == request.user.id):
            raise PermissionDenied('You do not have access to this crop.')
        return crop

    def _respond(self, request, data, filename, format_type='json'):
        fmt = request.query_params.get('export', format_type).lower()
        if fmt == 'csv':
            return self._csv_response(data, filename)
        if fmt == 'pdf':
            return self._pdf_response(data, filename)
        return Response(data)

    def _csv_response(self, data, filename):
        rows = services.to_rows(data)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerows(rows)
        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        return response

    def _pdf_response(self, data, filename):
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        styles = getSampleStyleSheet()
        cell_style = ParagraphStyle(
            'CellBody', parent=styles['BodyText'], fontSize=8, leading=10)
        story = [Paragraph(f'DhartiX Report - {filename.replace("_", " ").title()}', styles['Title']),
                 Spacer(1, 12)]

        rows = services.to_rows(data)
        table_data = []
        for r in rows:
            if not r:
                story.append(Spacer(1, 10))
                continue
            table_data.append([Paragraph(str(c).replace('&', '&amp;'), cell_style) for c in r])

        if table_data:
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ]))
            story.append(table)
        doc.build(story)
        pdf = buffer.getvalue()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
        return response


class FarmReportView(ReportBaseView):
    def get(self, request):
        farm_id = request.query_params.get('farm')
        if not farm_id:
            return Response({'detail': 'A farm id is required.'}, status=400)
        farm = self.get_farm_or_deny(request, farm_id)
        data = services.farm_report(farm)
        return self._respond(request, data, f'farm_report_{farm.id}')


class CropReportView(ReportBaseView):
    def get(self, request):
        farm_id = request.query_params.get('farm')
        field_id = request.query_params.get('field')
        crop_id = request.query_params.get('crop')
        status_filter = request.query_params.get('status', '').upper()

        farm = field = crop = None
        if farm_id:
            farm = self.get_farm_or_deny(request, farm_id)
        if field_id:
            field = self._resolve_field(request, field_id)
        if crop_id:
            crop = self._resolve_crop(request, crop_id)
        if not (farm or field or crop):
            user = request.user
            if user.is_farmer:
                farm = user.farms.first()
            if not farm:
                return Response({'detail': 'Provide a farm, field or crop id.'}, status=400)

        data = services.crop_report(farm=farm, field=field, crop=crop, status_filter=status_filter)
        return self._respond(request, data, 'crop_report')


class SensorReportView(ReportBaseView):
    def get(self, request):
        farm_id = request.query_params.get('farm')
        field_id = request.query_params.get('field')
        reading_type = request.query_params.get('reading_type')
        days = int(request.query_params.get('days', 7))

        farm = field = None
        if farm_id:
            farm = self.get_farm_or_deny(request, farm_id)
        if field_id:
            field = self._resolve_field(request, field_id)

        data = services.sensor_report(farm=farm, field=field, reading_type=reading_type, days=days)
        return self._respond(request, data, 'sensor_report')


class SalesReportView(ReportBaseView):
    def get(self, request):
        from datetime import datetime
        farm_id = request.query_params.get('farm')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        farm = None
        if farm_id:
            farm = self.get_farm_or_deny(request, farm_id)
        d_from = datetime.strptime(date_from, '%Y-%m-%d').date() if date_from else None
        d_to = datetime.strptime(date_to, '%Y-%m-%d').date() if date_to else None

        data = services.sales_report(farm=farm, date_from=d_from, date_to=d_to)
        return self._respond(request, data, 'sales_report')


class ResourceReportView(ReportBaseView):
    def get(self, request):
        if request.user.is_farmer:
            data = services.resource_report(request.user)
        elif request.user.is_admin_user:
            from accounts.models import User
            farmer_id = request.query_params.get('farmer')
            farmer = User.objects.filter(pk=farmer_id).first() if farmer_id else request.user
            data = services.resource_report(farmer)
            if not farmer_id:
                return Response({'detail': 'Provide a farmer id.'}, status=400)
        else:
            raise PermissionDenied('Only farmers and admins can view resource reports.')
        return self._respond(request, data, 'resource_report')