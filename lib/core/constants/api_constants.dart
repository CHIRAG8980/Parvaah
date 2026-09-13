class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'http://10.0.2.2:8000/api/v1';
  static const String getRisks = '/zones';
  static const String getRoads = '/roads';
  static const String getAlerts = '/alerts/active';
  static const String getForecast = '/weather/forecast';
  static const String getUserProfile = '/user/profile';

  static const Duration timeout = Duration(seconds: 10);
}
