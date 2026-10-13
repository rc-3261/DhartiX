def create_notification(user, title, message, notification_type='INFO'):
    from .models import Notification
    try:
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
        )
    except Exception:
        return None