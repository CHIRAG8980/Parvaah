import 'package:flutter/material.dart';
import '../../data/models/zone_risk_model.dart';
import '../../data/repositories/risk_repository.dart';

class RiskProvider extends ChangeNotifier {
  final RiskRepository _repository;

  List<ZoneRiskModel> _zones = RiskRepository.defaultNERZones;
  bool _isLoading = false;
  String? _errorMessage;

  RiskProvider(this._repository) {
    loadRisks();
  }

  List<ZoneRiskModel> get zones => _zones;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  int get highRiskAreasCount =>
      _zones.where((z) => z.riskLevel == RiskLevel.high || z.riskLevel == RiskLevel.critical).length;

  int get affectedRoadsCount => 5;
  int get safeRoutesCount => 12;

  Future<void> loadRisks() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _zones = await _repository.getAllZones();
    } catch (e) {
      _errorMessage = 'Could not sync live risk data. Showing cached baseline.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  bool get isDataStale => _repository.isDataStale();
}
