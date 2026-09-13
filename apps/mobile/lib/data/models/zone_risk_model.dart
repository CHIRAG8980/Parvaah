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
    if (score >= 0.85) {
      level = RiskLevel.critical;
    } else if (score >= 0.70) {
      level = RiskLevel.high;
    } else if (score >= 0.50) {
      level = RiskLevel.elevated;
    } else if (score >= 0.30) {
      level = RiskLevel.medium;
    } else {
      level = RiskLevel.low;
    }

    return ZoneRiskModel(
      zoneId: json['zone_id'] as String? ?? 'UNKNOWN',
      zoneName: json['zone_name'] as String? ?? 'Unnamed Zone',
      state: json['state'] as String? ?? 'North East',
      district: json['district'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 25.5,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 91.8,
      riskScore: score,
      riskLevel: level,
      confidence: ConfidenceLevel.high,
      timeToFailure: json['time_to_failure'] as String? ?? 'Monitoring active',
      factors: json['factors'] != null
          ? RiskFactors.fromJson(json['factors'] as Map<String, dynamic>)
          : const RiskFactors(
              rainfall24hMm: 45.0,
              rainfall72hCumulativeMm: 95.0,
              soilMoisturePct: 62.0,
              slopeDegrees: 34.0,
              insarDeformationMmYr: -12.4,
              ndviIndex: 0.45,
            ),
      lastUpdated: json['last_updated'] != null
          ? DateTime.tryParse(json['last_updated'] as String) ?? DateTime.now()
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
}
