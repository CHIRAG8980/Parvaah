class SafetyArticleModel {
  final String id;
  final String title;
  final String category;
  final String tag;
  final String shortDescription;
  final String iconCode;
  final String assetImage;
  final List<String> beforeGuidelines;
  final List<String> duringGuidelines;
  final List<String> afterGuidelines;

  const SafetyArticleModel({
    required this.id,
    required this.title,
    required this.category,
    required this.tag,
    required this.shortDescription,
    required this.iconCode,
    required this.assetImage,
    required this.beforeGuidelines,
    required this.duringGuidelines,
    required this.afterGuidelines,
  });
}
