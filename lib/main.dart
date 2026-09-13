import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/theme/app_theme.dart';
import 'data/services/cache_service.dart';
import 'data/services/api_client.dart';
import 'data/repositories/risk_repository.dart';
import 'data/repositories/alert_repository.dart';
import 'data/repositories/road_repository.dart';

import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/location_provider.dart';
import 'presentation/providers/risk_provider.dart';
import 'presentation/providers/alert_provider.dart';
import 'presentation/providers/road_provider.dart';
import 'presentation/providers/safety_provider.dart';
import 'presentation/providers/notification_provider.dart';
import 'presentation/providers/settings_provider.dart';

import 'presentation/screens/auth/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set transparent system status bar with dark icons
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  final sharedPrefs = await SharedPreferences.getInstance();
  final cacheService = CacheService(sharedPrefs);
  final apiClient = ApiClient();

  final riskRepository = RiskRepository(apiClient: apiClient, cacheService: cacheService);
  final alertRepository = AlertRepository(apiClient: apiClient, cacheService: cacheService);
  final roadRepository = RoadRepository(apiClient: apiClient, cacheService: cacheService);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(cacheService)),
        ChangeNotifierProvider(create: (_) => LocationProvider(riskRepository, cacheService)),
        ChangeNotifierProvider(create: (_) => RiskProvider(riskRepository)),
        ChangeNotifierProvider(create: (_) => AlertProvider(alertRepository)),
        ChangeNotifierProvider(create: (_) => RoadProvider(roadRepository)),
        ChangeNotifierProvider(create: (_) => SafetyProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider(cacheService)),
      ],
      child: const ParvaahApp(),
    ),
  );
}

class ParvaahApp extends StatelessWidget {
  const ParvaahApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Parvaah',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
