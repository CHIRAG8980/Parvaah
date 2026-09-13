import 'package:flutter/material.dart';
import '../../data/models/alert_model.dart';
import '../../data/repositories/alert_repository.dart';

class AlertProvider extends ChangeNotifier {
  final AlertRepository _repository;

  List<AlertModel> _alerts = AlertRepository.defaultAlerts;
  AlertSeverity? _selectedSeverity;
  bool _isLoading = false;

  AlertProvider(this._repository) {
    loadAlerts();
  }

  List<AlertModel> get alerts {
    if (_selectedSeverity == null) return _alerts;
    return _alerts.where((a) => a.severity == _selectedSeverity).toList();
  }

  AlertSeverity? get selectedSeverity => _selectedSeverity;
  bool get isLoading => _isLoading;

  int get unreadCount => _alerts.where((a) => !a.isRead).length;

  AlertModel? get primaryActiveAlert {
    if (_alerts.isEmpty) return null;
    return _alerts.firstWhere(
      (a) => a.severity == AlertSeverity.critical || a.severity == AlertSeverity.high,
      orElse: () => _alerts.first,
    );
  }

  Future<void> loadAlerts() async {
    _isLoading = true;
    notifyListeners();

    try {
      _alerts = await _repository.getAlerts();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void filterBySeverity(AlertSeverity? severity) {
    _selectedSeverity = severity;
    notifyListeners();
  }

  void markAsRead(String alertId) {
    final index = _alerts.indexWhere((a) => a.id == alertId);
    if (index != -1) {
      final old = _alerts[index];
      _alerts[index] = AlertModel(
        id: old.id,
        title: old.title,
        message: old.message,
        region: old.region,
        severity: old.severity,
        timestamp: old.timestamp,
        isRead: true,
        actionLabel: old.actionLabel,
        instructions: old.instructions,
      );
      notifyListeners();
    }
  }
}
