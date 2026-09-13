enum AlertSeverity { critical, high, medium, low }

class AlertModel {
  final String id;
  final String title;
  final String message;
  final String region;
  final AlertSeverity severity;
  final DateTime timestamp;
  final bool isRead;
  final String actionLabel;
  final String? instructions;

  const AlertModel({
    required this.id,
    required this.title,
    required this.message,
    required this.region,
    required this.severity,
    required this.timestamp,
    this.isRead = false,
    this.actionLabel = 'View Details',
    this.instructions,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    AlertSeverity sev;
    final s = (json['severity'] as String? ?? 'low').toLowerCase();
    if (s.contains('crit')) {
      sev = AlertSeverity.critical;
    } else if (s.contains('high')) {
      sev = AlertSeverity.high;
    } else if (s.contains('med')) {
      sev = AlertSeverity.medium;
    } else {
      sev = AlertSeverity.low;
    }

    return AlertModel(
      id: json['alert_id'] as String? ?? json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      region: json['zone_name'] as String? ?? json['region'] as String? ?? '',
      severity: sev,
      timestamp: json['dispatched_at'] != null
          ? DateTime.tryParse(json['dispatched_at'] as String) ?? DateTime.now()
          : (json['timestamp'] != null
              ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
              : DateTime.now()),
      isRead: json['is_read'] as bool? ?? false,
      actionLabel: json['action_label'] as String? ?? 'View Details',
      instructions: json['instructions'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'message': message,
        'region': region,
        'severity': severity.name,
        'timestamp': timestamp.toIso8601String(),
        'is_read': isRead,
        'action_label': actionLabel,
        'instructions': instructions,
      };
}
