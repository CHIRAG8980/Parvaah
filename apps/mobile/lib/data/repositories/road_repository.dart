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

  static final List<RoadStatusModel> defaultRoads = [
    RoadStatusModel(
      roadId: 'RD-NH2-01',
      roadName: 'NH-2 Dimapur - Kohima - Imphal Highway',
      corridor: 'Nagaland - Manipur Lifeline Corridor',
      status: RoadCondition.blocked,
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 25)),
      reason: 'Active mudslide and boulder collapse near KM 42 (Dzüdza bridge). Clearing operations underway by BRO.',
      zoneId: 'NER-NAG-005',
      suggestedAlternate: 'Via Medziphema - Jalukie - Peren Old State Highway',
      alternateDetails: 'Single lane asphalt corridor; recommended for light motor vehicles only. Add +45 mins travel time.',
      points: const [
        RoadCoord(25.90, 93.73),
        RoadCoord(25.67, 94.10),
        RoadCoord(25.15, 94.00),
        RoadCoord(24.81, 93.94),
      ],
    ),
    RoadStatusModel(
      roadId: 'RD-NH6-02',
      roadName: 'NH-6 Shillong - Jowai - Silchar Highway',
      corridor: 'Meghalaya - Barak Valley Strategic Link',
      status: RoadCondition.atRisk,
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 40)),
      reason: 'Excessive slope saturation and surface water sheeting reported along Sonapur tunnel approach.',
      zoneId: 'NER-MEG-001',
      suggestedAlternate: 'Via Umkiang - Badarpur bypass route',
      alternateDetails: 'Heavy transport vehicles halted at Ratacherra checkpost during night hours.',
      points: const [
        RoadCoord(25.57, 91.89),
        RoadCoord(25.44, 92.20),
        RoadCoord(25.10, 92.40),
        RoadCoord(24.82, 92.79),
      ],
    ),
    RoadStatusModel(
      roadId: 'RD-NH10-05',
      roadName: 'NH-10 Siliguri - Sevoke - Gangtok Arterial Link',
      corridor: 'Sikkim Main Arterial Route',
      status: RoadCondition.blocked,
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 15)),
      reason: 'Teesta river bank subsidence washed out 40m carriageway near 29th Mile.',
      zoneId: 'NER-SKM-014',
      suggestedAlternate: 'Via Gorubathan - Lava - Reshi - Rhenock route',
      alternateDetails: 'Open for light vehicles; heavy trucks restricted until embankment stabilization.',
      points: const [
        RoadCoord(26.72, 88.42),
        RoadCoord(26.89, 88.47),
        RoadCoord(27.15, 88.50),
        RoadCoord(27.33, 88.61),
      ],
    ),
    RoadStatusModel(
      roadId: 'RD-GS-04',
      roadName: 'GS Road (Guwahati - Shillong Expressway)',
      corridor: 'Assam - Meghalaya Inter-State Expressway',
      status: RoadCondition.open,
      lastUpdated: DateTime.now().subtract(const Duration(minutes: 10)),
      reason: 'Traffic flow smooth; slope protection barriers intact along Umling-Nongpoh bypass.',
      zoneId: 'NER-ASM-002',
      points: const [
        RoadCoord(26.14, 91.73),
        RoadCoord(25.90, 91.87),
        RoadCoord(25.57, 91.89),
      ],
    ),
  ];

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

    await cacheService.setJsonList(
      CacheService.keyCachedRoads,
      defaultRoads.map((r) => r.toJson()).toList(),
    );
    return defaultRoads;
  }
}
