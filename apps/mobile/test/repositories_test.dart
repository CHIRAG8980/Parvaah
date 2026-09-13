import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/errors/app_exceptions.dart';
import 'package:mobile/core/network/http_network_client.dart';
import 'package:mobile/core/security/i_secure_storage.dart';
import 'package:mobile/data/models/alert_model.dart';
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

  group('RiskRepository Offline Cache Tests', () {
    test('Falls back to cached risks when network client fails', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Server Error', 500);
      });

      // Seed offline cache
      await cacheService.setJsonList(CacheService.keyCachedRisks, [
        {
          'zone_id': 'NER-CACHED-01',
          'name': 'Cached Sector',
          'district': 'East Khasi',
          'state': 'Meghalaya',
          'risk_score': 60.0,
          'risk_level': 'HIGH',
        }
      ]);

      final networkClient = HttpNetworkClient(client: mockClient);
      final apiClient = ApiClient(networkClient: networkClient);
      final riskRepo = RiskRepository(apiClient: apiClient, cacheService: cacheService);

      final zones = await riskRepo.getAllZones();
      expect(zones.length, 1);
      expect(zones.first.zoneId, 'NER-CACHED-01');
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

      expect(() => alertRepo.getAlerts(), throwsA(isA<ServerException>()));
    });
  });
}
