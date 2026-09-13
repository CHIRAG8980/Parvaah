import 'package:flutter/material.dart';

class OverviewMetrics extends StatelessWidget {
  final int highRiskCount;
  final int affectedRoadsCount;
  final int safeRoutesCount;
  final VoidCallback? onViewAll;

  const OverviewMetrics({
    super.key,
    required this.highRiskCount,
    required this.affectedRoadsCount,
    required this.safeRoutesCount,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header: "Today's Overview" and "View All >"
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text(
              "Today's Overview",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F243E),
                letterSpacing: -0.4,
              ),
            ),
            if (onViewAll != null)
              GestureDetector(
                onTap: onViewAll,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'View All',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1E88E5),
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 17,
                      color: Color(0xFF1E88E5),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // 3 Cards Row
        Row(
          children: [
            // 1. High Risk Card
            Expanded(
              child: _MetricCard(
                icon: Icons.warning_rounded,
                iconColor: const Color(0xFFEF4444),
                value: highRiskCount.toString(),
                label: 'High Risk',
                valueColor: const Color(0xFF991B1B),
                labelColor: const Color(0xFFEF4444),
                bgColors: const [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
                borderColor: const Color(0xFFFECDD3),
                contourColor: const Color(0xFFF43F5E),
                showUpArrow: false,
              ),
            ),
            const SizedBox(width: 12),

            // 2. Affected Roads Card
            Expanded(
              child: _MetricCard(
                icon: Icons.add_road_rounded,
                iconColor: const Color(0xFFD97706),
                value: affectedRoadsCount.toString(),
                label: 'Affected Roads',
                valueColor: const Color(0xFF92400E),
                labelColor: const Color(0xFFD97706),
                bgColors: const [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                borderColor: const Color(0xFFFDE68A),
                contourColor: const Color(0xFFF59E0B),
                showUpArrow: false,
              ),
            ),
            const SizedBox(width: 12),

            // 3. Safe Routes Card
            Expanded(
              child: _MetricCard(
                icon: Icons.check_circle_rounded,
                iconColor: const Color(0xFF16A34A),
                value: safeRoutesCount.toString(),
                label: 'Safe Routes',
                valueColor: const Color(0xFF166534),
                labelColor: const Color(0xFF16A34A),
                bgColors: const [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
                borderColor: const Color(0xFFBBF7D0),
                contourColor: const Color(0xFF22C55E),
                showUpArrow: true,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;
  final Color valueColor;
  final Color labelColor;
  final List<Color> bgColors;
  final Color borderColor;
  final Color contourColor;
  final bool showUpArrow;

  const _MetricCard({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
    required this.valueColor,
    required this.labelColor,
    required this.bgColors,
    required this.borderColor,
    required this.contourColor,
    required this.showUpArrow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 114,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: bgColors,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor.withAlpha(140), width: 1.0),
        boxShadow: [
          BoxShadow(
            color: iconColor.withAlpha(16),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          children: [
            // Subtle mountain contour watermark in bottom right
            Positioned(
              right: -10,
              bottom: -6,
              child: Opacity(
                opacity: 0.16,
                child: CustomPaint(
                  size: const Size(64, 42),
                  painter: _MiniHillsPainter(color: contourColor),
                ),
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top Icon
                  Icon(
                    icon,
                    size: 22,
                    color: iconColor,
                  ),

                  // Middle Value + Bottom Label
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            value,
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: valueColor,
                              height: 1.05,
                              letterSpacing: -0.6,
                            ),
                          ),
                          if (showUpArrow) ...[
                            const SizedBox(width: 3),
                            Icon(
                              Icons.arrow_upward_rounded,
                              size: 18,
                              color: valueColor,
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: labelColor,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniHillsPainter extends CustomPainter {
  final Color color;

  const _MiniHillsPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, size.height)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.3, size.width * 0.65, size.height * 0.55)
      ..quadraticBezierTo(size.width * 0.85, size.height * 0.1, size.width, size.height * 0.4)
      ..lineTo(size.width, size.height)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _MiniHillsPainter oldDelegate) => oldDelegate.color != color;
}
