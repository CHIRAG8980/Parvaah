enum RoadCondition { open, atRisk, blocked }

class RoadCoord {
  final double lat;
  final double lng;
  const RoadCoord(this.lat, this.lng);
}

class RoadStatusModel {
  final String roadId;
  final String roadName;
  final String corridor;
  final RoadCondition status;
  final DateTime lastUpdated;
  final String reason;
  final String zoneId;
  final String startPoint;
  final String endPoint;
  final bool isSingleAccess;
  final String? suggestedAlternate;
  final String? alternateDetails;
  final List<RoadCoord> points;

  const RoadStatusModel({
    required this.roadId,
    required this.roadName,
    required this.corridor,
    required this.status,
    required this.lastUpdated,
    required this.reason,
    required this.zoneId,
    this.startPoint = '',
    this.endPoint = '',
    this.isSingleAccess = false,
    this.suggestedAlternate,
    this.alternateDetails,
    this.points = const [],
  });

  factory RoadStatusModel.fromJson(Map<String, dynamic> json) {
    RoadCondition condition;
    final statusString = (json['status'] as String? ?? 'open').toLowerCase();
    if (statusString.contains('block')) {
      condition = RoadCondition.blocked;
    } else if (statusString.contains('risk')) {
      condition = RoadCondition.atRisk;
    } else {
      condition = RoadCondition.open;
    }

    final rawPoints = json['points'] as List<dynamic>? ?? [];
    List<RoadCoord> pointsList = rawPoints.map((p) {
      if (p is Map<String, dynamic>) {
        return RoadCoord(
          (p['lat'] as num?)?.toDouble() ?? 0.0,
          (p['lng'] as num?)?.toDouble() ?? 0.0,
        );
      }
      return const RoadCoord(0.0, 0.0);
    }).where((c) => c.lat != 0.0 && c.lng != 0.0).toList();

    final roadId = json['road_id'] as String? ?? '';
    final reasonText = (json['blockage_reason'] ?? json['reason']) as String? ?? '';
    final roadNameText = (json['name'] ?? json['road_name']) as String? ?? '';

    return RoadStatusModel(
      roadId: roadId,
      roadName: roadNameText,
      corridor: (json['road_class'] ?? json['corridor']) as String? ?? 'Highway',
      status: condition,
      lastUpdated: json['status_updated_at'] != null
          ? DateTime.tryParse(json['status_updated_at'] as String) ?? DateTime.now()
          : (json['last_updated'] != null
              ? DateTime.tryParse(json['last_updated'] as String) ?? DateTime.now()
              : DateTime.now()),
      reason: reasonText,
      zoneId: json['zone_id'] as String? ?? '',
      startPoint: json['start_point'] as String? ?? '',
      endPoint: json['end_point'] as String? ?? '',
      isSingleAccess: json['is_single_access'] as bool? ?? false,
      suggestedAlternate: json['suggested_alternate'] as String?,
      alternateDetails: json['alternate_details'] as String?,
      points: pointsList,
    );
  }

  Map<String, dynamic> toJson() => {
        'road_id': roadId,
        'road_name': roadName,
        'name': roadName,
        'corridor': corridor,
        'road_class': corridor,
        'status': status.name,
        'status_updated_at': lastUpdated.toIso8601String(),
        'blockage_reason': reason,
        'zone_id': zoneId,
        'start_point': startPoint,
        'end_point': endPoint,
        'is_single_access': isSingleAccess,
        'suggested_alternate': suggestedAlternate,
        'alternate_details': alternateDetails,
        'points': points.map((p) => {'lat': p.lat, 'lng': p.lng}).toList(),
      };
}
