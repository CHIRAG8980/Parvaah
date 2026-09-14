import '../../models/auth_tokens_model.dart';
import '../../models/user_profile_model.dart';

abstract class IAuthRepository {
  Future<AuthTokensModel> login({
    required String username,
    required String password,
  });

  Future<AuthTokensModel> register({
    required String username,
    required String password,
    required String fullName,
    String role = 'Officer',
    String district = 'East Khasi Hills',
    String? contactNumber,
  });

  Future<UserProfileModel> getCurrentUserProfile();

  Future<String?> getSavedToken();

  Future<bool> isAuthenticated();

  Future<void> saveUserProfileLocally(UserProfileModel user);

  Future<void> logout();
}
