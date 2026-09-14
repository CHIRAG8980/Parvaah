import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class SocialAuthButtons extends StatelessWidget {
  final VoidCallback onPhonePressed;

  const SocialAuthButtons({
    super.key,
    required this.onPhonePressed,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        OutlinedButton(
          onPressed: onPhonePressed,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(50),
            side: const BorderSide(color: AppColors.border),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.phone_rounded, color: AppColors.textPrimary, size: 18),
              SizedBox(width: 10),
              Text(
                'Continue with Phone',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
