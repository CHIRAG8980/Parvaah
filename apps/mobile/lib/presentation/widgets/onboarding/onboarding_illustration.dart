import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class OnboardingIllustration extends StatelessWidget {
  const OnboardingIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 320,
      decoration: BoxDecoration(
        color: const Color(0xFFEBF3FC),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // Background soft environmental terrain waves
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
              child: Container(
                height: 120,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0xFFD6E8FA).withAlpha(100),
                      const Color(0xFFC0DCF7),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Plant / nature leaves in background
          Positioned(
            left: 24,
            bottom: 60,
            child: Column(
              children: [
                _buildLeaf(40, 24, 0.4),
                const SizedBox(height: 6),
                _buildLeaf(30, 20, -0.3),
              ],
            ),
          ),

          // Central Smartphone Frame
          Container(
            width: 170,
            height: 250,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF0F243E), width: 4.5),
              boxShadow: [
                BoxShadow(
                  color: AppColors.navy.withAlpha(45),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(19),
              child: Stack(
                children: [
                  // Map Simulation inside the phone
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xFFE3F2FD),
                          Color(0xFFC8E6C9),
                          Color(0xFFBBDEFB),
                        ],
                      ),
                    ),
                  ),
                  // Curving green terrain contour
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 140,
                    child: CustomPaint(
                      painter: _MapContoursPainter(),
                    ),
                  ),
                  // Blue Pin in the center
                  Center(
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.blue,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.blue.withAlpha(90),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.location_on_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Floating 3D Emergency Bell Badge in upper right breaking the frame
          Positioned(
            right: 60,
            top: 24,
            child: Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.riskHigh.withAlpha(60),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Center(
                child: Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(
                    color: Color(0xFFEF4444), // Crimson red
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.notifications_active_rounded,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaf(double w, double h, double angle) {
    return Transform.rotate(
      angle: angle,
      child: Container(
        width: w,
        height: h,
        decoration: BoxDecoration(
          color: const Color(0xFF66BB6A).withAlpha(150),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
        ),
      ),
    );
  }
}

class _MapContoursPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF81C784).withAlpha(140)
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, size.height * 0.4)
      ..quadraticBezierTo(size.width * 0.3, size.height * 0.1, size.width * 0.6, size.height * 0.5)
      ..quadraticBezierTo(size.width * 0.8, size.height * 0.8, size.width, size.height * 0.4)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(path, paint);

    // Blue arterial route polyline
    final routePaint = Paint()
      ..color = AppColors.blue.withAlpha(180)
      ..strokeWidth = 4.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final route = Path()
      ..moveTo(size.width * 0.2, size.height)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.5, size.width * 0.5, size.height * 0.4)
      ..quadraticBezierTo(size.width * 0.7, size.height * 0.3, size.width * 0.85, 0);

    canvas.drawPath(route, routePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
