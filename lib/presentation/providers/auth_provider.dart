import 'package:flutter/material.dart';
import '../../core/errors/exception_translator.dart';
import '../../data/models/user_profile_model.dart';
import '../../data/repositories/interfaces/i_auth_repository.dart';
import 'view_state.dart';

class AuthProvider extends ChangeNotifier {
  final IAuthRepository _authRepository;

  bool _isLoggedIn = false;
  ViewState _viewState = ViewState.initial;
  String? _errorMessage;
  UserProfileModel _user = const UserProfileModel(
    name: '',
    email: '',
    phone: '',
    selectedZoneId: '',
  );

  AuthProvider(this._authRepository) {
    _checkInitialAuth();
  }

  bool get isLoggedIn => _isLoggedIn;
  ViewState get viewState => _viewState;
  String? get errorMessage => _errorMessage;
  UserProfileModel get user => _user;

  Future<void> _checkInitialAuth() async {
    _viewState = ViewState.loading;
    notifyListeners();

    try {
      final authenticated = await _authRepository.isAuthenticated();
      _isLoggedIn = authenticated;
      if (_isLoggedIn) {
        _user = await _authRepository.getCurrentUserProfile();
      }
      _viewState = ViewState.success;
    } catch (_) {
      _viewState = ViewState.initial;
    } finally {
      notifyListeners();
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    final cleanUsername = email.contains('@') ? email.split('@').first.trim() : email.trim();
    if (cleanUsername.isEmpty || password.isEmpty) {
      _errorMessage = 'Please enter both username/email and password';
      _viewState = ViewState.failure;
      notifyListeners();
      return false;
    }

    _viewState = ViewState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.login(
        username: cleanUsername,
        password: password,
      );

      _user = await _authRepository.getCurrentUserProfile();
      _isLoggedIn = true;
      _viewState = ViewState.success;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = ExceptionTranslator.toUserMessage(e);
      _viewState = ViewState.failure;
      notifyListeners();
      return false;
    }
  }

  Future<void> signInWithGoogle({String? name, String? email}) async {
    _viewState = ViewState.loading;
    notifyListeners();

    _isLoggedIn = true;
    _user = _user.copyWith(
      name: name ?? '',
      email: email ?? '',
    );
    _viewState = ViewState.success;
    notifyListeners();
  }

  Future<bool> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final cleanUsername = email.contains('@') ? email.split('@').first.trim() : email.trim();
    if (cleanUsername.isEmpty || password.isEmpty) {
      _errorMessage = 'Username/email and password cannot be empty';
      _viewState = ViewState.failure;
      notifyListeners();
      return false;
    }

    _viewState = ViewState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.register(
        username: cleanUsername,
        password: password,
        fullName: name.trim().isNotEmpty ? name.trim() : cleanUsername,
        contactNumber: phone.trim().isNotEmpty ? phone.trim() : null,
      );

      _user = await _authRepository.getCurrentUserProfile();
      _isLoggedIn = true;
      _viewState = ViewState.success;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = ExceptionTranslator.toUserMessage(e);
      _viewState = ViewState.failure;
      notifyListeners();
      return false;
    }
  }

  Future<void> updateProfile({required String name, required String phone}) async {
    _user = _user.copyWith(name: name, phone: phone);
    notifyListeners();
  }

  Future<void> updateAvatar(String? path) async {
    _user = _user.copyWith(avatarPath: path);
    notifyListeners();
  }

  Future<void> signOut() async {
    await _authRepository.logout();
    _isLoggedIn = false;
    _viewState = ViewState.initial;
    _user = const UserProfileModel(
      name: '',
      email: '',
      phone: '',
      selectedZoneId: '',
    );
    notifyListeners();
  }
}
