import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/onboarding/onboarding_illustration.dart';
import 'login_register_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, String>> _slides = [
    {
      'title': 'Stay Informed,\nStay Safer',
      'desc':
          'Get real-time landslide risk alerts, road updates and weather information for North East India.',
    },
    {
      'title': 'Live GIS Road\n& Route Tracking',
      'desc':
          'Monitor highway blockages along NH-2, NH-6, and NH-10 with verified BRO detour advisories.',
    },
    {
      'title': 'AI Early Warning\n& Radar Telemetry',
      'desc':
          'Predictive satellite InSAR radar monitoring with estimated Time-to-Failure countdowns.',
    },
    {
      'title': 'Offline Community\nSafety First',
      'desc':
          'Full offline-first caching ensures critical safety telemetry remains accessible during network dropouts.',
    },
  ];

  void _onNext() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    } else {
      _navigateToAuth();
    }
  }

  void _navigateToAuth() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginRegisterScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            children: [
              // Top Action Bar (< Back and Skip)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _currentPage > 0
                      ? GestureDetector(
                          onTap: () {
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 16,
                              color: AppColors.navy,
                            ),
                          ),
                        )
                      : const SizedBox(width: 38),
                  GestureDetector(
                    onTap: _navigateToAuth,
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.blue,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Center Illustration Area matching reference Screen 2
              const Expanded(
                flex: 5,
                child: Center(
                  child: OnboardingIllustration(),
                ),
              ),

              const SizedBox(height: 24),

              // Bottom Content Area: Heading, Desc, Dots & Floating Arrow Button
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: (idx) => setState(() => _currentPage = idx),
                        itemCount: _slides.length,
                        itemBuilder: (context, index) {
                          final slide = _slides[index];
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                slide['title']!,
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F243E),
                                  height: 1.2,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                slide['desc']!,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textSecondary,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),

                    // Bottom Row: 4 Dot Indicators + Circular FAB Arrow Button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // 4 Dots Indicator
                        Row(
                          children: List.generate(_slides.length, (index) {
                            final isActive = index == _currentPage;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              margin: const EdgeInsets.only(right: 6),
                              width: isActive ? 22 : 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: isActive ? AppColors.blue : const Color(0xFFD1D5DB),
                                borderRadius: BorderRadius.circular(10),
                              ),
                            );
                          }),
                        ),

                        // Circular Forward Button (matching reference Screen 2)
                        GestureDetector(
                          onTap: _onNext,
                          child: Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: AppColors.blue,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.blue.withAlpha(90),
                                  blurRadius: 14,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
