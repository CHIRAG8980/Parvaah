import '../../models/road_status_model.dart';

abstract class IRoadRepository {
  Future<List<RoadStatusModel>> getRoads({
    String? district,
    String? zoneId,
    bool forceRefresh = false,
  });

  Future<RoadStatusModel?> getRoadById(String roadId);
}
