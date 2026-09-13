import 'package:flutter/material.dart';

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
        // 1. Risk Map Card (Mint)
        Expanded(
          child: _QuickActionCard(
            label: 'Risk Map',
            icon: Icons.map_rounded,
            iconColor: const Color(0xFF10B981),
            bgColor: const Color(0xFFE6FAF3),
            borderColor: const Color(0xFFA7F3D0),
            onTap: onMapTap,
          ),
        ),
        const SizedBox(width: 10),

        // 2. Weather Card (Sky Blue)
        Expanded(
          child: _QuickActionCard(
            label: 'Weather',
            icon: Icons.wb_cloudy_rounded,
            secondaryIcon: Icons.wb_sunny_rounded,
            iconColor: const Color(0xFF3B82F6),
            bgColor: const Color(0xFFEFF6FF),
            borderColor: const Color(0xFFBFDBFE),
            onTap: onWeatherTap,
          ),
        ),
        const SizedBox(width: 10),

        // 3. Road Status Card (Warm Amber)
        Expanded(
          child: _QuickActionCard(
            label: 'Road Status',
            icon: Icons.add_road_rounded,
            iconColor: const Color(0xFFD97706),
            bgColor: const Color(0xFFFFFBEB),
            borderColor: const Color(0xFFFDE68A),
            onTap: onRoadStatusTap,
          ),
        ),
        const SizedBox(width: 10),

        // 4. Alerts Card (Blush Red)
        Expanded(
          child: _QuickActionCard(
            label: 'Alerts',
            icon: Icons.notifications_rounded,
            iconColor: const Color(0xFFEF4444),
            bgColor: const Color(0xFFFFF1F2),
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
  final Color bgColor;
  final Color borderColor;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.label,
    required this.icon,
    this.secondaryIcon,
    required this.iconColor,
    required this.bgColor,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: 106,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: borderColor.withAlpha(120), width: 1.0),
            boxShadow: [
              BoxShadow(
                color: iconColor.withAlpha(16),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Icon
              if (secondaryIcon != null)
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned(
                      left: -2,
                      top: -2,
                      child: Icon(
                        secondaryIcon,
                        color: const Color(0xFFF59E0B),
                        size: 22,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 6, top: 4),
                      child: Icon(
                        icon,
                        color: iconColor,
                        size: 26,
                      ),
                    ),
                  ],
                )
              else
                Icon(
                  icon,
                  color: iconColor,
                  size: 28,
                ),

              // Bottom Label + Circular Arrow Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Text(
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
                  ),
                  const SizedBox(width: 4),
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(20),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        Icons.chevron_right_rounded,
                        size: 16,
                        color: iconColor,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
