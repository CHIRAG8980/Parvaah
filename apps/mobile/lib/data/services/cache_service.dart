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

  static const String keyUserRole = 'parvaah_user_role';
  static const String keyUserDistrict = 'parvaah_user_district';
  static const String keyUserId = 'parvaah_user_id';
  static const String keyUserProfileJson = 'parvaah_user_profile_json';

  Map<String, dynamic>? getJsonObject(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
    } catch (_) {}
    return null;
  }

  Future<bool> setJsonObject(String key, Map<String, dynamic> map) {
    return _prefs.setString(key, jsonEncode(map));
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

  Future<bool> remove(String key) {
    return _prefs.remove(key);
  }

  Future<void> clearUserSession() async {
    await _prefs.setBool(keyIsLoggedIn, false);
    await _prefs.remove(keyUserName);
    await _prefs.remove(keyUserEmail);
    await _prefs.remove(keyUserPhone);
    await _prefs.remove(keyUserRole);
    await _prefs.remove(keyUserDistrict);
    await _prefs.remove(keyUserId);
    await _prefs.remove(keyUserProfileJson);
  }
}
