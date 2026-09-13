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

  static final List<ZoneRiskModel> defaultNERZones = [
    ZoneRiskModel(
      zoneId: 'NER-MEG-001',
      zoneName: 'Sohra (Cherrapunji) Sector A',
      state: 'Meghalaya',
      district: 'East Khasi Hills',
      latitude: 25.2986,
      longitude: 91.7314,
      riskScore: 0.91,
      riskLevel: RiskLevel.critical,
      confidence: ConfidenceLevel.high,
      timeToFailure: 'Elevated failure probability within 24–48 hours',
      factors: const RiskFactors(
        rainfall24hMm: 198.4,
        rainfall72hCumulativeMm: 342.1,
        soilMoisturePct: 88.5,
        slopeDegrees: 38.2,
        insarDeformationMmYr: -24.6,
        ndviIndex: 0.38,
      ),
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 18)),
      historicalEvents: [
        'June 2024: Debris slide near Nohkalikai junction',
        'July 2022: Major rockfall along Shella road cutting',
      ],
    ),
    ZoneRiskModel(
      zoneId: 'NER-MIZ-003',
      zoneName: 'Aizawl North Ridge',
      state: 'Mizoram',
      district: 'Aizawl',
      latitude: 23.7307,
      longitude: 92.7173,
      riskScore: 0.74,
      riskLevel: RiskLevel.high,
      confidence: ConfidenceLevel.high,
      timeToFailure: 'Active slope creep; monitoring retaining walls',
      factors: const RiskFactors(
        rainfall24hMm: 112.0,
        rainfall72hCumulativeMm: 184.5,
        soilMoisturePct: 76.2,
        slopeDegrees: 42.0,
        insarDeformationMmYr: -18.2,
        ndviIndex: 0.42,
      ),
      lastUpdated: DateTime.now().subtract(const Duration(hours: 1)),
      historicalEvents: [
        'May 2024: Cyclone Remal stone quarry collapse',
      ],
    ),
    ZoneRiskModel(
      zoneId: 'NER-NAG-005',
      zoneName: 'Kohima Dzüdza Valley',
      state: 'Nagaland',
      district: 'Kohima',
      latitude: 25.6747,
      longitude: 94.1103,
      riskScore: 0.82,
      riskLevel: RiskLevel.high,
      confidence: ConfidenceLevel.high,
      timeToFailure: 'Sinking zone active along NH-2 corridor',
      factors: const RiskFactors(
        rainfall24hMm: 145.2,
        rainfall72hCumulativeMm: 220.0,
        soilMoisturePct: 82.0,
        slopeDegrees: 35.5,
        insarDeformationMmYr: -21.0,
        ndviIndex: 0.35,
      ),
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 32)),
      historicalEvents: [
        'Aug 2024: Major road breach at Phesama',
      ],
    ),
    ZoneRiskModel(
      zoneId: 'NER-SKM-014',
      zoneName: 'Gangtok 29th Mile Teesta Basin',
      state: 'Sikkim',
      district: 'East Sikkim',
      latitude: 27.3389,
      longitude: 88.6065,
      riskScore: 0.78,
      riskLevel: RiskLevel.high,
      confidence: ConfidenceLevel.high,
      timeToFailure: 'River bank scouring; NH-10 arterial link at risk',
      factors: const RiskFactors(
        rainfall24hMm: 128.5,
        rainfall72hCumulativeMm: 210.0,
        soilMoisturePct: 79.0,
        slopeDegrees: 40.1,
        insarDeformationMmYr: -16.4,
        ndviIndex: 0.44,
      ),
      lastUpdated: DateTime.now().subtract(const Duration(hours: 2)),
      historicalEvents: [
        'Oct 2023: Teesta flash flood slope destabilization',
      ],
    ),
    ZoneRiskModel(
      zoneId: 'NER-ARU-009',
      zoneName: 'Tawang Pass Corridor',
      state: 'Arunachal Pradesh',
      district: 'Tawang',
      latitude: 27.5861,
      longitude: 91.8594,
      riskScore: 0.44,
      riskLevel: RiskLevel.medium,
      confidence: ConfidenceLevel.medium,
      timeToFailure: 'Freeze-thaw monitoring; low short-term displacement',
      factors: const RiskFactors(
        rainfall24hMm: 52.0,
        rainfall72hCumulativeMm: 80.0,
        soilMoisturePct: 46.0,
        slopeDegrees: 36.0,
        insarDeformationMmYr: -5.0,
        ndviIndex: 0.39,
      ),
      lastUpdated: DateTime.now().subtract(const Duration(hours: 4)),
      historicalEvents: [],
    ),
    ZoneRiskModel(
      zoneId: 'NER-ASM-002',
      zoneName: 'Kamrup Metro Foothills',
      state: 'Assam',
      district: 'Kamrup Metropolitan',
      latitude: 26.1445,
      longitude: 91.7362,
      riskScore: 0.18,
      riskLevel: RiskLevel.low,
      confidence: ConfidenceLevel.high,
      timeToFailure: 'No failure anticipated within current 7-day model run',
      factors: const RiskFactors(
        rainfall24hMm: 16.0,
        rainfall72hCumulativeMm: 32.0,
        soilMoisturePct: 28.0,
        slopeDegrees: 15.0,
        insarDeformationMmYr: -1.2,
        ndviIndex: 0.58,
      ),
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 50)),
      historicalEvents: [],
    ),
  ];

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

    await cacheService.setJsonList(
      CacheService.keyCachedRisks,
      defaultNERZones.map((z) => z.toJson()).toList(),
    );
    await cacheService.setLastSyncTime(DateTime.now());
    return defaultNERZones;
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
