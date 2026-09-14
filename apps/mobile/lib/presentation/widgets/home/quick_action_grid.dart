import 'package:flutter/material.dart';

/// Clean, modern horizontal action dock for quick navigation shortcuts.
class QuickActionGrid extends StatelessWidget {
  final VoidCallback onMapTap;
  final VoidCallback onWeatherTap;
  final VoidCallback onRoadStatusTap;
  final VoidCallback onAlertsTap;

  const QuickActionGrid({
    super.key,
    required this.onMapTap,
    required this.onWeatherTap,
    required this.onRoadStatusTap,
    required this.onAlertsTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // 1. Risk Map Card (Mint / Emerald)
        Expanded(
          child: _QuickActionCard(
            label: 'Risk Map',
            icon: Icons.map_rounded,
            iconColor: const Color(0xFF059669),
            bgGradient: const [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
            borderColor: const Color(0xFFA7F3D0),
            onTap: onMapTap,
          ),
        ),
        const SizedBox(width: 8),

        // 2. Weather Card (Sky Blue)
        Expanded(
          child: _QuickActionCard(
            label: 'Weather',
            icon: Icons.wb_sunny_rounded,
            secondaryIcon: Icons.cloud_rounded,
            iconColor: const Color(0xFF0284C7),
            bgGradient: const [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
            borderColor: const Color(0xFFBAE6FD),
            onTap: onWeatherTap,
          ),
        ),
        const SizedBox(width: 8),

        // 3. Road Status Card (Warm Amber)
        Expanded(
          child: _QuickActionCard(
            label: 'Road Status',
            icon: Icons.alt_route_rounded,
            iconColor: const Color(0xFFD97706),
            bgGradient: const [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
            borderColor: const Color(0xFFFDE68A),
            onTap: onRoadStatusTap,
          ),
        ),
        const SizedBox(width: 8),

        // 4. Alerts Card (Coral Rose / Red)
        Expanded(
          child: _QuickActionCard(
            label: 'Alerts',
            icon: Icons.notifications_active_rounded,
            iconColor: const Color(0xFFE11D48),
            bgGradient: const [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
            borderColor: const Color(0xFFFECDD3),
            onTap: onAlertsTap,
          ),
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final IconData? secondaryIcon;
  final Color iconColor;
  final List<Color> bgGradient;
  final Color borderColor;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.label,
    required this.icon,
    this.secondaryIcon,
    required this.iconColor,
    required this.bgGradient,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        splashColor: iconColor.withAlpha(25),
        highlightColor: iconColor.withAlpha(12),
        child: Container(
          height: 102,
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: bgGradient,
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: borderColor.withAlpha(180),
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: iconColor.withAlpha(15),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Row: Icon Container + Micro Action Arrow
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: borderColor.withAlpha(120),
                        width: 0.8,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(8),
                          blurRadius: 3,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Center(
                      child: secondaryIcon != null
                          ? Stack(
                              alignment: Alignment.center,
                              children: [
                                Positioned(
                                  left: 3,
                                  top: 3,
                                  child: Icon(
                                    icon,
                                    color: const Color(0xFFF59E0B),
                                    size: 13,
                                  ),
                                ),
                                Positioned(
                                  right: 3,
                                  bottom: 3,
                                  child: Icon(
                                    secondaryIcon,
                                    color: iconColor,
                                    size: 15,
                                  ),
                                ),
                              ],
                            )
                          : Icon(
                              icon,
                              color: iconColor,
                              size: 18,
                            ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 2, right: 1),
                    child: Icon(
                      Icons.arrow_outward_rounded,
                      size: 13,
                      color: iconColor.withAlpha(140),
                    ),
                  ),
                ],
              ),

              // Bottom Area: Label occupying full width
              Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F243E),
                  height: 1.15,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
