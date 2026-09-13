import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class ParvaahLogo extends StatelessWidget {
  final double size;
  final bool showShadow;
  final double borderRadius;

  const ParvaahLogo({
    super.key,
    this.size = 64.0,
    this.showShadow = true,
    this.borderRadius = 18.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: showShadow
            ? [
                BoxShadow(
                  color: AppColors.navy.withAlpha(40),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Image.asset(
          'assets/images/logo.png',
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            // High-fidelity vector fallback if asset is loading
            return Container(
              color: AppColors.navy,
              child: Center(
                child: Icon(
                  Icons.shield_outlined,
                  color: AppColors.cyan,
                  size: size * 0.55,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
