import 'package:flutter/material.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../providers/settings_provider.dart';

class LanguagePickerDialog extends StatelessWidget {
  final SettingsProvider settings;

  const LanguagePickerDialog({super.key, required this.settings});

  static Future<void> show(BuildContext context, SettingsProvider settings) {
    return showDialog(
      context: context,
      builder: (_) => LanguagePickerDialog(settings: settings),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Select App Language'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: AppStrings.supportedLanguages.entries.map((entry) {
            final isSelected = entry.key == settings.currentLanguage;
            return ListTile(
              title: Text(entry.value),
              trailing: isSelected
                  ? const Icon(Icons.check_circle_rounded, color: AppColors.blue)
                  : null,
              onTap: () {
                settings.setLanguage(entry.key);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }
}
