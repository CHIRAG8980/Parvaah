import '../models/zone_risk_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/date_formatter.dart';

class RiskRepository {
  final ApiClient apiClient;
  final CacheService cacheService;

  RiskRepository({
    required this.apiClient,
    required this.cacheService,
  });


  Future<List<ZoneRiskModel>> getAllZones() async {
    final response = await apiClient.get(ApiConstants.getRisks);
    if (response.isSuccess && response.data is List) {
      try {
        final list = (response.data as List)
            .map((item) => ZoneRiskModel.fromJson(item as Map<String, dynamic>))
            .toList();
        await cacheService.setJsonList(
          CacheService.keyCachedRisks,
          list.map((z) => z.toJson()).toList(),
        );
        await cacheService.setLastSyncTime(DateTime.now());
        return list;
      } catch (_) {}
    }

    final cached = cacheService.getJsonList(CacheService.keyCachedRisks);
    if (cached != null && cached.isNotEmpty) {
      try {
        return cached.map((item) => ZoneRiskModel.fromJson(item)).toList();
      } catch (_) {}
    }

    return [];
  }

  Future<ZoneRiskModel?> getZoneById(String zoneId) async {
    final zones = await getAllZones();
    return zones.firstWhere(
      (z) => z.zoneId == zoneId,
      orElse: () => zones.first,
    );
  }

  DateTime? getLastSyncTime() {
    return cacheService.getLastSyncTime();
  }

  bool isDataStale() {
    return DateFormatter.isStale(cacheService.getLastSyncTime());
  }
}
