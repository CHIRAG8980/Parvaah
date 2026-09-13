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
    this.suggestedAlternate,
    this.alternateDetails,
    this.points = const [],
  });

  factory RoadStatusModel.fromJson(Map<String, dynamic> json) {
    RoadCondition cond;
    final s = (json['status'] as String? ?? 'open').toLowerCase();
    if (s.contains('block')) {
      cond = RoadCondition.blocked;
    } else if (s.contains('risk')) {
      cond = RoadCondition.atRisk;
    } else {
      cond = RoadCondition.open;
    }

    final rawPoints = json['points'] as List<dynamic>? ?? [];
    final pointsList = rawPoints.map((p) {
      if (p is Map<String, dynamic>) {
        return RoadCoord(
          (p['lat'] as num?)?.toDouble() ?? 0.0,
          (p['lng'] as num?)?.toDouble() ?? 0.0,
        );
      }
      return const RoadCoord(0.0, 0.0);
    }).where((c) => c.lat != 0.0 && c.lng != 0.0).toList();

    return RoadStatusModel(
      roadId: json['road_id'] as String? ?? '',
      roadName: (json['road_name'] ?? json['name']) as String? ?? '',
      corridor: (json['corridor'] ?? json['road_class']) as String? ?? '',
      status: cond,
      lastUpdated: (json['last_updated'] ?? json['status_updated_at']) != null
          ? DateTime.tryParse((json['last_updated'] ?? json['status_updated_at']) as String) ?? DateTime.now()
          : DateTime.now(),
      reason: (json['reason'] ?? json['blockage_reason']) as String? ?? '',
      zoneId: json['zone_id'] as String? ?? '',
      suggestedAlternate: json['suggested_alternate'] as String?,
      alternateDetails: json['alternate_details'] as String?,
      points: pointsList,
    );
  }

  Map<String, dynamic> toJson() => {
        'road_id': roadId,
        'road_name': roadName,
        'corridor': corridor,
        'status': status.name,
        'last_updated': lastUpdated.toIso8601String(),
        'reason': reason,
        'zone_id': zoneId,
        'suggested_alternate': suggestedAlternate,
        'alternate_details': alternateDetails,
        'points': points.map((p) => {'lat': p.lat, 'lng': p.lng}).toList(),
      };
}
