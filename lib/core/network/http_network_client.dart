import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../errors/app_exceptions.dart';
import '../security/i_secure_storage.dart';
import 'api_response.dart';

typedef TokenRefreshCallback = Future<String?> Function();
typedef UnauthenticatedCallback = void Function();

class HttpNetworkClient {
  final http.Client client;
  final ISecureStorage? secureStorage;
  final TokenRefreshCallback? onRefreshToken;
  final UnauthenticatedCallback? onUnauthenticated;
  final Duration timeout;

  static const String tokenKey = 'parvaah_access_token';

  HttpNetworkClient({
    http.Client? client,
    this.secureStorage,
    this.onRefreshToken,
    this.onUnauthenticated,
    this.timeout = ApiConstants.timeout,
  }) : client = client ?? http.Client();

  Future<ApiResponse<dynamic>> get(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParameters,
  }) async {
    return _sendWithRetry(() async {
      final uri = _buildUri(endpoint, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final response = await client.get(uri, headers: requestHeaders).timeout(timeout);
      return _processResponse(response);
    });
  }

  Future<ApiResponse<dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    Map<String, dynamic>? queryParameters,
  }) async {
    return _sendWithRetry(() async {
      final uri = _buildUri(endpoint, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final response = await client
          .post(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(timeout);
      return _processResponse(response);
    });
  }

  Uri _buildUri(String endpoint, Map<String, dynamic>? queryParameters) {
    final fullUrl = endpoint.startsWith('http') ? endpoint : '${ApiConstants.baseUrl}$endpoint';
    final parsed = Uri.parse(fullUrl);
    if (queryParameters == null || queryParameters.isEmpty) return parsed;

    final stringParams = queryParameters.map(
      (key, value) => MapEntry(key, value.toString()),
    );
    return parsed.replace(queryParameters: {...parsed.queryParameters, ...stringParams});
  }

  Future<Map<String, String>> _buildHeaders(Map<String, String>? customHeaders) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (secureStorage != null) {
      final token = await secureStorage!.read(tokenKey);
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }
    return headers;
  }

  ApiResponse<dynamic> _processResponse(http.Response response) {
    final status = response.statusCode;
    if (status >= 200 && status < 300) {
      if (response.body.isEmpty) {
        return ApiResponse.success(null, statusCode: status);
      }
      try {
        final decoded = jsonDecode(response.body);
        return ApiResponse.success(decoded, statusCode: status);
      } catch (e) {
        throw DataParseException('Failed to parse response body', e);
      }
    }

    final errorMessage = _extractErrorMessage(response);
    if (status == 401) throw UnauthorizedException(errorMessage);
    if (status == 403) throw ForbiddenException(errorMessage);
    if (status == 404) throw NotFoundException(errorMessage);
    if (status >= 400 && status < 500) throw BadRequestException(errorMessage);
    throw ServerException(errorMessage, status);
  }

  String _extractErrorMessage(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        if (decoded['detail'] != null) {
          final detail = decoded['detail'];
          if (detail is String) return detail;
          if (detail is List && detail.isNotEmpty) {
            final first = detail.first;
            if (first is Map && first['msg'] != null) {
              return first['msg'].toString();
            }
          }
        }
        if (decoded['message'] != null) return decoded['message'].toString();
      }
    } catch (_) {}
    return 'HTTP ${response.statusCode}: ${response.reasonPhrase ?? 'Error'}';
  }

  Future<ApiResponse<dynamic>> _sendWithRetry(
    Future<ApiResponse<dynamic>> Function() requestAction,
  ) async {
    try {
      return await requestAction();
    } on UnauthorizedException {
      if (onRefreshToken != null) {
        final newToken = await onRefreshToken!();
        if (newToken != null && newToken.isNotEmpty) {
          try {
            return await requestAction();
          } catch (_) {}
        }
      }
      onUnauthenticated?.call();
      return ApiResponse.failure('Session expired. Please sign in again.', statusCode: 401);
    } on SocketException {
      return ApiResponse.failure('Network connection failed. Check your internet.', statusCode: 0);
    } on TimeoutException {
      return ApiResponse.failure('Request timed out. Server is taking too long.', statusCode: 408);
    } on AppException catch (e) {
      return ApiResponse.failure(e.message, statusCode: e.statusCode ?? 500);
    } catch (e) {
      return ApiResponse.failure(e.toString(), statusCode: 500);
    }
  }
}
