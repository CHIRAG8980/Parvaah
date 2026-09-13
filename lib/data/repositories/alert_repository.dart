import '../models/alert_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import '../../core/constants/api_constants.dart';

class AlertRepository {
  final ApiClient apiClient;
  final CacheService cacheService;

  AlertRepository({
    required this.apiClient,
    required this.cacheService,
  });

  Future<List<AlertModel>> getAlerts({AlertSeverity? filter}) async {
    final response = await apiClient.get(ApiConstants.getAlerts);
    if (response.isSuccess && response.data is List) {
      try {
        final list = (response.data as List)
            .map((e) => AlertModel.fromJson(e as Map<String, dynamic>))
            .toList();
        await cacheService.setJsonList(
          CacheService.keyCachedAlerts,
          list.map((a) => a.toJson()).toList(),
        );
        return _applyFilter(list, filter);
      } catch (_) {}
    }

    final cached = cacheService.getJsonList(CacheService.keyCachedAlerts);
    if (cached != null && cached.isNotEmpty) {
      try {
        final list = cached.map((e) => AlertModel.fromJson(e)).toList();
        return _applyFilter(list, filter);
      } catch (_) {}
    }

    return [];
  }

  List<AlertModel> _applyFilter(List<AlertModel> list, AlertSeverity? filter) {
    if (filter == null) return list;
    return list.where((a) => a.severity == filter).toList();
  }
}
