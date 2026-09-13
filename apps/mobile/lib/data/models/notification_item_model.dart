import 'alert_model.dart';

enum NotificationSeverity { critical, high, moderate, info }
enum NotificationTimeGroup { today, yesterday, earlier }

class NotificationItemModel {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final NotificationSeverity severity;
  final NotificationTimeGroup group;
  final bool isRead;
  final String? actionRoute;

  const NotificationItemModel({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.severity,
    required this.group,
    this.isRead = false,
    this.actionRoute,
  });

  factory NotificationItemModel.fromAlert(AlertModel alert) {
    NotificationSeverity notifSev;
    switch (alert.severity) {
      case AlertSeverity.critical:
        notifSev = NotificationSeverity.critical;
        break;
      case AlertSeverity.high:
        notifSev = NotificationSeverity.high;
        break;
      case AlertSeverity.medium:
        notifSev = NotificationSeverity.moderate;
        break;
      case AlertSeverity.low:
        notifSev = NotificationSeverity.info;
        break;
    }

    final now = DateTime.now();
    final difference = now.difference(alert.timestamp);
    NotificationTimeGroup group;
    if (difference.inHours < 24 && now.day == alert.timestamp.day) {
      group = NotificationTimeGroup.today;
    } else if (difference.inDays <= 2) {
      group = NotificationTimeGroup.yesterday;
    } else {
      group = NotificationTimeGroup.earlier;
    }

    return NotificationItemModel(
      id: alert.id,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      severity: notifSev,
      group: group,
      isRead: alert.isRead,
      actionRoute: '/alerts',
    );
  }

  NotificationItemModel copyWith({bool? isRead}) {
    return NotificationItemModel(
      id: id,
      title: title,
      message: message,
      timestamp: timestamp,
      severity: severity,
      group: group,
      isRead: isRead ?? this.isRead,
      actionRoute: actionRoute,
    );
  }
}
