import 'package:flutter/material.dart';
import '../../../data/models/safety_article_model.dart';

class SafetyCarousel extends StatelessWidget {
  final Function(SafetyArticleModel) onArticleTap;
  final VoidCallback? onViewAll;

  const SafetyCarousel({
    super.key,
    required this.onArticleTap,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    final articles = SafetyArticleModel.defaultArticles;
    final landslideArticle = articles.firstWhere(
      (a) => a.id == 'safety_landslide',
      orElse: () => articles[0],
    );
    final rainfallArticle = articles.firstWhere(
      (a) => a.id == 'safety_rainfall',
      orElse: () => articles.length > 1 ? articles[1] : articles[0],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header: "Safety Tips" and "View All >"
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Text(
              'Safety Tips',
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

        // 2 Wide Cards Row
        Row(
          children: [
            // Card 1: Landslide Safety
            Expanded(
              child: _SafetyCard(
                title: 'Landslide Safety',
                icon: Icons.shield_rounded,
                iconColor: const Color(0xFF2563EB),
                iconBg: const Color(0xFFDBEAFE),
                bgColors: const [Color(0xFFEFF6FF), Color(0xFFDBEAFE)],
                borderColor: const Color(0xFFBFDBFE),
                contourColor: const Color(0xFF3B82F6),
                onTap: () => onArticleTap(landslideArticle),
              ),
            ),
            const SizedBox(width: 12),

            // Card 2: Heavy Rainfall
            Expanded(
              child: _SafetyCard(
                title: 'Heavy Rainfall',
                icon: Icons.thunderstorm_rounded,
                iconColor: const Color(0xFF0284C7),
                iconBg: const Color(0xFFFEF3C7),
                bgColors: const [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                borderColor: const Color(0xFFFDE68A),
                contourColor: const Color(0xFFF59E0B),
                onTap: () => onArticleTap(rainfallArticle),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SafetyCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final List<Color> bgColors;
  final Color borderColor;
  final Color contourColor;
  final VoidCallback onTap;

  const _SafetyCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.bgColors,
    required this.borderColor,
    required this.contourColor,
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
          height: 84,
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
                color: iconColor.withAlpha(15),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Stack(
              children: [
                // Mountain contours watermark
                Positioned(
                  right: -8,
                  bottom: -6,
                  child: Opacity(
                    opacity: 0.22,
                    child: CustomPaint(
                      size: const Size(60, 36),
                      painter: _SafetyHillsPainter(color: contourColor),
                    ),
                  ),
                ),

                // Content Row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  child: Row(
                    children: [
                      // Icon Squircle
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Center(
                          child: Icon(
                            icon,
                            color: iconColor,
                            size: 22,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Title
                      Expanded(
                        child: Text(
                          title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F243E),
                            height: 1.18,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),

                      // Circular Arrow Button
                      Container(
                        width: 26,
                        height: 26,
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
                            size: 18,
                            color: iconColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SafetyHillsPainter extends CustomPainter {
  final Color color;

  const _SafetyHillsPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, size.height)
      ..quadraticBezierTo(size.width * 0.4, size.height * 0.2, size.width * 0.7, size.height * 0.6)
      ..quadraticBezierTo(size.width * 0.85, size.height * 0.05, size.width, size.height * 0.35)
      ..lineTo(size.width, size.height)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _SafetyHillsPainter oldDelegate) => oldDelegate.color != color;
}
