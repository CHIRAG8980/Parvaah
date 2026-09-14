import '../../core/constants/api_constants.dart';
import '../../core/errors/app_exceptions.dart';
import '../../core/network/http_network_client.dart';
import '../../core/security/i_secure_storage.dart';
import '../models/auth_tokens_model.dart';
import '../models/user_profile_model.dart';
import '../services/api_client.dart';
import '../services/cache_service.dart';
import 'interfaces/i_auth_repository.dart';

class AuthRepository implements IAuthRepository {
  final ApiClient apiClient;
  final ISecureStorage secureStorage;
  final CacheService cacheService;

  static const String _tokenKey = HttpNetworkClient.tokenKey;

  AuthRepository({
    required this.apiClient,
    required this.secureStorage,
    required this.cacheService,
  });

  @override
  Future<AuthTokensModel> login({
    required String username,
    required String password,
  }) async {
    final response = await apiClient.post(
      ApiConstants.login,
      {
        'username': username,
        'password': password,
      },
    );

    if (!response.isSuccess || response.data == null) {
      throw UnauthorizedException(
        response.errorMessage ?? 'Invalid credentials or login failed',
      );
    }

    final tokens = AuthTokensModel.fromJson(response.data as Map<String, dynamic>);
    await secureStorage.write(_tokenKey, tokens.accessToken);
    await cacheService.setBool(CacheService.keyIsLoggedIn, true);
    await cacheService.setString(CacheService.keyUserName, tokens.fullName);
    await cacheService.setString(CacheService.keyUserEmail, tokens.username);
    await cacheService.setString(CacheService.keyUserRole, tokens.role);
    await cacheService.setString(CacheService.keyUserId, tokens.userId);
    if (tokens.district != null) {
      await cacheService.setString(CacheService.keyUserDistrict, tokens.district!);
    }

    final initialProfile = UserProfileModel(
      userId: tokens.userId,
      username: tokens.username,
      name: tokens.fullName,
      email: tokens.username,
      phone: '',
      role: tokens.role,
      district: tokens.district,
      escalationLevel: tokens.escalationLevel,
      selectedZoneId: cacheService.getString(CacheService.keySelectedZone),
    );
    await cacheService.setJsonObject(CacheService.keyUserProfileJson, initialProfile.toJson());

    return tokens;
  }

  @override
  Future<AuthTokensModel> register({
    required String username,
    required String password,
    required String fullName,
    String role = 'Officer',
    String district = 'East Khasi Hills',
    String? contactNumber,
  }) async {
    final response = await apiClient.post(
      ApiConstants.register,
      {
        'username': username,
        'password': password,
        'full_name': fullName,
        'role': role,
        'district': district,
        if (contactNumber != null && contactNumber.isNotEmpty)
          'contact_number': contactNumber,
      },
    );

    if (!response.isSuccess || response.data == null) {
      throw BadRequestException(
        response.errorMessage ?? 'Registration failed. Please check your details.',
      );
    }

    final tokens = AuthTokensModel.fromJson(response.data as Map<String, dynamic>);
    await secureStorage.write(_tokenKey, tokens.accessToken);
    await cacheService.setBool(CacheService.keyIsLoggedIn, true);
    await cacheService.setString(CacheService.keyUserName, tokens.fullName);
    await cacheService.setString(CacheService.keyUserEmail, tokens.username);
    await cacheService.setString(CacheService.keyUserRole, tokens.role);
    await cacheService.setString(CacheService.keyUserId, tokens.userId);
    if (tokens.district != null) {
      await cacheService.setString(CacheService.keyUserDistrict, tokens.district!);
    }
    if (contactNumber != null && contactNumber.isNotEmpty) {
      await cacheService.setString(CacheService.keyUserPhone, contactNumber);
    }

    final initialProfile = UserProfileModel(
      userId: tokens.userId,
      username: tokens.username,
      name: tokens.fullName,
      email: tokens.username,
      phone: contactNumber ?? '',
      role: tokens.role,
      district: tokens.district,
      escalationLevel: tokens.escalationLevel,
      selectedZoneId: cacheService.getString(CacheService.keySelectedZone),
    );
    await cacheService.setJsonObject(CacheService.keyUserProfileJson, initialProfile.toJson());

    return tokens;
  }

  @override
  Future<UserProfileModel> getCurrentUserProfile() async {
    try {
      final response = await apiClient.get(ApiConstants.currentUser);
      if (response.isSuccess && response.data is Map<String, dynamic>) {
        final user = UserProfileModel.fromJson(response.data as Map<String, dynamic>);
        await saveUserProfileLocally(user);
        return user;
      }
    } catch (_) {}

    final cachedJson = cacheService.getJsonObject(CacheService.keyUserProfileJson);
    if (cachedJson != null) {
      return UserProfileModel.fromJson(cachedJson);
    }

    final name = cacheService.getString(CacheService.keyUserName);
    final email = cacheService.getString(CacheService.keyUserEmail);
    final phone = cacheService.getString(CacheService.keyUserPhone);
    final role = cacheService.getString(CacheService.keyUserRole, defaultValue: 'Officer');
    final district = cacheService.getString(CacheService.keyUserDistrict);
    final userId = cacheService.getString(CacheService.keyUserId);

    return UserProfileModel(
      userId: userId,
      username: email,
      name: name.isNotEmpty ? name : 'Officer',
      email: email,
      phone: phone,
      role: role.isNotEmpty ? role : 'Officer',
      district: district.isNotEmpty ? district : null,
      selectedZoneId: cacheService.getString(CacheService.keySelectedZone),
    );
  }

  @override
  Future<void> saveUserProfileLocally(UserProfileModel user) async {
    await cacheService.setString(CacheService.keyUserName, user.name);
    if (user.email.isNotEmpty) {
      await cacheService.setString(CacheService.keyUserEmail, user.email);
    }
    if (user.phone.isNotEmpty) {
      await cacheService.setString(CacheService.keyUserPhone, user.phone);
    }
    if (user.role.isNotEmpty) {
      await cacheService.setString(CacheService.keyUserRole, user.role);
    }
    if (user.district != null && user.district!.isNotEmpty) {
      await cacheService.setString(CacheService.keyUserDistrict, user.district!);
    }
    if (user.userId.isNotEmpty) {
      await cacheService.setString(CacheService.keyUserId, user.userId);
    }
    await cacheService.setJsonObject(CacheService.keyUserProfileJson, user.toJson());
  }

  @override
  Future<String?> getSavedToken() async {
    return secureStorage.read(_tokenKey);
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await getSavedToken();
    final isLoggedIn = cacheService.getBool(CacheService.keyIsLoggedIn, defaultValue: false);
    return token != null && token.isNotEmpty && isLoggedIn;
  }

  @override
  Future<void> logout() async {
    await secureStorage.delete(_tokenKey);
    await cacheService.clearUserSession();
  }
}
