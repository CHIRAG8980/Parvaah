import '../../core/constants/api_constants.dart';
import '../../core/errors/app_exceptions.dart';
import '../models/alert_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import 'interfaces/i_alert_repository.dart';

class AlertRepository implements IAlertRepository {
  final ApiClient apiClient;
  final CacheService cacheService;

  AlertRepository({
    required this.apiClient,
    required this.cacheService,
  });

  @override
  Future<List<AlertModel>> getAlerts({
    AlertSeverity? filter,
    String? zoneId,
    String language = 'en',
    bool forceRefresh = false,
  }) async {
    final query = <String, dynamic>{'lang': language};
    if (zoneId != null && zoneId.isNotEmpty) query['zone_id'] = zoneId;

    final response = await apiClient.get(
      ApiConstants.activeAlerts,
      queryParameters: query,
    );

    if (response.isSuccess && response.data is List) {
      try {
        final list = (response.data as List)
            .map((item) => AlertModel.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();

        await cacheService.setJsonList(
          CacheService.keyCachedAlerts,
          list.map((a) => a.toJson()).toList(),
        );

        return _applyFilter(list, filter);
      } catch (e) {
        throw DataParseException('Failed to parse alerts payload: $e');
      }
    }

    // Zero-fallback policy: When backend is unreachable, throw explicit exception
    final statusCode = response.statusCode;
    if (statusCode == 0 || statusCode == 408 || statusCode >= 500) {
      throw ServerException(
        'Unable to connect to Parvaah server. Check your internet connection.',
        statusCode,
      );
    }

    throw ServerException(
      response.errorMessage ?? 'Failed to retrieve active alerts from warning gateway',
      statusCode,
    );
  }

  @override
  Future<void> markAsRead(String alertId) async {
    final cached = cacheService.getJsonList(CacheService.keyCachedAlerts);
    if (cached != null) {
      final updated = cached.map((item) {
        if (item['alert_id'] == alertId || item['id'] == alertId) {
          item['is_read'] = true;
        }
        return item;
      }).toList();
      await cacheService.setJsonList(CacheService.keyCachedAlerts, updated);
    }
  }

  List<AlertModel> _applyFilter(List<AlertModel> list, AlertSeverity? filter) {
    if (filter == null) return list;
    return list.where((a) => a.severity == filter).toList();
  }
}
