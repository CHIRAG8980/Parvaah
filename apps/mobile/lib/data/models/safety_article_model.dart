class SafetyArticleModel {
  final String id;
  final String title;
  final String category;
  final String shortDescription;
  final String iconCode;
  final List<String> beforeGuidelines;
  final List<String> duringGuidelines;
  final List<String> afterGuidelines;

  const SafetyArticleModel({
    required this.id,
    required this.title,
    required this.category,
    required this.shortDescription,
    required this.iconCode,
    required this.beforeGuidelines,
    required this.duringGuidelines,
    required this.afterGuidelines,
  });

  static const List<SafetyArticleModel> defaultArticles = [
    SafetyArticleModel(
      id: 'safety_landslide',
      title: 'Landslide Safety',
      category: 'Geological Hazard',
      shortDescription:
          'Know what to do before, during, and after a landslide in steep terrain.',
      iconCode: 'terrain',
      beforeGuidelines: [
        'Monitor local weather and geotechnical warning alerts on Parvaah.',
        'Inspect retaining walls and surface drainage channels around your dwelling.',
        'Prepare a go-bag with vital medications, flashlight, documents, and emergency radio.',
        'Familiarize yourself with designated community safe evacuation zones.',
      ],
      duringGuidelines: [
        'Move quickly to higher, stable ground perpendicular to the slide path.',
        'Stay clear of steep embankments, road cuttings, and deep river channels.',
        'If caught indoors, curl into a tight ball under sturdy furniture and protect your head.',
        'Listen for unusual rumbling or trees cracking, indicating imminent ground movement.',
      ],
      afterGuidelines: [
        'Stay away from the slide area; secondary collapses are extremely common.',
        'Check for injured or trapped persons without entering the active hazard zone.',
        'Report broken power lines, gas leaks, and ruptured water mains immediately to 1077.',
        'Follow official BRO updates before attempting to travel on mountain highways.',
      ],
    ),
    SafetyArticleModel(
      id: 'safety_rainfall',
      title: 'Heavy Rainfall Safety',
      category: 'Meteorological Hazard',
      shortDescription:
          'Guidance during intense monsoon downpours and slope oversaturation.',
      iconCode: 'water_drop',
      beforeGuidelines: [
        'Clear rooftop gutters and drainage ditches to prevent localized ponding.',
        'Keep emergency numbers and local disaster management helpline (1077) accessible.',
        'Avoid parking vehicles near loose slopes, culverts, or under old trees.',
      ],
      duringGuidelines: [
        'Avoid non-essential travel across hill passes during active downpours.',
        'Never attempt to drive or walk through fast-flowing road sheeting or overflow.',
        'Disconnect sensitive electrical appliances if water ingress begins.',
      ],
      afterGuidelines: [
        'Inspect foundations for new cracks or settling after heavy rains cease.',
        'Boil all drinking water until municipal supplies are confirmed uncontaminated.',
      ],
    ),
    SafetyArticleModel(
      id: 'safety_flood',
      title: 'Flash Flood Preparedness',
      category: 'Hydrological Hazard',
      shortDescription:
          'Rapid response actions for sudden river surges and valley flooding.',
      iconCode: 'waves',
      beforeGuidelines: [
        'Identify high ground locations in your village or town.',
        'Store important documents in watertight plastic sleeves.',
      ],
      duringGuidelines: [
        'Evacuate immediately upon hearing siren warnings or emergency alerts.',
        'Do not cross bridges over swollen, churning mountain torrents.',
      ],
      afterGuidelines: [
        'Return home only when local authorities officially declare it safe.',
        'Watch for snakes and other animals that may have sought shelter indoors.',
      ],
    ),
    SafetyArticleModel(
      id: 'safety_earthquake',
      title: 'Earthquake Safety',
      category: 'Seismic Hazard',
      shortDescription:
          'Essential Drop, Cover, and Hold On techniques in Zone V regions.',
      iconCode: 'vibration',
      beforeGuidelines: [
        'Secure heavy shelves, water heaters, and hanging mirrors to wall studs.',
        'Establish an emergency family meeting place outside building fall zones.',
      ],
      duringGuidelines: [
        'DROP to hands and knees, COVER your head and neck, HOLD ON to sturdy furniture.',
        'Stay indoors until shaking stops completely; do not run outside during tremors.',
      ],
      afterGuidelines: [
        'Check yourself and family for injuries; apply first aid.',
        'Expect aftershocks and be prepared to take cover again.',
      ],
    ),
  ];
}
