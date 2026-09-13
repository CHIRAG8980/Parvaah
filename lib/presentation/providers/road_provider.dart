import 'package:flutter/material.dart';
import '../../data/models/road_status_model.dart';
import '../../data/repositories/road_repository.dart';

class RoadProvider extends ChangeNotifier {
  final RoadRepository _repository;

  List<RoadStatusModel> _roads = RoadRepository.defaultRoads;
  bool _isLoading = false;

  RoadProvider(this._repository) {
    loadRoads();
  }

  List<RoadStatusModel> get roads => _roads;
  bool get isLoading => _isLoading;

  List<RoadStatusModel> get blockedRoads =>
      _roads.where((r) => r.status == RoadCondition.blocked).toList();

  List<RoadStatusModel> get atRiskRoads =>
      _roads.where((r) => r.status == RoadCondition.atRisk).toList();

  List<RoadStatusModel> get openRoads =>
      _roads.where((r) => r.status == RoadCondition.open).toList();

  Future<void> loadRoads() async {
    _isLoading = true;
    notifyListeners();

    try {
      _roads = await _repository.getRoads();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
