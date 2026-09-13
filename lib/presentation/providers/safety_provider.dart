import 'package:flutter/material.dart';
import '../../data/models/safety_article_model.dart';

class SafetyProvider extends ChangeNotifier {
  final List<SafetyArticleModel> _articles = [];
  String _selectedCategory = 'All';

  List<SafetyArticleModel> get articles {
    if (_selectedCategory == 'All') return _articles;
    return _articles.where((a) => a.category == _selectedCategory).toList();
  }

  String get selectedCategory => _selectedCategory;

  List<String> get categories => [
        'All',
        'Geological Hazard',
        'Meteorological Hazard',
        'Hydrological Hazard',
        'Seismic Hazard',
      ];

  void selectCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> loadArticles() async {
    // Static / cached safety articles reload hook
    notifyListeners();
  }

  SafetyArticleModel? getArticleById(String id) {
    try {
      return _articles.firstWhere((a) => a.id == id);
    } catch (_) {
      return null;
    }
  }
}
