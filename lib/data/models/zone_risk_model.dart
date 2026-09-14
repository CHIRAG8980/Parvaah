// ignore_for_file: constant_identifier_names

/// Risk level — includes OUT_OF_COVERAGE for coordinates outside the
/// Meghalaya / NER operational AOI. Must never be displayed as LOW.
enum RiskLevel { low, medium, elevated, high, critical, outOfCoverage, unavailable }

enum ConfidenceLevel { low, medium, high, outOfCoverage, unavailable }

// ---------------------------------------------------------------------------
// Risk factors (legacy + extended)
// ---------------------------------------------------------------------------

class RiskFactors {
  final double? rainfall24hMm;
  final double? rainfall72hCumulativeMm;
  final double? soilMoisturePct;
  final double? slopeDegrees;
  final double? insarDeformationMm;
  final double? ndviIndex;
  final List<String> topFactors;

  const RiskFactors({
    this.rainfall24hMm,
    this.rainfall72hCumulativeMm,
    this.soilMoisturePct,
    this.slopeDegrees,
    this.insarDeformationMm,
    this.ndviIndex,
    this.topFactors = const [],
  });

  factory RiskFactors.fromJson(Map<String, dynamic> json) {
    final rawTop = json['top_factors'];
    final topList =
        rawTop is List ? rawTop.map((e) => e.toString()).toList() : <String>[];

    return RiskFactors(
      rainfall24hMm:
          (json['rainfall24h_mm'] ?? json['rainfall_24h_mm'] as num?)?.toDouble(),
      rainfall72hCumulativeMm:
          (json['rainfall72h_cumulative_mm'] ?? json['rainfall_72h_mm'] as num?)
              ?.toDouble(),
      soilMoisturePct:
          (json['soil_moisture_pct'] ?? json['soil_moisture'] as num?)?.toDouble(),
      slopeDegrees:
          (json['slope_degrees'] ?? json['avg_slope_deg'] as num?)?.toDouble(),
      // Backend returns deformation_mm (already scaled to mm), or los_deformation_m * 1000
      insarDeformationMm: _parseInsarDeformation(json),
      ndviIndex: (json['ndvi_index'] as num?)?.toDouble(),
      topFactors: topList,
    );
  }

  static double? _parseInsarDeformation(Map<String, dynamic> json) {
    final mm = json['insar_deformation_mm_yr'] ?? json['deformation_mm'];
    if (mm != null) return (mm as num).toDouble();
    final m = json['los_deformation_m'] ?? json['insar_deformation_m'];
    if (m != null) return (m as num).toDouble() * 1000.0;
    return null;
  }

  Map<String, dynamic> toJson() => {
        'rainfall24h_mm': rainfall24hMm,
        'rainfall72h_cumulative_mm': rainfall72hCumulativeMm,
        'soil_moisture_pct': soilMoisturePct,
        'slope_degrees': slopeDegrees,
        'insar_deformation_mm_yr': insarDeformationMm,
        'ndvi_index': ndviIndex,
        'top_factors': topFactors,
      };
}

// ---------------------------------------------------------------------------
// NISAR / EOS-04 sensor status
// ---------------------------------------------------------------------------

class NisarStatus {
  final String status; // AVAILABLE | UNAVAILABLE
  final String quality; // GOOD | MODERATE | LOW_QUALITY | NOT_APPLICABLE
  final double? coherence;
  final double? deformationMm;
  final double fusionWeight;
  final String source;

  const NisarStatus({
    required this.status,
    required this.quality,
    this.coherence,
    this.deformationMm,
    this.fusionWeight = 0.0,
    this.source = 'ISRO-NASA NISAR S-band Level-2 GUNW',
  });

  bool get isAvailable => status == 'AVAILABLE';
  bool get isLowQuality => quality == 'LOW_QUALITY';
  bool get isGoodQuality => quality == 'GOOD';

  factory NisarStatus.fromJson(Map<String, dynamic> json) {
    return NisarStatus(
      status: json['status'] as String? ?? 'UNAVAILABLE',
      quality: json['quality'] as String? ?? 'NOT_APPLICABLE',
      coherence: (json['coherence'] as num?)?.toDouble(),
      deformationMm: (json['deformation_mm'] as num?)?.toDouble(),
      fusionWeight: (json['fusion_weight'] as num?)?.toDouble() ?? 0.0,
      source: json['source'] as String? ?? 'ISRO-NASA NISAR S-band Level-2 GUNW',
    );
  }

  factory NisarStatus.unavailable() => const NisarStatus(
        status: 'UNAVAILABLE',
        quality: 'NOT_APPLICABLE',
        fusionWeight: 0.0,
      );

  factory NisarStatus.outOfCoverage() => const NisarStatus(
        status: 'OUT_OF_COVERAGE',
        quality: 'NOT_APPLICABLE',
        fusionWeight: 0.0,
      );
}

class Eos04Status {
  final String status; // AVAILABLE | UNAVAILABLE
  final String quality; // GOOD | NOT_APPLICABLE
  final double? soilMoisturePct;
  final String source;

  const Eos04Status({
    required this.status,
    required this.quality,
    this.soilMoisturePct,
    this.source = 'ISRO Bhoonidhi EOS-04 Level-4 SAR MRS Soil Moisture',
  });

  bool get isAvailable => status == 'AVAILABLE';

  factory Eos04Status.fromJson(Map<String, dynamic> json) {
    return Eos04Status(
      status: json['status'] as String? ?? 'UNAVAILABLE',
      quality: json['quality'] as String? ?? 'NOT_APPLICABLE',
      soilMoisturePct: (json['soil_moisture_pct'] as num?)?.toDouble(),
      source:
          json['source'] as String? ?? 'ISRO Bhoonidhi EOS-04 Level-4 SAR MRS Soil Moisture',
    );
  }

  factory Eos04Status.unavailable() => const Eos04Status(
        status: 'UNAVAILABLE',
        quality: 'NOT_APPLICABLE',
      );
}

// ---------------------------------------------------------------------------
// Per-model outputs
// ---------------------------------------------------------------------------

class ModelOutput1 {
  final double? score;
  final String category; // VERY_HIGH | HIGH | MODERATE | LOW | UNAVAILABLE | OUT_OF_COVERAGE
  final String status; // AVAILABLE | UNAVAILABLE | OUT_OF_COVERAGE
  final String modelType;

  const ModelOutput1({
    this.score,
    required this.category,
    required this.status,
    this.modelType = 'RandomForest (10 Bhuvan/CartoDEM features)',
  });

  factory ModelOutput1.fromJson(Map<String, dynamic> json) {
    return ModelOutput1(
      score: (json['score'] as num?)?.toDouble(),
      category: json['category'] as String? ?? 'UNAVAILABLE',
      status: json['status'] as String? ?? 'UNAVAILABLE',
      modelType: json['model_type'] as String? ?? 'RandomForest (10 Bhuvan/CartoDEM features)',
    );
  }

  factory ModelOutput1.unavailable() => const ModelOutput1(
        category: 'UNAVAILABLE',
        status: 'UNAVAILABLE',
      );
}

class ModelOutput2 {
  final double? score;
  final String triggerState; // CRITICAL_TRIGGER | WARNING_TRIGGER | WATCH | BASELINE | OUT_OF_COVERAGE
  final double? confidence;
  final String status;
  final String modelType;

  const ModelOutput2({
    this.score,
    required this.triggerState,
    this.confidence,
    required this.status,
    this.modelType = 'XGBoost Dynamic Hazard Classifier',
  });

  factory ModelOutput2.fromJson(Map<String, dynamic> json) {
    return ModelOutput2(
      score: (json['score'] as num?)?.toDouble(),
      triggerState: json['trigger_state'] as String? ?? 'BASELINE',
      confidence: (json['confidence'] as num?)?.toDouble(),
      status: json['status'] as String? ?? 'UNAVAILABLE',
      modelType: json['model_type'] as String? ?? 'XGBoost Dynamic Hazard Classifier',
    );
  }

  factory ModelOutput2.unavailable() => const ModelOutput2(
        triggerState: 'UNAVAILABLE',
        status: 'UNAVAILABLE',
      );
}

class ModelOutput3 {
  final int? conditionClass;
  final double? similarityScore;
  /// Human-readable description of the matched historical hydrological pattern.
  /// NOT a guaranteed failure timestamp — truthful pattern similarity label.
  final String description;
  final String historicalConditionWindow;
  final int? leadDaysMin;
  final int? leadDaysMax;
  final String status;
  final String modelType;

  const ModelOutput3({
    this.conditionClass,
    this.similarityScore,
    required this.description,
    this.historicalConditionWindow = '',
    this.leadDaysMin,
    this.leadDaysMax,
    required this.status,
    this.modelType = 'RandomForest Lead-Window Pre-Event Condition Classifier',
  });

  factory ModelOutput3.fromJson(Map<String, dynamic> json) {
    return ModelOutput3(
      conditionClass: json['condition_class'] as int?,
      similarityScore: (json['similarity_score'] as num?)?.toDouble(),
      description: json['description'] as String? ?? '',
      historicalConditionWindow:
          json['historical_condition_window'] as String? ?? '',
      leadDaysMin: json['lead_days_min'] as int?,
      leadDaysMax: json['lead_days_max'] as int?,
      status: json['status'] as String? ?? 'UNAVAILABLE',
      modelType:
          json['model_type'] as String? ?? 'RandomForest Lead-Window Pre-Event Condition Classifier',
    );
  }

  factory ModelOutput3.unavailable() => const ModelOutput3(
        description: 'Model artifact unavailable',
        status: 'UNAVAILABLE',
      );
}

class ModelOutput4 {
  final double? score; // 0–100 scale
  final String riskLevel;
  final double? confidenceScore;
  final String confidenceLevel;
  final String status;
  final String modelType;

  const ModelOutput4({
    this.score,
    required this.riskLevel,
    this.confidenceScore,
    required this.confidenceLevel,
    required this.status,
    this.modelType = 'FusionRiskModel XGBoost Multi-Modal',
  });

  factory ModelOutput4.fromJson(Map<String, dynamic> json) {
    return ModelOutput4(
      score: (json['score'] as num?)?.toDouble(),
      riskLevel: json['risk_level'] as String? ?? 'UNAVAILABLE',
      confidenceScore: (json['confidence_score'] as num?)?.toDouble(),
      confidenceLevel: json['confidence_level'] as String? ?? 'UNAVAILABLE',
      status: json['status'] as String? ?? 'UNAVAILABLE',
      modelType:
          json['model_type'] as String? ?? 'FusionRiskModel XGBoost Multi-Modal',
    );
  }

  factory ModelOutput4.unavailable() => const ModelOutput4(
        riskLevel: 'UNAVAILABLE',
        confidenceLevel: 'UNAVAILABLE',
        status: 'UNAVAILABLE',
      );
}

class ModelOutputs {
  final ModelOutput1 staticSusceptibility;
  final ModelOutput2 dynamicHazard;
  final ModelOutput3 leadWindow;
  final ModelOutput4 fusion;

  const ModelOutputs({
    required this.staticSusceptibility,
    required this.dynamicHazard,
    required this.leadWindow,
    required this.fusion,
  });

  factory ModelOutputs.fromJson(Map<String, dynamic> json) {
    return ModelOutputs(
      staticSusceptibility: json['static_susceptibility'] != null
          ? ModelOutput1.fromJson(json['static_susceptibility'] as Map<String, dynamic>)
          : ModelOutput1.unavailable(),
      dynamicHazard: json['dynamic_hazard'] != null
          ? ModelOutput2.fromJson(json['dynamic_hazard'] as Map<String, dynamic>)
          : ModelOutput2.unavailable(),
      leadWindow: json['lead_window'] != null
          ? ModelOutput3.fromJson(json['lead_window'] as Map<String, dynamic>)
          : ModelOutput3.unavailable(),
      fusion: json['fusion'] != null
          ? ModelOutput4.fromJson(json['fusion'] as Map<String, dynamic>)
          : ModelOutput4.unavailable(),
    );
  }

  factory ModelOutputs.unavailable() => ModelOutputs(
        staticSusceptibility: ModelOutput1.unavailable(),
        dynamicHazard: ModelOutput2.unavailable(),
        leadWindow: ModelOutput3.unavailable(),
        fusion: ModelOutput4.unavailable(),
      );
}

// ---------------------------------------------------------------------------
// Main ZoneRiskModel
// ---------------------------------------------------------------------------

class ZoneRiskModel {
  final String zoneId;
  final String zoneName;
  final String state;
  final String district;
  final double latitude;
  final double longitude;

  /// Normalized 0.0–1.0 fused risk score from Model 4.
  /// null when risk_level is OUT_OF_COVERAGE or UNAVAILABLE.
  final double? riskScore;

  final RiskLevel riskLevel;
  final ConfidenceLevel confidence;

  /// Historical pre-event condition window from Model 3.
  /// NOT a guaranteed failure time — truthful similarity label only.
  final String historicalConditionWindow;

  final RiskFactors factors;
  final DateTime lastUpdated;
  final List<String> historicalEvents;
  final List<String> contributingFactors;
  final ModelOutputs modelOutputs;
  final NisarStatus nisarStatus;
  final Eos04Status eos04Status;

  const ZoneRiskModel({
    required this.zoneId,
    required this.zoneName,
    required this.state,
    required this.district,
    required this.latitude,
    required this.longitude,
    this.riskScore,
    required this.riskLevel,
    required this.confidence,
    required this.historicalConditionWindow,
    required this.factors,
    required this.lastUpdated,
    required this.historicalEvents,
    required this.contributingFactors,
    required this.modelOutputs,
    required this.nisarStatus,
    required this.eos04Status,
  });

  /// True when this zone is outside the operational Meghalaya / NER monitoring area.
  bool get isOutOfCoverage => riskLevel == RiskLevel.outOfCoverage;

  /// True when inference is unavailable (engine error, not out-of-coverage).
  bool get isUnavailable => riskLevel == RiskLevel.unavailable;

  factory ZoneRiskModel.fromJson(Map<String, dynamic> json) {
    // ------- Risk Level -------
    final levelStr = (json['risk_level'] as String? ?? '').toUpperCase();
    final RiskLevel level;
    if (levelStr == 'OUT_OF_COVERAGE') {
      level = RiskLevel.outOfCoverage;
    } else if (levelStr == 'UNAVAILABLE' || levelStr == 'ERROR') {
      level = RiskLevel.unavailable;
    } else if (levelStr == 'CRITICAL') {
      level = RiskLevel.critical;
    } else if (levelStr == 'HIGH') {
      level = RiskLevel.high;
    } else if (levelStr == 'ELEVATED') {
      level = RiskLevel.elevated;
    } else if (levelStr == 'MEDIUM' || levelStr == 'MODERATE') {
      level = RiskLevel.medium;
    } else {
      level = RiskLevel.low;
    }

    // ------- Fused Risk Score -------
    // risk_score is 0.0–1.0 normalized; risk_score_numeric is 0–100.
    // If OUT_OF_COVERAGE or UNAVAILABLE, both may be null — do NOT default to 0.
    double? score;
    if (level != RiskLevel.outOfCoverage && level != RiskLevel.unavailable) {
      final rawScore = json['risk_score'] as num?;
      final rawNumeric = json['risk_score_numeric'] as num?;
      if (rawScore != null) {
        final s = rawScore.toDouble();
        score = s > 1.0 ? (s / 100.0).clamp(0.0, 1.0) : s;
      } else if (rawNumeric != null) {
        score = (rawNumeric.toDouble() / 100.0).clamp(0.0, 1.0);
      }
    }

    // ------- Confidence -------
    final confStr = (
      json['confidence'] as String? ??
      json['confidence_level'] as String? ??
      ''
    ).toUpperCase();
    final ConfidenceLevel confidenceLevel;
    if (confStr == 'OUT_OF_COVERAGE') {
      confidenceLevel = ConfidenceLevel.outOfCoverage;
    } else if (confStr == 'UNAVAILABLE') {
      confidenceLevel = ConfidenceLevel.unavailable;
    } else if (confStr == 'HIGH') {
      confidenceLevel = ConfidenceLevel.high;
    } else if (confStr == 'MEDIUM') {
      confidenceLevel = ConfidenceLevel.medium;
    } else {
      confidenceLevel = ConfidenceLevel.low;
    }

    // ------- Historical Condition Window -------
    // Truthful label: historical similarity, NOT guaranteed failure timing.
    final historicalWindow =
        json['historical_condition_window'] as String? ??
        json['time_to_failure_window'] as String? ??
        '';

    // ------- Model Outputs -------
    final modelsJson = json['models'];
    final modelOutputs = modelsJson is Map
        ? ModelOutputs.fromJson(Map<String, dynamic>.from(modelsJson))
        : ModelOutputs.unavailable();

    // ------- NISAR / EOS-04 -------
    final da = json['data_availability'];
    NisarStatus nisarStatus;
    Eos04Status eos04Status;
    if (da is Map) {
      final daMap = Map<String, dynamic>.from(da);
      final nisarJson = daMap['insar_nisar'];
      final eos04Json = daMap['soil_moisture_eos04'];
      nisarStatus = nisarJson is Map
          ? NisarStatus.fromJson(Map<String, dynamic>.from(nisarJson))
          : (levelStr == 'OUT_OF_COVERAGE' ? NisarStatus.outOfCoverage() : NisarStatus.unavailable());
      eos04Status = eos04Json is Map
          ? Eos04Status.fromJson(Map<String, dynamic>.from(eos04Json))
          : Eos04Status.unavailable();
    } else {
      nisarStatus = levelStr == 'OUT_OF_COVERAGE'
          ? NisarStatus.outOfCoverage()
          : NisarStatus.unavailable();
      eos04Status = Eos04Status.unavailable();
    }

    // ------- Contributing Factors -------
    final rawFactors = json['contributing_factors'];
    final contributingFactors = rawFactors is List
        ? rawFactors.map((e) => e.toString()).toList()
        : <String>[];

    // ------- Legacy factors object -------
    final factorsJson = json['factors'];
    final factors = factorsJson is Map
        ? RiskFactors.fromJson(Map<String, dynamic>.from(factorsJson))
        : const RiskFactors();

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
      historicalConditionWindow: historicalWindow,
      factors: factors,
      lastUpdated: json['computed_at'] != null
          ? DateTime.tryParse(json['computed_at'] as String) ?? DateTime.now()
          : (json['created_at'] != null
              ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
              : DateTime.now()),
      historicalEvents: (json['historical_events'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      contributingFactors: contributingFactors,
      modelOutputs: modelOutputs,
      nisarStatus: nisarStatus,
      eos04Status: eos04Status,
    );
  }

  Map<String, dynamic> toJson() => {
        'zone_id': zoneId,
        'zone_name': zoneName,
        'name': zoneName,
        'state': state,
        'district': district,
        'latitude': latitude,
        'longitude': longitude,
        'risk_score': riskScore,
        'risk_score_numeric': riskScore != null ? (riskScore! * 100.0) : null,
        'risk_level': riskLevel == RiskLevel.outOfCoverage
            ? 'OUT_OF_COVERAGE'
            : riskLevel == RiskLevel.unavailable
                ? 'UNAVAILABLE'
                : riskLevel.name.toUpperCase(),
        'confidence': confidence.name.toUpperCase(),
        'historical_condition_window': historicalConditionWindow,
        'contributing_factors': contributingFactors,
        'factors': factors.toJson(),
        'computed_at': lastUpdated.toIso8601String(),
        'historical_events': historicalEvents,
      };

  /// Empty/initial zone — used as placeholder before data loads.
  /// Does NOT represent any real risk state.
  factory ZoneRiskModel.empty() {
    return ZoneRiskModel(
      zoneId: '',
      zoneName: 'No Zone Selected',
      state: '',
      district: '',
      latitude: 0.0,
      longitude: 0.0,
      riskScore: null,
      riskLevel: RiskLevel.low,
      confidence: ConfidenceLevel.low,
      historicalConditionWindow: '',
      factors: const RiskFactors(),
      lastUpdated: DateTime.now(),
      historicalEvents: const [],
      contributingFactors: const [],
      modelOutputs: ModelOutputs.unavailable(),
      nisarStatus: NisarStatus.unavailable(),
      eos04Status: Eos04Status.unavailable(),
    );
  }
}
