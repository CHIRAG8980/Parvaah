import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_strings.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import '../../widgets/profile/edit_profile_dialog.dart';
import '../../widgets/profile/language_picker_dialog.dart';
import '../auth/login_register_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Top Scenic Background Banner
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 160,
            child: ShaderMask(
              shaderCallback: (rect) => const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.black, Colors.black, Colors.transparent],
                stops: [0.0, 0.65, 1.0],
              ).createShader(rect),
              blendMode: BlendMode.dstIn,
              child: Image.asset(
                'assets/images/safety_header_bg.jpg',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: const Color(0xFFE2E8F0),
                ),
              ),
            ),
          ),

          // Main Scrollable Content
          SafeArea(
            bottom: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Row: Title + Settings Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'My Profile',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F243E),
                              letterSpacing: -0.4,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Stay prepared. Stay safer.',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      // Circular Settings Gear Button
                      GestureDetector(
                        onTap: () => _showSettingsModal(context, settings),
                        behavior: HitTestBehavior.opaque,
                        child: Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F172A).withAlpha(10),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.settings_outlined,
                            size: 21,
                            color: Color(0xFF0F243E),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Main Profile Card with Custom Avatar
                  _buildProfileCard(context, auth, user),

                  const SizedBox(height: 22),

                  // Account Section
                  _buildSectionHeader('Account'),
                  _buildCardGroup(
                    children: [
                      _buildMenuItem(
                        icon: Icons.person_outline_rounded,
                        iconBg: const Color(0xFFE0F2FE),
                        iconColor: const Color(0xFF0284C7),
                        title: 'Personal Information',
                        onTap: () => EditProfileDialog.show(context, auth),
                      ),
                      const Divider(height: 1, color: Color(0xFFF1F5F9), indent: 56),
                      _buildMenuItem(
                        icon: Icons.phone_outlined,
                        iconBg: const Color(0xFFDCFCE7),
                        iconColor: const Color(0xFF16A34A),
                        title: 'Emergency Contacts',
                        onTap: () => _showEmergencyContactsSheet(context),
                      ),
                    ],
                  ),

                  const SizedBox(height: 22),

                  // Preferences Section
                  _buildSectionHeader('Preferences'),
                  _buildCardGroup(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE0F2FE),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.notifications_outlined,
                                color: Color(0xFF0284C7),
                                size: 21,
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Expanded(
                              child: Text(
                                'Safety Notifications',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF0F243E),
                                ),
                              ),
                            ),
                            Switch.adaptive(
                              value: settings.notificationsEnabled,
                              activeThumbColor: const Color(0xFF1E88E5),
                              activeTrackColor: const Color(0xFF93C5FD),
                              onChanged: (val) => settings.toggleNotifications(val),
                            ),
                          ],
                        ),
                      ),
                      const Divider(height: 1, color: Color(0xFFF1F5F9), indent: 56),
                      _buildMenuItem(
                        icon: Icons.translate_rounded,
                        iconBg: const Color(0xFFEDE9FE),
                        iconColor: const Color(0xFF7C3AED),
                        title: 'Language',
                        trailingText: AppStrings.supportedLanguages[settings.currentLanguage] ?? 'English',
                        onTap: () => LanguagePickerDialog.show(context, settings),
                      ),
                    ],
                  ),

                  const SizedBox(height: 22),

                  // Emergency Actions Section
                  _buildSectionHeader('Emergency Actions'),
                  Row(
                    children: [
                      // Disaster Helpline Card
                      Expanded(
                        child: _buildEmergencyActionCard(
                          title: 'Disaster Helpline',
                          number: '1077',
                          backgroundColor: const Color(0xFFFEF2F2),
                          borderColor: const Color(0xFFFECDD3),
                          iconColor: const Color(0xFFDC2626),
                          numberColor: const Color(0xFFDC2626),
                          iconBg: const Color(0xFFFEE2E2),
                          icon: Icons.phone_in_talk_rounded,
                          onTap: () => _callHelpline('1077'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // National Emergency Card
                      Expanded(
                        child: _buildEmergencyActionCard(
                          title: 'National Emergency',
                          number: '112',
                          backgroundColor: const Color(0xFFF0FDF4),
                          borderColor: const Color(0xFFBBF7D0),
                          iconColor: const Color(0xFF16A34A),
                          numberColor: const Color(0xFF16A34A),
                          iconBg: const Color(0xFFDCFCE7),
                          icon: Icons.add_box_rounded,
                          onTap: () => _callHelpline('112'),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Sign Out Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton.icon(
                      onPressed: () => _confirmSignOut(context, auth),
                      icon: const Icon(Icons.logout_rounded, size: 18, color: Color(0xFFEF4444)),
                      label: const Text(
                        'Sign Out',
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFEF4444),
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: const Color(0xFFFEF2F2),
                        side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileCard(BuildContext context, AuthProvider auth, dynamic user) {
    final hasCustomPhoto = user.avatarPath != null &&
        (user.avatarPath as String).isNotEmpty &&
        File(user.avatarPath as String).existsSync();

    final displayName = (user.name is String && (user.name as String).isNotEmpty)
        ? user.name as String
        : 'Officer Profile';
    final districtName = (user.district is String && (user.district as String).isNotEmpty)
        ? user.district as String
        : 'NER';
    final roleName = (user.role is String && (user.role as String).isNotEmpty)
        ? (user.role as String)
        : 'Citizen';

    final initialLetter = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'O';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withAlpha(10),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar with Camera Tap & Badge
          GestureDetector(
            onTap: () => _showPhotoPickerSheet(context, auth),
            behavior: HitTestBehavior.opaque,
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 34,
                  backgroundColor: const Color(0xFF1E88E5),
                  child: hasCustomPhoto
                      ? ClipOval(
                          child: Image.file(
                            File(user.avatarPath as String),
                            width: 68,
                            height: 68,
                            fit: BoxFit.cover,
                          ),
                        )
                      : Text(
                          initialLetter,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F172A).withAlpha(20),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.camera_alt_rounded,
                        size: 11,
                        color: Color(0xFF1E88E5),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 16),

          // User info
          Expanded(
            child: GestureDetector(
              onTap: () => EditProfileDialog.show(context, auth),
              behavior: HitTestBehavior.opaque,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F243E),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 3),
                      Text(
                        districtName,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _capitalize(roleName),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Chevron
          GestureDetector(
            onTap: () => EditProfileDialog.show(context, auth),
            behavior: HitTestBehavior.opaque,
            child: const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF64748B),
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Color(0xFF64748B),
        ),
      ),
    );
  }

  Widget _buildCardGroup({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withAlpha(8),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    String? trailingText,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Icon(icon, color: iconColor, size: 21),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F243E),
                ),
              ),
            ),
            if (trailingText != null) ...[
              Text(
                trailingText,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(width: 4),
            ],
            const Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmergencyActionCard({
    required String title,
    required String number,
    required Color backgroundColor,
    required Color borderColor,
    required Color iconColor,
    required Color numberColor,
    required Color iconBg,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withAlpha(6),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Icon(icon, color: iconColor, size: 22),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: iconColor.withAlpha(220),
                          ),
                        ),
                      ),
                      Icon(Icons.chevron_right_rounded, size: 14, color: iconColor),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    number,
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      color: numberColor,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPhotoPickerSheet(BuildContext context, AuthProvider auth) {
    final picker = ImagePicker();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Profile Photo',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F243E),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Upload a custom photo from your device or camera',
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 18),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.photo_library_rounded, color: Color(0xFF0284C7)),
              ),
              title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () async {
                Navigator.pop(ctx);
                final picked = await picker.pickImage(
                  source: ImageSource.gallery,
                  maxWidth: 800,
                  maxHeight: 800,
                  imageQuality: 85,
                );
                if (picked != null) {
                  await auth.updateAvatar(picked.path);
                }
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.camera_alt_rounded, color: Color(0xFF16A34A)),
              ),
              title: const Text('Take a Photo', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () async {
                Navigator.pop(ctx);
                final picked = await picker.pickImage(
                  source: ImageSource.camera,
                  maxWidth: 800,
                  maxHeight: 800,
                  imageQuality: 85,
                );
                if (picked != null) {
                  await auth.updateAvatar(picked.path);
                }
              },
            ),
            if (auth.user.avatarPath != null) ...[
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.delete_outline_rounded, color: Color(0xFFDC2626)),
                ),
                title: const Text('Remove Photo', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFFDC2626))),
                onTap: () async {
                  Navigator.pop(ctx);
                  await auth.updateAvatar(null);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showSettingsModal(BuildContext context, SettingsProvider settings) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'App Settings',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F243E),
              ),
            ),
            const SizedBox(height: 14),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Vibration Alerts', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
              subtitle: const Text('Haptic pulse for High/Critical hazard alerts', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              value: true,
              activeThumbColor: const Color(0xFF1E88E5),
              onChanged: (_) {},
            ),
            const Divider(height: 1),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Offline GIS Caching', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
              subtitle: const Text('Preload risk telemetry for remote hill zones', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              value: true,
              activeThumbColor: const Color(0xFF1E88E5),
              onChanged: (_) {},
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E88E5),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                child: const Text('Done', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEmergencyContactsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Emergency Contacts',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F243E),
              ),
            ),
            const SizedBox(height: 14),
            _buildContactTile(
              name: 'State Disaster Management (SDMA)',
              number: '1077',
              icon: Icons.shield_rounded,
              color: const Color(0xFFDC2626),
              onCall: () => _callHelpline('1077'),
            ),
            const SizedBox(height: 10),
            _buildContactTile(
              name: 'National Emergency Helpline',
              number: '112',
              icon: Icons.emergency_rounded,
              color: const Color(0xFF16A34A),
              onCall: () => _callHelpline('112'),
            ),
            const SizedBox(height: 10),
            _buildContactTile(
              name: 'NDRF Control Room',
              number: '011-24363260',
              icon: Icons.group_rounded,
              color: const Color(0xFF0284C7),
              onCall: () => _callHelpline('01124363260'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactTile({
    required String name,
    required String number,
    required IconData icon,
    required Color color,
    required VoidCallback onCall,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: color.withAlpha(26),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Color(0xFF0F243E)),
                ),
                Text(
                  number,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onCall,
            icon: const Icon(Icons.phone_rounded, color: Color(0xFF1E88E5)),
          ),
        ],
      ),
    );
  }

  static void _callHelpline(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  static String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }

  void _confirmSignOut(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w800)),
        content: const Text('Are you sure you want to sign out of Parvaah?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () async {
              await auth.signOut();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginRegisterScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Sign Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
