class UserProfileModel {
  final String userId;
  final String username;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String? district;
  final int escalationLevel;
  final String selectedZoneId;
  final String selectedLanguage;
  final bool notificationsEnabled;
  final List<String> emergencyContacts;
  final String? avatarPath;

  const UserProfileModel({
    this.userId = '',
    this.username = '',
    required this.name,
    required this.email,
    required this.phone,
    this.role = 'citizen',
    this.district,
    this.escalationLevel = 1,
    required this.selectedZoneId,
    this.selectedLanguage = 'en',
    this.notificationsEnabled = true,
    this.emergencyContacts = const ['1077', '112'],
    this.avatarPath,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      userId: json['user_id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      name: json['full_name'] as String? ?? json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['contact_number'] as String? ?? json['phone'] as String? ?? '',
      role: json['role'] as String? ?? 'citizen',
      district: json['district'] as String?,
      escalationLevel: (json['escalation_level'] as num?)?.toInt() ?? 1,
      selectedZoneId: json['selected_zone_id'] as String? ?? '',
      selectedLanguage: json['selected_language'] as String? ?? 'en',
      notificationsEnabled: json['notifications_enabled'] as bool? ?? true,
      emergencyContacts: (json['emergency_contacts'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const ['1077', '112'],
      avatarPath: json['avatar_path'] as String? ?? json['avatarPath'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'username': username,
        'name': name,
        'email': email,
        'phone': phone,
        'role': role,
        'district': district,
        'escalation_level': escalationLevel,
        'selected_zone_id': selectedZoneId,
        'selected_language': selectedLanguage,
        'notifications_enabled': notificationsEnabled,
        'emergency_contacts': emergencyContacts,
        'avatar_path': avatarPath,
      };

  UserProfileModel copyWith({
    String? userId,
    String? username,
    String? name,
    String? email,
    String? phone,
    String? role,
    String? district,
    int? escalationLevel,
    String? selectedZoneId,
    String? selectedLanguage,
    bool? notificationsEnabled,
    List<String>? emergencyContacts,
    String? avatarPath,
  }) {
    return UserProfileModel(
      userId: userId ?? this.userId,
      username: username ?? this.username,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      district: district ?? this.district,
      escalationLevel: escalationLevel ?? this.escalationLevel,
      selectedZoneId: selectedZoneId ?? this.selectedZoneId,
      selectedLanguage: selectedLanguage ?? this.selectedLanguage,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      avatarPath: avatarPath ?? this.avatarPath,
    );
  }
}
