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
