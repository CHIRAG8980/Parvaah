import 'package:flutter/material.dart';
import '../../data/services/cache_service.dart';

class SettingsProvider extends ChangeNotifier {
  final CacheService _cacheService;

  String _currentLanguage = 'en';
  bool _notificationsEnabled = true;

  SettingsProvider(this._cacheService) {
    _loadSettings();
  }

  String get currentLanguage => _currentLanguage;
  bool get notificationsEnabled => _notificationsEnabled;

  void _loadSettings() {
    _currentLanguage = _cacheService.getString(
      CacheService.keySelectedLanguage,
      defaultValue: 'en',
    );
    notifyListeners();
  }

  Future<void> setLanguage(String langCode) async {
    _currentLanguage = langCode;
    await _cacheService.setString(CacheService.keySelectedLanguage, langCode);
    notifyListeners();
  }

  void toggleNotifications(bool enabled) {
    _notificationsEnabled = enabled;
    notifyListeners();
  }
}
