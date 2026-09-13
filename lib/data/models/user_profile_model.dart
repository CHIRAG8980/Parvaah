class UserProfileModel {
  final String name;
  final String email;
  final String phone;
  final String selectedZoneId;
  final String selectedLanguage;
  final bool notificationsEnabled;
  final List<String> emergencyContacts;

  const UserProfileModel({
    required this.name,
    required this.email,
    required this.phone,
    required this.selectedZoneId,
    this.selectedLanguage = 'en',
    this.notificationsEnabled = true,
    this.emergencyContacts = const ['1077', '112'],
  });

  UserProfileModel copyWith({
    String? name,
    String? email,
    String? phone,
    String? selectedZoneId,
    String? selectedLanguage,
    bool? notificationsEnabled,
    List<String>? emergencyContacts,
  }) {
    return UserProfileModel(
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      selectedZoneId: selectedZoneId ?? this.selectedZoneId,
      selectedLanguage: selectedLanguage ?? this.selectedLanguage,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
    );
  }

  factory UserProfileModel.defaultUser() {
    return const UserProfileModel(
      name: 'Dr. Ananya Sharma',
      email: 'ananya.sharma@parvaah.org',
      phone: '+91 98765 43210',
      selectedZoneId: 'NER-MEG-001',
      selectedLanguage: 'en',
      notificationsEnabled: true,
      emergencyContacts: ['1077', '112'],
    );
  }
}
