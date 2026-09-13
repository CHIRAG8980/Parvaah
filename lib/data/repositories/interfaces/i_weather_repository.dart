import '../../models/weather_forecast_model.dart';

abstract class IWeatherRepository {
  Future<WeatherForecastModel> getForecast({
    String zoneId = 'ZONE-EAST-KHASI-HILLS',
    bool forceRefresh = false,
  });
}
