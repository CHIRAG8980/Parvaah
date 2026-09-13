import 'package:flutter/material.dart';
import '../../core/errors/exception_translator.dart';
import '../../data/models/weather_forecast_model.dart';
import '../../data/repositories/interfaces/i_weather_repository.dart';
import 'view_state.dart';

class WeatherProvider extends ChangeNotifier {
  final IWeatherRepository _repository;

  WeatherForecastModel? _forecast;
  ViewState _viewState = ViewState.initial;
  String? _errorMessage;

  WeatherProvider(this._repository);

  WeatherForecastModel? get forecast => _forecast;
  ViewState get viewState => _viewState;
  bool get isLoading => _viewState == ViewState.loading;
  String? get errorMessage => _errorMessage;

  Future<void> loadForecast({String zoneId = 'ZONE-EAST-KHASI-HILLS'}) async {
    _viewState = ViewState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _forecast = await _repository.getForecast(zoneId: zoneId);
      _viewState = ViewState.success;
    } catch (e) {
      _errorMessage = ExceptionTranslator.toUserMessage(e);
      _viewState = _forecast != null ? ViewState.success : ViewState.failure;
    } finally {
      notifyListeners();
    }
  }
}
