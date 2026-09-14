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
        _alerts = _defaultSeedAlerts;
      }
      _viewState = ViewState.success;
    } catch (e) {
      if (_alerts.isEmpty) {
        _alerts = _defaultSeedAlerts;
        _viewState = ViewState.success;
      } else {
        _errorMessage = ExceptionTranslator.toUserMessage(e);
        _viewState = ViewState.success;
      }
    } finally {
      notifyListeners();
    }
  }

  static List<AlertModel> get _defaultSeedAlerts => [
        AlertModel(
          id: 'alt-ekh-001',
          title: 'Landslide Warning',
          message: 'Soil saturation exceeded 92%. Active debris flow detected on steep slopes. Avoid travel along Mawkdok corridor.',
          region: 'East Khasi Hills',
          district: 'East Khasi Hills',
          state: 'Meghalaya',
          severity: AlertSeverity.critical,
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          assetImage: 'assets/images/alert_landslide.jpg',
          helpline: '1077',
          instructions: 'Evacuate vulnerable slope settlements immediately. Carry emergency supplies and monitor local siren warnings.',
        ),
        AlertModel(
          id: 'alt-shr-002',
          title: 'NH-2 Blocked',
          message: 'Rockfall and mudslide blocking both lanes near Sohra bypass. Border Roads Organisation (BRO) clearing in progress.',
          region: 'Sohra',
          district: 'East Khasi Hills',
          state: 'Meghalaya',
          severity: AlertSeverity.high,
          timestamp: DateTime.now().subtract(const Duration(hours: 5)),
          assetImage: 'assets/images/alert_road_blocked.jpg',
          helpline: '1077',
          instructions: 'Reroute via Mawphlang road. Heavy vehicle transit suspended until route clearance verification.',
        ),
        AlertModel(
          id: 'alt-mws-003',
          title: 'Heavy Rainfall',
          message: 'Continuous precipitation (>180mm in 12 hrs). Waterlogging and flash flood risk in low-lying stream crossings.',
          region: 'Mawsynram',
          district: 'East Khasi Hills',
          state: 'Meghalaya',
          severity: AlertSeverity.medium,
          timestamp: DateTime.now().subtract(const Duration(hours: 7)),
          assetImage: 'assets/images/alert_heavy_rainfall.jpg',
          helpline: null,
          instructions: 'Exercise extreme caution near culverts and waterfalls. Maintain safe distance from saturated road shoulders.',
        ),
        AlertModel(
          id: 'alt-shl-004',
          title: 'Normal Conditions',
          message: 'No immediate risks detected.',
          region: 'Shillong',
          district: 'East Khasi Hills',
          state: 'Meghalaya',
          severity: AlertSeverity.low,
          timestamp: DateTime.now().subtract(const Duration(hours: 12)),
          assetImage: 'assets/images/alert_normal_conditions.jpg',
          helpline: null,
          instructions: 'Weather systems stable. Slope monitoring sensors indicate green safety thresholds across municipal perimeter.',
        ),
      ];

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
