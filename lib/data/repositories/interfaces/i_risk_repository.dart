import '../../models/zone_risk_model.dart';

abstract class IRiskRepository {
  Future<List<ZoneRiskModel>> getAllZones({
    String? district,
    String? state,
    bool forceRefresh = false,
  });

  Future<ZoneRiskModel?> getZoneById(String zoneId);

  DateTime? getLastSyncTime();

  bool isDataStale();
}
