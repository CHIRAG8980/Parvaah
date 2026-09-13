import '../../core/constants/api_constants.dart';
import '../../core/errors/app_exceptions.dart';
import '../models/weather_forecast_model.dart';
import '../services/api_client.dart';
import 'interfaces/i_weather_repository.dart';

class WeatherRepository implements IWeatherRepository {
  final ApiClient apiClient;

  WeatherRepository({required this.apiClient});

  @override
  Future<WeatherForecastModel> getForecast({
    String zoneId = 'ZONE-EAST-KHASI-HILLS',
    bool forceRefresh = false,
  }) async {
    final response = await apiClient.get(
      ApiConstants.weatherForecast,
      queryParameters: {'zone_id': zoneId},
    );

    if (response.isSuccess && response.data is Map<String, dynamic>) {
      try {
        return WeatherForecastModel.fromJson(response.data as Map<String, dynamic>);
      } catch (e) {
        throw DataParseException('Failed to parse weather forecast telemetry: $e');
      }
    }

    throw ServerException(
      response.errorMessage ?? 'Failed to fetch authentic weather forecast for zone $zoneId',
      response.statusCode,
    );
  }
}
