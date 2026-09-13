enum RiskLevel { low, medium, elevated, high, critical }
enum ConfidenceLevel { low, medium, high }

class RiskFactors {
  final double rainfall24hMm;
  final double rainfall72hCumulativeMm;
  final double soilMoisturePct;
  final double slopeDegrees;
  final double insarDeformationMmYr;
  final double ndviIndex;

  const RiskFactors({
    required this.rainfall24hMm,
    required this.rainfall72hCumulativeMm,
    required this.soilMoisturePct,
    required this.slopeDegrees,
    required this.insarDeformationMmYr,
    required this.ndviIndex,
  });

  factory RiskFactors.fromJson(Map<String, dynamic> json) {
    return RiskFactors(
      rainfall24hMm: (json['rainfall_24h_mm'] as num?)?.toDouble() ?? 0.0,
      rainfall72hCumulativeMm: (json['rainfall_72h_mm'] as num?)?.toDouble() ?? 0.0,
      soilMoisturePct: (json['soil_moisture_pct'] as num?)?.toDouble() ?? 0.0,
      slopeDegrees: (json['slope_degrees'] as num?)?.toDouble() ?? 0.0,
      insarDeformationMmYr: (json['insar_deformation_mm_yr'] as num?)?.toDouble() ?? 0.0,
      ndviIndex: (json['ndvi_index'] as num?)?.toDouble() ?? 0.5,
    );
  }

  Map<String, dynamic> toJson() => {
        'rainfall_24h_mm': rainfall24hMm,
        'rainfall_72h_mm': rainfall72hCumulativeMm,
        'soil_moisture_pct': soilMoisturePct,
        'slope_degrees': slopeDegrees,
        'insar_deformation_mm_yr': insarDeformationMmYr,
        'ndvi_index': ndviIndex,
      };
}

class ZoneRiskModel {
  final String zoneId;
  final String zoneName;
  final String state;
  final String district;
  final double latitude;
  final double longitude;
  final double riskScore; // 0.0 to 1.0
  final RiskLevel riskLevel;
  final ConfidenceLevel confidence;
  final String timeToFailure;
  final RiskFactors factors;
  final DateTime lastUpdated;
  final List<String> historicalEvents;

  const ZoneRiskModel({
    required this.zoneId,
    required this.zoneName,
    required this.state,
    required this.district,
    required this.latitude,
    required this.longitude,
    required this.riskScore,
    required this.riskLevel,
    required this.confidence,
    required this.timeToFailure,
    required this.factors,
    required this.lastUpdated,
    required this.historicalEvents,
  });

  factory ZoneRiskModel.fromJson(Map<String, dynamic> json) {
    final score = (json['risk_score'] as num?)?.toDouble() ?? 0.0;
    RiskLevel level;
    final levelStr = (json['risk_level'] as String? ?? '').toUpperCase();
    if (levelStr == 'CRITICAL' || score >= 0.85) {
      level = RiskLevel.critical;
    } else if (levelStr == 'HIGH' || score >= 0.70) {
      level = RiskLevel.high;
    } else if (levelStr == 'ELEVATED' || score >= 0.50) {
      level = RiskLevel.elevated;
    } else if (levelStr == 'MEDIUM' || score >= 0.30) {
      level = RiskLevel.medium;
    } else {
      level = RiskLevel.low;
    }

    final confStr = (json['confidence'] as String? ?? '').toLowerCase();
    final confidenceLevel = confStr == 'high'
        ? ConfidenceLevel.high
        : (confStr == 'medium' ? ConfidenceLevel.medium : ConfidenceLevel.low);

    return ZoneRiskModel(
      zoneId: json['zone_id'] as String? ?? '',
      zoneName: json['name'] as String? ?? json['zone_name'] as String? ?? '',
      state: json['state'] as String? ?? '',
      district: json['district'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      riskScore: score,
      riskLevel: level,
      confidence: confidenceLevel,
      timeToFailure: json['time_to_failure_window'] as String? ?? '',
      factors: json['factors'] != null
          ? RiskFactors.fromJson(json['factors'] as Map<String, dynamic>)
          : const RiskFactors(
              rainfall24hMm: 0.0,
              rainfall72hCumulativeMm: 0.0,
              soilMoisturePct: 0.0,
              slopeDegrees: 0.0,
              insarDeformationMmYr: 0.0,
              ndviIndex: 0.0,
            ),
      lastUpdated: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
      historicalEvents: (json['historical_events'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
        'zone_id': zoneId,
        'zone_name': zoneName,
        'state': state,
        'district': district,
        'latitude': latitude,
        'longitude': longitude,
        'risk_score': riskScore,
        'time_to_failure': timeToFailure,
        'factors': factors.toJson(),
        'last_updated': lastUpdated.toIso8601String(),
        'historical_events': historicalEvents,
      };

  factory ZoneRiskModel.empty() {
    return ZoneRiskModel(
      zoneId: '',
      zoneName: 'No Zone Selected',
      state: '',
      district: '',
      latitude: 25.5788,
      longitude: 91.8933,
      riskScore: 0.0,
      riskLevel: RiskLevel.low,
      confidence: ConfidenceLevel.low,
      timeToFailure: 'N/A',
      factors: const RiskFactors(
        rainfall24hMm: 0.0,
        rainfall72hCumulativeMm: 0.0,
        soilMoisturePct: 0.0,
        slopeDegrees: 0.0,
        insarDeformationMmYr: 0.0,
        ndviIndex: 0.0,
      ),
      lastUpdated: DateTime.now(),
      historicalEvents: const [],
    );
  }
}
