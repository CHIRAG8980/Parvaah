import 'package:flutter/material.dart';
import '../../data/models/safety_article_model.dart';

class SafetyProvider extends ChangeNotifier {
  final List<SafetyArticleModel> _articles = [
    const SafetyArticleModel(
      id: 'guide-landslide-safety',
      title: 'Landslide Early Warning & Hill Safety',
      category: 'Geological Hazard',
      shortDescription:
          'Essential protocol for slope deformation, sudden spring discharges, and emergency hill evacuation.',
      iconCode: 'terrain',
      beforeGuidelines: [
        'Identify vulnerable slopes, retaining walls, and history of debris flow near your residence.',
        'Watch for tilting utility poles, leaning trees, or fresh cracks in masonry foundations.',
        'Keep emergency grab bags packed with vital documents, flashlights, medicines, and batteries.',
      ],
      duringGuidelines: [
        'If you hear rumbling sounds or sudden cracking, evacuate immediately away from the path of flow.',
        'Move uphill or to stable ridge ground perpendicular to the debris trajectory.',
        'Never cross swollen mountain streams or water channels where culverts are choked.',
      ],
      afterGuidelines: [
        'Stay clear of the slide zone as secondary landslides and mudslides often follow.',
        'Check for injured or trapped persons around the periphery without entering the slide footprint.',
        'Report broken gas, water, or electrical lines directly to the district control room (1077).',
      ],
    ),
    const SafetyArticleModel(
      id: 'guide-heavy-rainfall',
      title: 'Monsoon Torrential Rain & Inundation',
      category: 'Meteorological Hazard',
      shortDescription:
          'Actionable steps to safeguard family and property during extreme monsoon downpours across NER.',
      iconCode: 'thunderstorm',
      beforeGuidelines: [
        'Clear domestic roof gutters, drains, and road culverts of accumulated silt and foliage.',
        'Stock emergency potable drinking water and water-purification tablets for minimum 72 hours.',
        'Anchor loose outdoor fixtures, tin roofs, and satellite antennas against wind squalls.',
      ],
      duringGuidelines: [
        'Avoid driving through waterlogged hill road segments or across submerged bridges.',
        'Switch off the main electrical breaker if water begins entering the dwelling.',
        'Tune in to official IMD weather bulletins and Parvaah real-time zone telemetry alerts.',
      ],
      afterGuidelines: [
        'Boil all drinking water or use chlorine tablets to prevent waterborne contagion.',
        'Do not touch damp electrical equipment or fallen low-tension power cables.',
        'Document infrastructure damage with photos for municipal disaster relief verification.',
      ],
    ),
    const SafetyArticleModel(
      id: 'guide-flash-flood',
      title: 'Riverine Flash Floods & Dam Surges',
      category: 'Hydrological Hazard',
      shortDescription:
          'Rapid response guidelines for sudden river surges, cloudburst runoff, and valley flash flooding.',
      iconCode: 'water_drop',
      beforeGuidelines: [
        'Know the shortest elevated pedestrian evacuation routes to higher hill slopes.',
        'Never construct dwelling units inside the designated active flood plains or dry riverbeds.',
        'Keep cattle and livestock untied so they can seek natural higher terrain during surges.',
      ],
      duringGuidelines: [
        'Climb immediately to the highest accessible hill ridge upon first warning sounds.',
        'Do not attempt to walk or swim through rapidly moving flood waters exceeding knee height.',
        'Avoid bridges over swollen mountain torrents which can collapse due to abutment scouring.',
      ],
      afterGuidelines: [
        'Wait for official clearance from District Disaster Management before returning home.',
        'Beware of snakes, reptiles, and debris that may have entered homes during flooding.',
        'Disinfect domestic surroundings with lime or bleaching powder.',
      ],
    ),
  ];

  String _selectedCategory = 'All';

  List<SafetyArticleModel> get articles {
    if (_selectedCategory == 'All') return _articles;
    return _articles.where((article) => article.category == _selectedCategory).toList();
  }

  String get selectedCategory => _selectedCategory;

  List<String> get categories => const [
        'All',
        'Geological Hazard',
        'Meteorological Hazard',
        'Hydrological Hazard',
      ];

  void selectCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> loadArticles() async {
    notifyListeners();
  }

  SafetyArticleModel? getArticleById(String id) {
    try {
      return _articles.firstWhere((article) => article.id == id);
    } catch (_) {
      return null;
    }
  }
}
