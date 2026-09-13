import 'package:flutter/material.dart';
import '../../data/models/zone_risk_model.dart';
import '../../data/repositories/interfaces/i_risk_repository.dart';
import '../../data/services/cache_service.dart';

class LocationProvider extends ChangeNotifier {
  final IRiskRepository _riskRepository;
  final CacheService _cacheService;

  ZoneRiskModel? _selectedZone;
  List<ZoneRiskModel> _availableZones = [];
  String _searchQuery = '';

  LocationProvider(this._riskRepository, this._cacheService) {
    _init();
  }

  ZoneRiskModel get selectedZone =>
      _selectedZone ??
      (_availableZones.isNotEmpty ? _availableZones.first : ZoneRiskModel.empty());

  List<ZoneRiskModel> get availableZones => _availableZones;
  String get searchQuery => _searchQuery;

  List<ZoneRiskModel> get filteredZones {
    if (_searchQuery.trim().isEmpty) return _availableZones;
    final query = _searchQuery.toLowerCase();
    return _availableZones.where((zone) {
      return zone.zoneName.toLowerCase().contains(query) ||
          zone.district.toLowerCase().contains(query) ||
          zone.state.toLowerCase().contains(query);
    }).toList();
  }

  Future<void> _init() async {
    _availableZones = await _riskRepository.getAllZones();
    final savedZoneId = _cacheService.getString(CacheService.keySelectedZone);
    if (savedZoneId.isNotEmpty && _availableZones.isNotEmpty) {
      try {
        _selectedZone = _availableZones.firstWhere(
          (zone) => zone.zoneId == savedZoneId,
        );
      } catch (_) {
        _selectedZone = _availableZones.first;
      }
    }
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> selectZone(ZoneRiskModel zone) async {
    _selectedZone = zone;
    await _cacheService.setString(CacheService.keySelectedZone, zone.zoneId);
    notifyListeners();
  }
}
