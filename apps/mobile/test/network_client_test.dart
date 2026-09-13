import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/network/http_network_client.dart';
import 'package:mobile/core/security/i_secure_storage.dart';

class MockSecureStorage implements ISecureStorage {
  String? token;

  @override
  Future<String?> read(String key) async => token;

  @override
  Future<void> write(String key, String value) async => token = value;

  @override
  Future<void> delete(String key) async => token = null;

  @override
  Future<void> deleteAll() async => token = null;
}

void main() {
  group('HttpNetworkClient Tests', () {
    test('Injects Authorization Bearer header when token present', () async {
      final storage = MockSecureStorage()..token = 'active-jwt-token';
      String? capturedAuthHeader;

      final mockClient = MockClient((request) async {
        capturedAuthHeader = request.headers['Authorization'];
        return http.Response(jsonEncode({'status': 'ok'}), 200);
      });

      final networkClient = HttpNetworkClient(
        client: mockClient,
        secureStorage: storage,
      );

      final response = await networkClient.get('/test-endpoint');
      expect(response.isSuccess, true);
      expect(capturedAuthHeader, 'Bearer active-jwt-token');
    });

    test('Translates 404 response to NotFound failure response', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'detail': 'Zone not found in registry'}),
          404,
        );
      });

      final networkClient = HttpNetworkClient(client: mockClient);
      final response = await networkClient.get('/zones/unknown');

      expect(response.isSuccess, false);
      expect(response.statusCode, 404);
      expect(response.errorMessage, 'Zone not found in registry');
    });

    test('Transparently retries with fresh token on 401 response', () async {
      int requestCount = 0;
      final storage = MockSecureStorage()..token = 'expired-token';

      final mockClient = MockClient((request) async {
        requestCount++;
        if (request.headers['Authorization'] == 'Bearer expired-token') {
          return http.Response(jsonEncode({'detail': 'Token expired'}), 401);
        }
        return http.Response(jsonEncode({'data': 'success_after_refresh'}), 200);
      });

      final networkClient = HttpNetworkClient(
        client: mockClient,
        secureStorage: storage,
        onRefreshToken: () async {
          storage.token = 'fresh-new-token';
          return 'fresh-new-token';
        },
      );

      final response = await networkClient.get('/secured-data');
      expect(requestCount, 2);
      expect(response.isSuccess, true);
      expect((response.data as Map)['data'], 'success_after_refresh');
    });

    test('Invokes onUnauthenticated when token refresh fails', () async {
      bool unauthenticatedCalled = false;
      final storage = MockSecureStorage()..token = 'invalid-token';

      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Unauthorized'}), 401);
      });

      final networkClient = HttpNetworkClient(
        client: mockClient,
        secureStorage: storage,
        onRefreshToken: () async => null, // Refresh fails
        onUnauthenticated: () => unauthenticatedCalled = true,
      );

      final response = await networkClient.get('/protected-zone');
      expect(response.isSuccess, false);
      expect(response.statusCode, 401);
      expect(unauthenticatedCalled, true);
    });
  });
}
