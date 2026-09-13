import 'package:flutter/material.dart';
import '../../core/errors/exception_translator.dart';
import '../../data/models/road_status_model.dart';
import '../../data/repositories/interfaces/i_road_repository.dart';
import 'view_state.dart';

class RoadProvider extends ChangeNotifier {
  final IRoadRepository _repository;

  List<RoadStatusModel> _roads = [];
  ViewState _viewState = ViewState.initial;
  String? _errorMessage;

  RoadProvider(this._repository) {
    loadRoads();
  }

  List<RoadStatusModel> get roads => _roads;
  ViewState get viewState => _viewState;
  bool get isLoading => _viewState == ViewState.loading;
  String? get errorMessage => _errorMessage;

  List<RoadStatusModel> get blockedRoads =>
      _roads.where((r) => r.status == RoadCondition.blocked).toList();

  List<RoadStatusModel> get atRiskRoads =>
      _roads.where((r) => r.status == RoadCondition.atRisk).toList();

  List<RoadStatusModel> get openRoads =>
      _roads.where((r) => r.status == RoadCondition.open).toList();

  Future<void> loadRoads({bool forceRefresh = false}) async {
    _viewState = ViewState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _roads = await _repository.getRoads(forceRefresh: forceRefresh);
      if (_roads.isEmpty) {
        _viewState = ViewState.empty;
      } else {
        _viewState = ViewState.success;
      }
    } catch (e) {
      _errorMessage = ExceptionTranslator.toUserMessage(e);
      _viewState = _roads.isNotEmpty ? ViewState.success : ViewState.failure;
    } finally {
      notifyListeners();
    }
  }
}
