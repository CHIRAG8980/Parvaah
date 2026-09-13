import 'package:flutter/foundation.dart';

class ApiConstants {
  ApiConstants._();

  static String? _customBaseUrl;

  static void setCustomBaseUrl(String url) {
    _customBaseUrl = url;
  }

  static String get baseUrl {
    if (_customBaseUrl != null && _customBaseUrl!.isNotEmpty) {
      return _customBaseUrl!;
    }
    if (kIsWeb) {
      return 'http://localhost:8000/api/v1';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  // Authentication
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String currentUser = '/auth/me';

  // Zones & Hazards
  static const String zones = '/zones';
  static String zoneDetail(String zoneId) => '/zones/$zoneId/detail';
  static String zoneRisk(String zoneId) => '/zones/$zoneId/risk';
  static String zoneForecast(String zoneId) => '/zones/$zoneId/forecast';

  // Alerts
  static const String activeAlerts = '/alerts/active';
  static const String alertQueue = '/alerts/queue';

  // Roads & Connectivity
  static const String roads = '/roads';
  static const String reroute = '/roads/reroute';
  static String roadDetail(String roadId) => '/roads/$roadId';

  // Weather & Telemetry
  static const String weatherForecast = '/weather/forecast';
  static const String weatherReadings = '/weather/readings';

  // Legacy aliases for backward compatibility
  static const String getRisks = zones;
  static const String getRoads = roads;
  static const String getAlerts = activeAlerts;
  static const String getForecast = weatherForecast;
  static const String getUserProfile = currentUser;

  static const Duration timeout = Duration(seconds: 15);
}
