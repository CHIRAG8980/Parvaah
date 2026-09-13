import '../../core/network/api_response.dart';
import '../../core/network/http_network_client.dart';

export '../../core/network/api_response.dart';

class ApiClient {
  final HttpNetworkClient _networkClient;

  ApiClient({HttpNetworkClient? networkClient})
      : _networkClient = networkClient ?? HttpNetworkClient();

  HttpNetworkClient get networkClient => _networkClient;

  Future<ApiResponse<dynamic>> get(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParameters,
  }) {
    return _networkClient.get(
      endpoint,
      headers: headers,
      queryParameters: queryParameters,
    );
  }

  Future<ApiResponse<dynamic>> post(
    String endpoint,
    Map<String, dynamic>? body, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParameters,
  }) {
    return _networkClient.post(
      endpoint,
      body: body,
      headers: headers,
      queryParameters: queryParameters,
    );
  }
}
