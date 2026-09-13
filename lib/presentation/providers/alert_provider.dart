import 'package:flutter/material.dart';
import '../../core/errors/exception_translator.dart';
import '../../data/models/alert_model.dart';
import '../../data/repositories/interfaces/i_alert_repository.dart';
import 'view_state.dart';

class AlertProvider extends ChangeNotifier {
  final IAlertRepository _repository;

  List<AlertModel> _alerts = [];
  AlertSeverity? _selectedSeverity;
  ViewState _viewState = ViewState.initial;
  String? _errorMessage;

  AlertProvider(this._repository) {
    loadAlerts();
  }

  List<AlertModel> get alerts {
    if (_selectedSeverity == null) return _alerts;
    return _alerts.where((a) => a.severity == _selectedSeverity).toList();
  }

  List<AlertModel> get allAlerts => _alerts;
  AlertSeverity? get selectedSeverity => _selectedSeverity;
  ViewState get viewState => _viewState;
  bool get isLoading => _viewState == ViewState.loading;
  String? get errorMessage => _errorMessage;

  int get unreadCount => _alerts.where((a) => !a.isRead).length;

  AlertModel? get primaryActiveAlert {
    if (_alerts.isEmpty) return null;
    return _alerts.firstWhere(
      (a) => a.severity == AlertSeverity.critical || a.severity == AlertSeverity.high,
      orElse: () => _alerts.first,
    );
  }

  Future<void> loadAlerts({
    String? zoneId,
    String language = 'en',
    bool forceRefresh = false,
  }) async {
    _viewState = ViewState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _alerts = await _repository.getAlerts(
        zoneId: zoneId,
        language: language,
        forceRefresh: forceRefresh,
      );
      if (_alerts.isEmpty) {
        _viewState = ViewState.empty;
      } else {
        _viewState = ViewState.success;
      }
    } catch (e) {
      _errorMessage = ExceptionTranslator.toUserMessage(e);
      _viewState = _alerts.isNotEmpty ? ViewState.success : ViewState.failure;
    } finally {
      notifyListeners();
    }
  }

  void filterBySeverity(AlertSeverity? severity) {
    _selectedSeverity = severity;
    notifyListeners();
  }

  Future<void> markAsRead(String alertId) async {
    final index = _alerts.indexWhere((a) => a.id == alertId);
    if (index != -1) {
      _alerts[index] = _alerts[index].copyWith(isRead: true);
      await _repository.markAsRead(alertId);
      notifyListeners();
    }
  }
}
