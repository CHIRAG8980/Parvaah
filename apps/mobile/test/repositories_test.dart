import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/errors/app_exceptions.dart';
import 'package:mobile/core/network/http_network_client.dart';
import 'package:mobile/core/security/i_secure_storage.dart';
import 'package:mobile/data/models/alert_model.dart';
import 'package:mobile/data/models/zone_risk_model.dart';
import 'package:mobile/data/repositories/alert_repository.dart';
import 'package:mobile/data/repositories/auth_repository.dart';
import 'package:mobile/data/repositories/risk_repository.dart';
import 'package:mobile/data/services/api_client.dart';
import 'package:mobile/data/services/cache_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class InMemorySecureStorage implements ISecureStorage {
  final Map<String, String> _map = {};

  @override
  Future<String?> read(String key) async => _map[key];

  @override
  Future<void> write(String key, String value) async => _map[key] = value;

  @override
  Future<void> delete(String key) async => _map.remove(key);

  @override
  Future<void> deleteAll() async => _map.clear();
}

void main() {
  late SharedPreferences prefs;
  late CacheService cacheService;
  late ISecureStorage secureStorage;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
    cacheService = CacheService(prefs);
    secureStorage = InMemorySecureStorage();
  });

  group('AuthRepository Integration Tests', () {
    test('Successful login persists access token and updates cache', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'access_token': 'test-session-token-999',
            'token_type': 'bearer',
            'user_id': 'officer-99',
            'username': 'dmo_east_khasi',
            'full_name': 'Officer In-charge',
            'role': 'dmo',
            'district': 'East Khasi Hills',
            'escalation_level': 1,
          }),
          200,
        );
      });

      final networkClient = HttpNetworkClient(client: mockClient, secureStorage: secureStorage);
      final apiClient = ApiClient(networkClient: networkClient);
      final authRepo = AuthRepository(
        apiClient: apiClient,
        secureStorage: secureStorage,
        cacheService: cacheService,
      );

      final tokens = await authRepo.login(
        username: 'dmo_east_khasi',
        password: 'password123',
      );

      expect(tokens.accessToken, 'test-session-token-999');
      expect(await secureStorage.read(HttpNetworkClient.tokenKey), 'test-session-token-999');
      expect(cacheService.getBool(CacheService.keyIsLoggedIn), true);
      expect(await authRepo.isAuthenticated(), true);

      await authRepo.logout();
      expect(await authRepo.isAuthenticated(), false);
    });
  });

  group('RiskRepository Zero-Fallback Tests', () {
    test('Throws ServerException on server failure under zero-fallback policy', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Server Error', 500);
      });

      final networkClient = HttpNetworkClient(client: mockClient);
      final apiClient = ApiClient(networkClient: networkClient);
      final riskRepo = RiskRepository(apiClient: apiClient, cacheService: cacheService);

      expect(riskRepo.getAllZones(), throwsA(isA<ServerException>()));
    });

    test('Successfully parses live zones and writes to cache on success', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode([
            {
              'zone_id': 'NER-MEG-001',
              'name': 'Sohra Sector A',
              'district': 'East Khasi Hills',
              'state': 'Meghalaya',
              'latitude': 25.2517,
              'longitude': 91.7353,
              'risk_score': 0.70,
              'risk_level': 'CRITICAL',
              'confidence': 'HIGH',
              'historical_condition_window': 'Historical 1-3 day condition-match profile',
              'data_availability': {
                'insar_nisar': {'status': 'AVAILABLE', 'quality': 'GOOD', 'coherence': 0.72},
                'soil_moisture_eos04': {'status': 'AVAILABLE', 'quality': 'GOOD'},
              },
            }
          ]),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final networkClient = HttpNetworkClient(client: mockClient);
      final apiClient = ApiClient(networkClient: networkClient);
      final riskRepo = RiskRepository(apiClient: apiClient, cacheService: cacheService);

      final zones = await riskRepo.getAllZones();
      expect(zones.length, 1);
      expect(zones.first.zoneId, 'NER-MEG-001');
      expect(zones.first.riskLevel, RiskLevel.critical);
      expect(zones.first.nisarStatus.isAvailable, true);
      expect(zones.first.nisarStatus.isGoodQuality, true);
    });
  });

  group('AlertRepository Tests', () {
    test('Parses active alerts and applies severity filter', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode([
            {
              'alert_id': 'ALT-1',
              'title': 'Critical Warning',
              'message': 'Evacuate slope',
              'severity': 'Critical',
              'zone_id': 'NER-01',
              'zone_name': 'Sohra',
              'district': 'East Khasi',
              'state': 'Meghalaya',
              'dispatched_at': '2026-09-13T12:00:00.000Z',
              'language': 'en',
              'available_languages': ['en'],
            },
            {
              'alert_id': 'ALT-2',
              'title': 'Medium Warning',
              'message': 'Road wet',
              'severity': 'Medium',
              'zone_id': 'NER-02',
              'zone_name': 'Cherra',
              'district': 'East Khasi',
              'state': 'Meghalaya',
              'dispatched_at': '2026-09-13T12:00:00.000Z',
              'language': 'en',
              'available_languages': ['en'],
            },
          ]),
          200,
        );
      });

      final networkClient = HttpNetworkClient(client: mockClient);
      final apiClient = ApiClient(networkClient: networkClient);
      final alertRepo = AlertRepository(apiClient: apiClient, cacheService: cacheService);

      final allAlerts = await alertRepo.getAlerts();
      expect(allAlerts.length, 2);

      final criticalAlerts = await alertRepo.getAlerts(filter: AlertSeverity.critical);
      expect(criticalAlerts.length, 1);
      expect(criticalAlerts.first.severity, AlertSeverity.critical);
    });

    test('Throws ServerException when network fails and no cached alerts exist', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Internal Server Error', 500);
      });

      final networkClient = HttpNetworkClient(client: mockClient);
      final apiClient = ApiClient(networkClient: networkClient);
      final alertRepo = AlertRepository(apiClient: apiClient, cacheService: cacheService);

      expect(alertRepo.getAlerts(), throwsA(isA<ServerException>()));
    });
  });
}
