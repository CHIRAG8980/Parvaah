class AuthTokensModel {
  final String accessToken;
  final String tokenType;
  final String userId;
  final String username;
  final String fullName;
  final String role;
  final String? district;
  final int escalationLevel;

  const AuthTokensModel({
    required this.accessToken,
    this.tokenType = 'bearer',
    required this.userId,
    required this.username,
    required this.fullName,
    required this.role,
    this.district,
    this.escalationLevel = 1,
  });

  factory AuthTokensModel.fromJson(Map<String, dynamic> json) {
    return AuthTokensModel(
      accessToken: json['access_token'] as String? ?? '',
      tokenType: json['token_type'] as String? ?? 'bearer',
      userId: json['user_id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      fullName: json['full_name'] as String? ?? '',
      role: json['role'] as String? ?? 'citizen',
      district: json['district'] as String?,
      escalationLevel: (json['escalation_level'] as num?)?.toInt() ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'access_token': accessToken,
        'token_type': tokenType,
        'user_id': userId,
        'username': username,
        'full_name': fullName,
        'role': role,
        'district': district,
        'escalation_level': escalationLevel,
      };
}
