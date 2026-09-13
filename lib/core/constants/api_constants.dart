class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'http://10.0.2.2:8000/api/v1';
  static const String getRisks = '/risks';
  static const String getRoads = '/roads';
  static const String getAlerts = '/alerts';
  static const String getForecast = '/forecast';
  static const String getUserProfile = '/user/profile';

  static const Duration timeout = Duration(seconds: 10);
}
