enum AlertSeverity { critical, high, medium, low }

class AlertModel {
  final String id;
  final String title;
  final String message;
  final String region;
  final String zoneId;
  final String district;
  final String state;
  final AlertSeverity severity;
  final DateTime timestamp;
  final bool isRead;
  final String actionLabel;
  final String? instructions;
  final String language;
  final List<String> availableLanguages;

  const AlertModel({
    required this.id,
    required this.title,
    required this.message,
    required this.region,
    this.zoneId = '',
    this.district = '',
    this.state = '',
    required this.severity,
    required this.timestamp,
    this.isRead = false,
    this.actionLabel = 'View Details',
    this.instructions,
    this.language = 'en',
    this.availableLanguages = const ['en'],
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    AlertSeverity sev;
    final severityString = (json['severity'] as String? ?? 'low').toLowerCase();
    if (severityString.contains('crit')) {
      sev = AlertSeverity.critical;
    } else if (severityString.contains('high')) {
      sev = AlertSeverity.high;
    } else if (severityString.contains('med') || severityString.contains('adv')) {
      sev = AlertSeverity.medium;
    } else {
      sev = AlertSeverity.low;
    }

    final rawLanguages = json['available_languages'];
    final languagesList = rawLanguages is List
        ? rawLanguages.map((e) => e.toString()).toList()
        : const ['en'];

    final zoneName = json['zone_name'] as String? ?? json['region'] as String? ?? '';
    final districtName = json['district'] as String? ?? '';
    final stateName = json['state'] as String? ?? '';
    final fullRegion = districtName.isNotEmpty && stateName.isNotEmpty
        ? '$zoneName, $districtName'
        : (zoneName.isNotEmpty ? zoneName : 'Northeast Region');

    return AlertModel(
      id: json['alert_id'] as String? ?? json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Landslide Alert',
      message: json['message'] as String? ?? json['draft_message'] as String? ?? '',
      region: fullRegion,
      zoneId: json['zone_id'] as String? ?? '',
      district: districtName,
      state: stateName,
      severity: sev,
      timestamp: json['dispatched_at'] != null
          ? DateTime.tryParse(json['dispatched_at'] as String) ?? DateTime.now()
          : (json['created_at'] != null
              ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
              : (json['timestamp'] != null
                  ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
                  : DateTime.now())),
      isRead: json['is_read'] as bool? ?? false,
      actionLabel: json['action_label'] as String? ?? 'Emergency Actions',
      instructions: json['instructions'] as String? ?? json['suggested_action'] as String?,
      language: json['language'] as String? ?? 'en',
      availableLanguages: languagesList,
    );
  }

  Map<String, dynamic> toJson() => {
        'alert_id': id,
        'id': id,
        'title': title,
        'message': message,
        'zone_name': region,
        'region': region,
        'zone_id': zoneId,
        'district': district,
        'state': state,
        'severity': severity.name.toUpperCase(),
        'dispatched_at': timestamp.toIso8601String(),
        'timestamp': timestamp.toIso8601String(),
        'is_read': isRead,
        'action_label': actionLabel,
        'instructions': instructions,
        'language': language,
        'available_languages': availableLanguages,
      };

  AlertModel copyWith({bool? isRead}) {
    return AlertModel(
      id: id,
      title: title,
      message: message,
      region: region,
      zoneId: zoneId,
      district: district,
      state: state,
      severity: severity,
      timestamp: timestamp,
      isRead: isRead ?? this.isRead,
      actionLabel: actionLabel,
      instructions: instructions,
      language: language,
      availableLanguages: availableLanguages,
    );
  }
}
