import '../../core/constants/api_constants.dart';
import '../../core/errors/app_exceptions.dart';
import '../models/road_status_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import 'interfaces/i_road_repository.dart';

class RoadRepository implements IRoadRepository {
  final ApiClient apiClient;
  final CacheService cacheService;

  RoadRepository({
    required this.apiClient,
    required this.cacheService,
  });

  @override
  Future<List<RoadStatusModel>> getRoads({
    String? district,
    String? zoneId,
    bool forceRefresh = false,
  }) async {
    final query = <String, dynamic>{};
    if (district != null && district.isNotEmpty) query['district'] = district;
    if (zoneId != null && zoneId.isNotEmpty) query['zone_id'] = zoneId;

    final response = await apiClient.get(
      ApiConstants.roads,
      queryParameters: query.isNotEmpty ? query : null,
    );

    if (response.isSuccess && response.data is List) {
      try {
        final list = (response.data as List)
            .map((item) => RoadStatusModel.fromJson(item as Map<String, dynamic>))
            .toList();

        await cacheService.setJsonList(
          CacheService.keyCachedRoads,
          list.map((r) => r.toJson()).toList(),
        );

        return list;
      } catch (e) {
        throw DataParseException('Failed to parse road corridors telemetry: $e');
      }
    }

    final cached = cacheService.getJsonList(CacheService.keyCachedRoads);
    if (cached != null && cached.isNotEmpty) {
      try {
        return cached.map((e) => RoadStatusModel.fromJson(e)).toList();
      } catch (e) {
        throw DataParseException('Failed to parse cached road corridors telemetry: $e');
      }
    }

    throw ServerException(
      response.errorMessage ?? 'Failed to retrieve road corridors status from transport network',
      response.statusCode,
    );
  }

  @override
  Future<RoadStatusModel?> getRoadById(String roadId) async {
    final response = await apiClient.get(ApiConstants.roadDetail(roadId));
    if (response.isSuccess && response.data is Map<String, dynamic>) {
      try {
        return RoadStatusModel.fromJson(response.data as Map<String, dynamic>);
      } catch (_) {}
    }

    final allRoads = await getRoads();
    try {
      return allRoads.firstWhere((r) => r.roadId == roadId);
    } catch (_) {
      return null;
    }
  }
}
