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

  }
