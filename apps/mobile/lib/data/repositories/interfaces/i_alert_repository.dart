import '../../models/alert_model.dart';

abstract class IAlertRepository {
  Future<List<AlertModel>> getAlerts({
    AlertSeverity? filter,
    String? zoneId,
    String language = 'en',
    bool forceRefresh = false,
  });

  Future<void> markAsRead(String alertId);
}
