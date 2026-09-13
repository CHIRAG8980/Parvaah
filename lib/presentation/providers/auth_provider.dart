import 'package:flutter/material.dart';
import '../../data/models/user_profile_model.dart';
import '../../data/services/cache_service.dart';

class AuthProvider extends ChangeNotifier {
  final CacheService _cacheService;

  bool _isLoggedIn = true;
  UserProfileModel _user = UserProfileModel.defaultUser();

  AuthProvider(this._cacheService) {
    _loadState();
  }

  bool get isLoggedIn => _isLoggedIn;
  UserProfileModel get user => _user;

  void _loadState() {
    _isLoggedIn = _cacheService.getBool(CacheService.keyIsLoggedIn, defaultValue: true);
    final name = _cacheService.getString(CacheService.keyUserName, defaultValue: 'Dr. Ananya Sharma');
    final email = _cacheService.getString(CacheService.keyUserEmail, defaultValue: 'ananya.sharma@parvaah.org');
    final phone = _cacheService.getString(CacheService.keyUserPhone, defaultValue: '+91 98765 43210');
    _user = _user.copyWith(name: name, email: email, phone: phone);
    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    _isLoggedIn = true;
    _user = _user.copyWith(email: email);
    await _cacheService.setBool(CacheService.keyIsLoggedIn, true);
    await _cacheService.setString(CacheService.keyUserEmail, email);
    notifyListeners();
  }

  Future<void> signInWithPhone(String phone) async {
    _isLoggedIn = true;
    _user = _user.copyWith(phone: phone);
    await _cacheService.setBool(CacheService.keyIsLoggedIn, true);
    await _cacheService.setString(CacheService.keyUserPhone, phone);
    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    _isLoggedIn = true;
    _user = _user.copyWith(name: 'Ananya Sharma', email: 'ananya.sharma@gmail.com');
    await _cacheService.setBool(CacheService.keyIsLoggedIn, true);
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    _isLoggedIn = true;
    _user = _user.copyWith(name: name, email: email, phone: phone);
    await _cacheService.setBool(CacheService.keyIsLoggedIn, true);
    await _cacheService.setString(CacheService.keyUserName, name);
    await _cacheService.setString(CacheService.keyUserEmail, email);
    await _cacheService.setString(CacheService.keyUserPhone, phone);
    notifyListeners();
  }

  Future<void> updateProfile({required String name, required String phone}) async {
    _user = _user.copyWith(name: name, phone: phone);
    await _cacheService.setString(CacheService.keyUserName, name);
    await _cacheService.setString(CacheService.keyUserPhone, phone);
    notifyListeners();
  }

  Future<void> signOut() async {
    _isLoggedIn = false;
    await _cacheService.setBool(CacheService.keyIsLoggedIn, false);
    notifyListeners();
  }
}
