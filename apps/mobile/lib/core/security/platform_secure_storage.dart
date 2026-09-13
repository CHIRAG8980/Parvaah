import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'i_secure_storage.dart';

class PlatformSecureStorage implements ISecureStorage {
  final FlutterSecureStorage secureStorage;
  final SharedPreferences fallbackPrefs;

  PlatformSecureStorage({
    FlutterSecureStorage? secureStorage,
    required this.fallbackPrefs,
  }) : secureStorage = secureStorage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  static const String _fallbackPrefix = 'secure_fallback_';

  @override
  Future<String?> read(String key) async {
    try {
      final value = await secureStorage.read(key: key);
      if (value != null) return value;
    } catch (_) {}

    return fallbackPrefs.getString('$_fallbackPrefix$key');
  }

  @override
  Future<void> write(String key, String value) async {
    try {
      await secureStorage.write(key: key, value: value);
      await fallbackPrefs.setString('$_fallbackPrefix$key', value);
    } catch (_) {
      await fallbackPrefs.setString('$_fallbackPrefix$key', value);
    }
  }

  @override
  Future<void> delete(String key) async {
    try {
      await secureStorage.delete(key: key);
    } catch (_) {}
    await fallbackPrefs.remove('$_fallbackPrefix$key');
  }

  @override
  Future<void> deleteAll() async {
    try {
      await secureStorage.deleteAll();
    } catch (_) {}
    final keys = fallbackPrefs.getKeys().where((k) => k.startsWith(_fallbackPrefix));
    for (final key in keys) {
      await fallbackPrefs.remove(key);
    }
  }
}
