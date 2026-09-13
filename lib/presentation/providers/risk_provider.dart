import 'package:flutter/material.dart';
import '../../core/errors/exception_translator.dart';
import '../../data/models/zone_risk_model.dart';
import '../../data/repositories/interfaces/i_risk_repository.dart';
import 'view_state.dart';

class RiskProvider extends ChangeNotifier {
  final IRiskRepository _repository;

  List<ZoneRiskModel> _zones = [];
  ViewState _viewState = ViewState.initial;
  String? _errorMessage;

  RiskProvider(this._repository) {
    loadRisks();
  }

  List<ZoneRiskModel> get zones => _zones;
  ViewState get viewState => _viewState;
  bool get isLoading => _viewState == ViewState.loading;
  String? get errorMessage => _errorMessage;

  int get highRiskAreasCount =>
      _zones.where((z) => z.riskLevel == RiskLevel.high || z.riskLevel == RiskLevel.critical).length;

  Future<void> loadRisks({bool forceRefresh = false}) async {
    _viewState = ViewState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _zones = await _repository.getAllZones(forceRefresh: forceRefresh);
      if (_zones.isEmpty) {
        _viewState = ViewState.empty;
      } else {
        _viewState = ViewState.success;
      }
    } catch (e) {
      _errorMessage = ExceptionTranslator.toUserMessage(e);
      _viewState = _zones.isNotEmpty ? ViewState.success : ViewState.failure;
    } finally {
      notifyListeners();
    }
  }

  bool get isDataStale => _repository.isDataStale();
}
