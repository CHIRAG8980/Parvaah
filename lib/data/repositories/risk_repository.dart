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
            .map((item) => ZoneRiskModel.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();

        if (list.isNotEmpty) {
          await cacheService.setJsonList(
            CacheService.keyCachedRisks,
            list.map((z) => z.toJson()).toList(),
          );
          await cacheService.setLastSyncTime(DateTime.now());
        }
        return list;
      } catch (e) {
        throw DataParseException('Failed to parse risk zones telemetry: $e');
      }
    }

    // Zero-fallback policy: When backend is unreachable, throw explicit exception
    // to inform user and UI rather than silently masking failure.
    final statusCode = response.statusCode;
    if (statusCode == 0 || statusCode == 408 || statusCode >= 500) {
      throw ServerException(
        response.errorMessage ??
            'Unable to connect to Parvaah server. Check your internet connection.',
        statusCode,
      );
    }

    throw ServerException(
      response.errorMessage ??
          'Failed to retrieve landslide risk zones from gateway',
      statusCode,
    );
  }

  @override
  Future<ZoneRiskModel?> getZoneById(String zoneId) async {
    // Prefer the live prediction endpoint for individual zones —
    // this returns full 4-model ML inference output.
    final predResponse = await apiClient.get(ApiConstants.predictZone(zoneId));
    if (predResponse.isSuccess && predResponse.data is Map<String, dynamic>) {
      try {
        return ZoneRiskModel.fromJson(predResponse.data as Map<String, dynamic>);
      } catch (_) {}
    }

    // Fallback to zone detail endpoint
    final detailResponse = await apiClient.get(ApiConstants.zoneDetail(zoneId));
    if (detailResponse.isSuccess &&
        detailResponse.data is Map<String, dynamic>) {
      try {
        return ZoneRiskModel.fromJson(
            detailResponse.data as Map<String, dynamic>);
      } catch (_) {}
    }

    // Last resort: find from already-loaded zone list
    try {
      final allZones = await getAllZones();
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
