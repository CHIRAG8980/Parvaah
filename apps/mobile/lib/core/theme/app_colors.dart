import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // --- Primary Brand Colors ---
  static const Color navy = Color(0xFF0C274A);
  static const Color deepBlue = Color(0xFF1769AA);
  static const Color blue = Color(0xFF1E88E5);
  static const Color cyan = Color(0xFF22B8E6);
  static const Color skyBlue = Color(0xFF64B5F6);
  static const Color lightBlueBg = Color(0xFFF0F6FD);
  static const Color emerald = Color(0xFF18A66A);

  // --- Surfaces & Neutrals ---
  static const Color background = Color(0xFFF6F8FB);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceElevated = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderSubtle = Color(0xFFEEF2F6);
  static const Color divider = Color(0xFFEDF2F7);

  // --- Typography Colors ---
  static const Color textPrimary = Color(0xFF0F243E);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textLight = Color(0xFFFFFFFF);

  // --- Semantic Risk Colors (Strictly separated from Brand) ---
  static const Color riskLow = Color(0xFF168A4A);
  static const Color riskMedium = Color(0xFFC58A00);
  static const Color riskElevated = Color(0xFFD96B00);
  static const Color riskHigh = Color(0xFFC62828);
  static const Color riskCritical = Color(0xFFB71C1C);

  // --- Soft Risk Pastel Backgrounds for Chips/Cards ---
  static const Color riskLowBg = Color(0xFFE8F5E9);
  static const Color riskMediumBg = Color(0xFFFFF8E1);
  static const Color riskElevatedBg = Color(0xFFFFF3E0);
  static const Color riskHighBg = Color(0xFFFFEBEE);

  // --- Metric Overview Tint Colors (Reference Screen 4) ---
  static const Color metricRedBg = Color(0xFFFDE8E8);
  static const Color metricAmberBg = Color(0xFFFEF3C7);
  static const Color metricGreenBg = Color(0xFFD1FAE5);

  // --- Gradients ---
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1769AA), Color(0xFF1E88E5)],
  );

  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFE8F2FA), Color(0xFFD5E6F6), Color(0xFFC2DCF2)],
  );

  static const LinearGradient alertBannerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFE53935), Color(0xFFC62828)],
  );
}
