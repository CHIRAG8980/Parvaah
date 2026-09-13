class DailyForecastPoint {
  final String date;
  final String dayLabel;
  final double rainfallImdMm;
  final double rainfallCommunityMm;
  final double predictedRiskScore;
  final bool isForecast;

  const DailyForecastPoint({
    required this.date,
    required this.dayLabel,
    required this.rainfallImdMm,
    required this.rainfallCommunityMm,
    required this.predictedRiskScore,
    required this.isForecast,
  });

  factory DailyForecastPoint.fromJson(Map<String, dynamic> json) {
    return DailyForecastPoint(
      date: json['date'] as String? ?? '',
      dayLabel: json['day_label'] as String? ?? '',
      rainfallImdMm: (json['rainfall_imd_mm'] as num?)?.toDouble() ?? 0.0,
      rainfallCommunityMm: (json['rainfall_community_mm'] as num?)?.toDouble() ?? 0.0,
      predictedRiskScore: (json['predicted_risk_score'] as num?)?.toDouble() ?? 0.0,
      isForecast: json['is_forecast'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'date': date,
        'day_label': dayLabel,
        'rainfall_imd_mm': rainfallImdMm,
        'rainfall_community_mm': rainfallCommunityMm,
        'predicted_risk_score': predictedRiskScore,
        'is_forecast': isForecast,
      };
}

class WeatherForecastModel {
  final String zoneId;
  final String zoneName;
  final double current24hRainfallMm;
  final double cumulative72hRainfallMm;
  final String rainfallTrend;
  final int communityGaugesCount;
  final List<DailyForecastPoint> timeline;

  const WeatherForecastModel({
    required this.zoneId,
    required this.zoneName,
    required this.current24hRainfallMm,
    required this.cumulative72hRainfallMm,
    required this.rainfallTrend,
    required this.communityGaugesCount,
    required this.timeline,
  });

  factory WeatherForecastModel.fromJson(Map<String, dynamic> json) {
    final rawTimeline = json['timeline'] as List<dynamic>? ?? [];
    final points = rawTimeline
        .map((e) => DailyForecastPoint.fromJson(e as Map<String, dynamic>))
        .toList();

    return WeatherForecastModel(
      zoneId: json['zone_id'] as String? ?? '',
      zoneName: json['zone_name'] as String? ?? '',
      current24hRainfallMm: (json['current_24h_rainfall_mm'] as num?)?.toDouble() ?? 0.0,
      cumulative72hRainfallMm: (json['cumulative_72h_rainfall_mm'] as num?)?.toDouble() ?? 0.0,
      rainfallTrend: json['rainfall_trend'] as String? ?? 'stable',
      communityGaugesCount: (json['community_gauges_count'] as num?)?.toInt() ?? 0,
      timeline: points,
    );
  }

  Map<String, dynamic> toJson() => {
        'zone_id': zoneId,
        'zone_name': zoneName,
        'current_24h_rainfall_mm': current24hRainfallMm,
        'cumulative_72h_rainfall_mm': cumulative72hRainfallMm,
        'rainfall_trend': rainfallTrend,
        'community_gauges_count': communityGaugesCount,
        'timeline': timeline.map((p) => p.toJson()).toList(),
      };
}
