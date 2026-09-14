import 'dart:async';
import 'dart:io';
import 'app_exceptions.dart';

class ExceptionTranslator {
  ExceptionTranslator._();

  static String toUserMessage(dynamic error) {
    if (error == null) {
      return 'An unexpected error occurred.';
    }

    if (error is ServerException) {
      final code = error.statusCode ?? 0;
      if (code == 503 || code == 0) {
        return 'Unable to connect to Parvaah server. Check your internet connection.';
      }
      if (code == 408) {
        return 'Parvaah server timed out. Check your connection and try again.';
      }
      return error.message;
    }

    if (error is AppException) {
      final msg = error.message.toLowerCase();
      if (msg.contains('unable to connect') || msg.contains('parvaah server')) {
        return error.message;
      }
      return error.message;
    }

    if (error is SocketException) {
      return 'Unable to connect to Parvaah server. Check your internet connection.';
    }

    if (error is TimeoutException) {
      return 'Parvaah server timed out. Check your network and try again.';
    }

    if (error is HttpException) {
      return 'Network communication failed: ${error.message}';
    }

    if (error is FormatException) {
      return 'Received invalid or corrupted data from the server.';
    }

    final errorString = error.toString();
    if (errorString.contains('SocketException') ||
        errorString.contains('Failed host lookup') ||
        errorString.contains('Network is unreachable') ||
        errorString.contains('Connection refused')) {
      return 'Unable to connect to Parvaah server. Check your internet connection.';
    }

    if (errorString.contains('TimeoutException')) {
      return 'Parvaah server timed out. Please retry.';
    }

    return 'An error occurred: $errorString';
  }
}
