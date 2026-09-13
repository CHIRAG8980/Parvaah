import '../models/road_status_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import '../../core/constants/api_constants.dart';

class RoadRepository {
  final ApiClient apiClient;
  final CacheService cacheService;

  RoadRepository({
    required this.apiClient,
    required this.cacheService,
  });


  Future<List<RoadStatusModel>> getRoads() async {
    final response = await apiClient.get(ApiConstants.getRoads);
    if (response.isSuccess && response.data is List) {
      try {
        final list = (response.data as List)
            .map((e) => RoadStatusModel.fromJson(e as Map<String, dynamic>))
            .toList();
        await cacheService.setJsonList(
          CacheService.keyCachedRoads,
          list.map((r) => r.toJson()).toList(),
        );
        return list;
      } catch (_) {}
    }

    final cached = cacheService.getJsonList(CacheService.keyCachedRoads);
    if (cached != null && cached.isNotEmpty) {
      try {
        return cached.map((e) => RoadStatusModel.fromJson(e)).toList();
      } catch (_) {}
    }

    return [];
  }
}
