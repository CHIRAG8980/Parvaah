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

  static List<NotificationItemModel> defaultNotifications() {
    final now = DateTime.now();
    return [
      NotificationItemModel(
        id: 'notif_1',
        title: 'High Landslide Risk Warning',
        message: 'Elevated pore pressure detected along Sohra-Cherrapunji sector.',
        timestamp: now.subtract(const Duration(minutes: 18)),
        severity: NotificationSeverity.critical,
        group: NotificationTimeGroup.today,
        isRead: false,
      ),
      NotificationItemModel(
        id: 'notif_2',
        title: 'NH-2 Highway Disruption',
        message: 'Active mudslide near KM 42 (Dzüdza bridge). Alternate route open.',
        timestamp: now.subtract(const Duration(hours: 2)),
        severity: NotificationSeverity.high,
        group: NotificationTimeGroup.today,
        isRead: false,
      ),
      NotificationItemModel(
        id: 'notif_3',
        title: 'Monsoon Advisory: 72h Rainfall Surge',
        message: 'IMD predicts intense convective cells across East Khasi Hills.',
        timestamp: now.subtract(const Duration(days: 1, hours: 4)),
        severity: NotificationSeverity.moderate,
        group: NotificationTimeGroup.yesterday,
        isRead: true,
      ),
      NotificationItemModel(
        id: 'notif_4',
        title: 'Telemetry Node Calibrated',
        message: 'InSAR deformation sensor NER-04 online with high accuracy.',
        timestamp: now.subtract(const Duration(days: 3)),
        severity: NotificationSeverity.info,
        group: NotificationTimeGroup.earlier,
        isRead: true,
      ),
    ];
  }
}
