import 'package:flutter/material.dart';
import '../../data/models/zone_risk_model.dart';
import '../../data/repositories/risk_repository.dart';
import '../../data/services/cache_service.dart';

class LocationProvider extends ChangeNotifier {
  final RiskRepository _riskRepository;
  final CacheService _cacheService;

  ZoneRiskModel _selectedZone = RiskRepository.defaultNERZones.first;
  List<ZoneRiskModel> _availableZones = RiskRepository.defaultNERZones;
  String _searchQuery = '';

  LocationProvider(this._riskRepository, this._cacheService) {
    _init();
  }

  ZoneRiskModel get selectedZone => _selectedZone;
  List<ZoneRiskModel> get availableZones => _availableZones;
  String get searchQuery => _searchQuery;

  List<ZoneRiskModel> get filteredZones {
    if (_searchQuery.trim().isEmpty) return _availableZones;
    final q = _searchQuery.toLowerCase();
    return _availableZones.where((z) {
      return z.zoneName.toLowerCase().contains(q) ||
          z.district.toLowerCase().contains(q) ||
          z.state.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _init() async {
    _availableZones = await _riskRepository.getAllZones();
    final savedZoneId = _cacheService.getString(CacheService.keySelectedZone);
    if (savedZoneId.isNotEmpty) {
      _selectedZone = _availableZones.firstWhere(
        (z) => z.zoneId == savedZoneId,
        orElse: () => _availableZones.first,
      );
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
