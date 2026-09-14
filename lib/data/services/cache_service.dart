import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  final SharedPreferences _prefs;

  CacheService(this._prefs);

  static const String keyCachedRisks = 'parvaah_cached_risks';
  static const String keyCachedRoads = 'parvaah_cached_roads';
  static const String keyCachedAlerts = 'parvaah_cached_alerts';
  static const String keyLastSyncTime = 'parvaah_last_sync_time';
  static const String keySelectedLanguage = 'parvaah_selected_language';
  static const String keySelectedZone = 'parvaah_selected_zone';
  static const String keyIsLoggedIn = 'parvaah_is_logged_in';
  static const String keyUserName = 'parvaah_user_name';
  static const String keyUserEmail = 'parvaah_user_email';
  static const String keyUserPhone = 'parvaah_user_phone';
  static const String keyUserAvatar = 'parvaah_user_avatar';

  String? getAvatarPath() {
    final val = _prefs.getString(keyUserAvatar);
    return (val != null && val.isNotEmpty) ? val : null;
  }

  Future<bool> setAvatarPath(String? path) {
    if (path == null || path.isEmpty) {
      return _prefs.remove(keyUserAvatar);
    }
    return _prefs.setString(keyUserAvatar, path);
  }

  List<Map<String, dynamic>>? getJsonList(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (_) {}
    return null;
  }

  Future<bool> setJsonList(String key, List<Map<String, dynamic>> list) {
    return _prefs.setString(key, jsonEncode(list));
  }

  DateTime? getLastSyncTime() {
    final str = _prefs.getString(keyLastSyncTime);
    return str != null ? DateTime.tryParse(str) : null;
  }

  Future<bool> setLastSyncTime(DateTime time) {
    return _prefs.setString(keyLastSyncTime, time.toIso8601String());
  }

  String getString(String key, {String defaultValue = ''}) {
    return _prefs.getString(key) ?? defaultValue;
  }

  Future<bool> setString(String key, String value) {
    return _prefs.setString(key, value);
  }

  bool getBool(String key, {bool defaultValue = false}) {
    return _prefs.getBool(key) ?? defaultValue;
  }

  Future<bool> setBool(String key, bool value) {
    return _prefs.setBool(key, value);
  }
}
