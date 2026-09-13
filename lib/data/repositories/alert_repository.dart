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

  static final List<AlertModel> defaultAlerts = [
    AlertModel(
      id: 'ALT-NER-001',
      title: 'High Landslide Risk Warning',
      message:
          'Heavy rainfall (198mm in 24h) and saturated slope detected in Sohra (Cherrapunji) Sector A. High probability of debris flow along Shella road cutting.',
      region: 'East Khasi Hills, Meghalaya',
      severity: AlertSeverity.critical,
      timestamp: DateTime.now().subtract(const Duration(minutes: 18)),
      actionLabel: 'View Safety Details',
      instructions:
          'Evacuate vulnerable dwellings near unreinforced slopes. Avoid NH-6 night transit. Contact SDMA helpline 1077 for immediate emergency assistance.',
    ),
    AlertModel(
      id: 'ALT-NER-002',
      title: 'NH-2 Highway Mudslide Blockage',
      message:
          'Active mudslide near KM 42 (Dzüdza bridge) on NH-2 Dimapur-Kohima highway. BRO clearing crew on site. Light vehicles divert via Medziphema-Peren.',
      region: 'Kohima - Dimapur, Nagaland',
      severity: AlertSeverity.high,
      timestamp: DateTime.now().subtract(const Duration(minutes: 35)),
      actionLabel: 'View Alternate Route',
      instructions:
          'Expect 45-60 minute delays. Follow BRO marshals on site. Heavy commercial freight halted at Chumoukedima checkpost.',
    ),
    AlertModel(
      id: 'ALT-NER-003',
      title: 'Monsoon Downpour Flash Alert',
      message:
          'IMD radar confirms convective storm bands moving towards Aizawl North Ridge and Lunglei corridor with 40mm/hr precipitation intensity.',
      region: 'Aizawl, Mizoram',
      severity: AlertSeverity.medium,
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      actionLabel: 'View Advisory',
      instructions:
          'Check rooftop drainage exits and ensure retaining wall weep holes are unblocked.',
    ),
    AlertModel(
      id: 'ALT-NER-004',
      title: 'Teesta Basin River Bank Erosion',
      message:
          'Elevated river discharge along 29th Mile corridor near Sevoke. Precautionary speed limits enforced on NH-10.',
      region: 'Kalimpong - East Sikkim',
      severity: AlertSeverity.low,
      timestamp: DateTime.now().subtract(const Duration(hours: 5)),
      actionLabel: 'Read Notice',
      instructions:
          'Maintain safe vehicle following distance and monitor local traffic police advisories.',
    ),
  ];

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

    await cacheService.setJsonList(
      CacheService.keyCachedAlerts,
      defaultAlerts.map((a) => a.toJson()).toList(),
    );
    return _applyFilter(defaultAlerts, filter);
  }

  List<AlertModel> _applyFilter(List<AlertModel> list, AlertSeverity? filter) {
    if (filter == null) return list;
    return list.where((a) => a.severity == filter).toList();
  }
}
