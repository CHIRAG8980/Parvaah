import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';

class ApiResponse {
  final bool isSuccess;
  final dynamic data;
  final String? errorMessage;
  final int statusCode;

  ApiResponse({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    this.statusCode = 200,
  });
}

class ApiClient {
  final http.Client _client;
  final String baseUrl;

  ApiClient({http.Client? client, this.baseUrl = ApiConstants.baseUrl})
      : _client = client ?? http.Client();

  Future<ApiResponse> get(String endpoint) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final res = await _client.get(uri).timeout(ApiConstants.timeout);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return ApiResponse(isSuccess: true, data: decoded, statusCode: res.statusCode);
      } else {
        return ApiResponse(
          isSuccess: false,
          errorMessage: 'Server error: ${res.statusCode}',
          statusCode: res.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse(isSuccess: false, errorMessage: e.toString(), statusCode: 500);
    }
  }

  Future<ApiResponse> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      final res = await _client
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(ApiConstants.timeout);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final decoded = jsonDecode(res.body);
        return ApiResponse(isSuccess: true, data: decoded, statusCode: res.statusCode);
      } else {
        return ApiResponse(
          isSuccess: false,
          errorMessage: 'Server error: ${res.statusCode}',
          statusCode: res.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse(isSuccess: false, errorMessage: e.toString(), statusCode: 500);
    }
  }
}
