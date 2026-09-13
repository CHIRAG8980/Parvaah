import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_colors.dart';
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
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('My Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          children: [
            _buildUserHeader(user),
            const SizedBox(height: 20),
            _buildSection(
              title: 'ACCOUNT',
              children: [
                _buildTile(
                  icon: Icons.person_outline_rounded,
                  title: 'Personal Information',
                  onTap: () => EditProfileDialog.show(context, auth),
                ),
                const Divider(height: 1, color: AppColors.divider),
                _buildTile(
                  icon: Icons.phone_in_talk_rounded,
                  title: 'Emergency Contacts',
                  subtitle: 'SDMA (1077), National (112)',
                  onTap: () => _callHelpline('1077'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildSection(
              title: 'PREFERENCES',
              children: [
                SwitchListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  secondary: const Icon(Icons.notifications_outlined, color: AppColors.deepBlue),
                  title: const Text('Safety Notifications',
                      style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600)),
                  value: settings.notificationsEnabled,
                  activeThumbColor: AppColors.blue,
                  onChanged: (val) => settings.toggleNotifications(val),
                ),
                const Divider(height: 1, color: AppColors.divider),
                _buildTile(
                  icon: Icons.translate_rounded,
                  title: 'Language',
                  subtitle: AppStrings.supportedLanguages[settings.currentLanguage] ?? 'English',
                  onTap: () => LanguagePickerDialog.show(context, settings),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildSection(
              title: 'EMERGENCY ACTIONS',
              children: [
                _buildTile(
                  icon: Icons.emergency_rounded,
                  iconColor: const Color(0xFFEF4444),
                  title: 'Disaster Helpline (1077)',
                  subtitle: 'NER State Disaster Management',
                  onTap: () => _callHelpline('1077'),
                ),
                const Divider(height: 1, color: AppColors.divider),
                _buildTile(
                  icon: Icons.local_hospital_outlined,
                  iconColor: AppColors.emerald,
                  title: 'National Emergency (112)',
                  subtitle: 'Unified police, fire, and medical',
                  onTap: () => _callHelpline('112'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () => _confirmSignOut(context, auth),
                icon: const Icon(Icons.logout_rounded, size: 18, color: Color(0xFFEF4444)),
                label: const Text('Sign Out',
                    style: TextStyle(
                        fontSize: 14.5, fontWeight: FontWeight.w600, color: Color(0xFFEF4444))),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFEF4444), width: 1.2),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildUserHeader(dynamic user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.blue,
            child: Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'O',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name.isNotEmpty ? user.name : 'Officer Profile',
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 3),
                Text(
                  user.email.isNotEmpty ? user.email : 'Jurisdiction: ${user.district ?? "NER"}',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                if (user.role.isNotEmpty)
                  Text(
                    'Role: ${user.role.toUpperCase()}',
                    style: const TextStyle(
                        fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.deepBlue),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title,
              style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                  letterSpacing: 0.6)),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.borderSubtle),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildTile({
    required IconData icon,
    Color? iconColor,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: iconColor ?? AppColors.deepBlue, size: 22),
      title: Text(title,
          style: const TextStyle(
              fontSize: 14.5, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      subtitle: subtitle != null
          ? Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary))
          : null,
      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.textMuted),
    );
  }

  static void _callHelpline(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  void _confirmSignOut(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out of Parvaah?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () async {
              await auth.signOut();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginRegisterScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
