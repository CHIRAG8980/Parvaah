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
    const envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:8000/api/v1';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      // Android emulator uses 10.0.2.2; for physical devices with `adb reverse tcp:8000 tcp:8000` or custom IP:
      return 'http://10.0.2.2:8000/api/v1';
    }
    // iOS simulator / physical device on same network
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

  // ML Prediction endpoints
  static String predictZone(String zoneId) => '/predict/zone/$zoneId';
  static const String predictMultiModal = '/predict/multi-modal';
  static const String predictSimulate = '/predict/simulate';
  static const String modelVersion = '/predict/model/version';

  // Data source health
  static const String datasourcesHealth = '/datasources/health';

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

  static const Duration timeout = Duration(seconds: 30);
}
