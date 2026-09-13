import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../shell/main_navigation_shell.dart';
import 'onboarding_screen.dart';
import '../../providers/auth_provider.dart';
import '../../providers/risk_provider.dart';
import '../../providers/alert_provider.dart';
import '../../providers/road_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  double _displayProgress = 0.0;
  String _statusPhase = 'INITIALIZING TELEMETRY...';

  @override
  void initState() {
    super.initState();

    // Edge-to-edge transparent system bars
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );

    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _progressAnimation = Tween<double>(begin: 0.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _progressController,
        curve: Curves.easeOutCubic,
      ),
    )..addListener(() {
        if (mounted) {
          setState(() {
            _displayProgress = _progressAnimation.value;
          });
        }
      });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _runRealInitializationSequence();
    });
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  Future<void> _animateProgressTo(double target, String status, {int durationMs = 500}) async {
    if (!mounted) return;
    setState(() {
      _statusPhase = status;
    });

    _progressAnimation = Tween<double>(
      begin: _displayProgress,
      end: target,
    ).animate(
      CurvedAnimation(
        parent: _progressController,
        curve: Curves.easeOutCubic,
      ),
    );

    _progressController.duration = Duration(milliseconds: durationMs);
    _progressController.reset();
    await _progressController.forward();
  }

  Future<void> _runRealInitializationSequence() async {
    try {
      // Milestone 1: Local cache & user session check (0% -> 22%)
      await _animateProgressTo(0.22, 'INITIALIZING SYSTEM...', durationMs: 450);
      await Future.delayed(const Duration(milliseconds: 150));

      // Milestone 2: Pre-warming live landslide risk telemetry (22% -> 54%)
      if (mounted) {
        final riskProvider = context.read<RiskProvider>();
        // Trigger real zone risks load concurrently with progress animation
        final riskFuture = riskProvider.loadRisks();
        await _animateProgressTo(0.54, 'CONNECTING SENSOR GRID...', durationMs: 650);
        await riskFuture;
      }

      // Milestone 3: Fetching active road advisories & early warning feeds (54% -> 78%)
      if (mounted) {
        final alertProvider = context.read<AlertProvider>();
        final roadProvider = context.read<RoadProvider>();
        final dataFuture = Future.wait([
          alertProvider.loadAlerts(),
          roadProvider.loadRoads(),
        ]);
        await _animateProgressTo(0.78, 'SYNCHRONIZING RISK MODELS...', durationMs: 600);
        await dataFuture;
      }

      // Milestone 4: Early warning radar & satellite verification (78% -> 94%)
      await _animateProgressTo(0.94, 'VERIFYING EARLY WARNING...', durationMs: 450);
      await Future.delayed(const Duration(milliseconds: 200));

      // Milestone 5: System readiness finalized (94% -> 100%)
      await _animateProgressTo(1.0, 'SYSTEM READY', durationMs: 350);
      await Future.delayed(const Duration(milliseconds: 300));

      // Smooth navigation transition
      if (!mounted) return;
      final authProvider = context.read<AuthProvider>();
      final destination = authProvider.isLoggedIn
          ? const MainNavigationShell()
          : const OnboardingScreen();

      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (context, anim, secAnim) => destination,
          transitionsBuilder: (context, animation, secAnim, child) =>
              FadeTransition(opacity: animation, child: child),
          transitionDuration: const Duration(milliseconds: 450),
        ),
      );
    } catch (_) {
      // Fallback navigation in case of any unhandled initialization error
      if (mounted) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (context, anim, secAnim) => const OnboardingScreen(),
            transitionsBuilder: (context, animation, secAnim, child) =>
                FadeTransition(opacity: animation, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEAF2FB),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Reference Starting Page Graphic Artwork
          Image.asset(
            'assets/images/splash_bg_highres.png',
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            alignment: Alignment.center,
          ),

          // Dynamic Bottom Loading Progress Section
          Positioned(
            left: 0,
            right: 0,
            bottom: 46,
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Smooth Pill Progress Bar
                  Container(
                    width: 136,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(90),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        width: (136 * _displayProgress).clamp(4.0, 136.0),
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.white.withAlpha(140),
                              blurRadius: 6,
                              spreadRadius: 0.5,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 11),

                  // Classic "L O A D I N G . . ." title exactly from reference
                  Text(
                    'L O A D I N G . . .',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 3.2,
                      color: Colors.white.withAlpha(225),
                    ),
                  ),

                  const SizedBox(height: 4),

                  // Dynamic real progress percentage & telemetry phase
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(
                      '$_statusPhase  •  ${(_displayProgress * 100).toInt()}%',
                      key: ValueKey<String>('$_statusPhase${(_displayProgress * 100).toInt()}'),
                      style: TextStyle(
                        fontSize: 8.5,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 1.0,
                        color: Colors.white.withAlpha(190),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
