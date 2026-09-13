import '../../core/constants/api_constants.dart';
import '../../core/errors/app_exceptions.dart';
import '../../core/utils/date_formatter.dart';
import '../models/zone_risk_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import 'interfaces/i_risk_repository.dart';

class RiskRepository implements IRiskRepository {
  final ApiClient apiClient;
  final CacheService cacheService;

  RiskRepository({
    required this.apiClient,
    required this.cacheService,
  });

  @override
  Future<List<ZoneRiskModel>> getAllZones({
    String? district,
    String? state,
    bool forceRefresh = false,
  }) async {
    final query = <String, dynamic>{};
    if (district != null && district.isNotEmpty) query['district'] = district;
    if (state != null && state.isNotEmpty) query['state'] = state;

    final response = await apiClient.get(
      ApiConstants.zones,
      queryParameters: query.isNotEmpty ? query : null,
    );

    if (response.isSuccess && response.data is List) {
      try {
        final list = (response.data as List)
            .map((item) => ZoneRiskModel.fromJson(item as Map<String, dynamic>))
            .toList();

        if (list.isNotEmpty) {
          await cacheService.setJsonList(
            CacheService.keyCachedRisks,
            list.map((z) => z.toJson()).toList(),
          );
          await cacheService.setLastSyncTime(DateTime.now());
          return list;
        }
      } catch (e) {
        throw DataParseException('Failed to parse risk zones telemetry: $e');
      }
    }

    // Offline fallback to verified cached data if network failed
    final cached = cacheService.getJsonList(CacheService.keyCachedRisks);
    if (cached != null && cached.isNotEmpty) {
      try {
        return cached.map((item) => ZoneRiskModel.fromJson(item)).toList();
      } catch (e) {
        throw DataParseException('Failed to parse cached risk zones telemetry: $e');
      }
    }

    throw ServerException(
      response.errorMessage ?? 'Failed to retrieve landslide risk zones from gateway',
      response.statusCode,
    );
  }

  @override
  Future<ZoneRiskModel?> getZoneById(String zoneId) async {
    final response = await apiClient.get(ApiConstants.zoneDetail(zoneId));
    if (response.isSuccess && response.data is Map<String, dynamic>) {
      try {
        return ZoneRiskModel.fromJson(response.data as Map<String, dynamic>);
      } catch (_) {}
    }

    final allZones = await getAllZones();
    try {
      return allZones.firstWhere((z) => z.zoneId == zoneId);
    } catch (_) {
      return null;
    }
  }

  @override
  DateTime? getLastSyncTime() {
    return cacheService.getLastSyncTime();
  }

  @override
  bool isDataStale() {
    return DateFormatter.isStale(cacheService.getLastSyncTime());
  }
}
