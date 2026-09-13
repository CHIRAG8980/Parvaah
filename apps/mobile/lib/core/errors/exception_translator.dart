import 'dart:async';
import 'dart:io';
import 'app_exceptions.dart';

class ExceptionTranslator {
  ExceptionTranslator._();

  static String toUserMessage(dynamic error) {
    if (error == null) {
      return 'An unexpected error occurred.';
    }

    if (error is AppException) {
      return error.message;
    }

    if (error is SocketException) {
      return 'Unable to reach the server. Please check your internet connection.';
    }

    if (error is TimeoutException) {
      return 'Connection timed out. Please check your network and try again.';
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
        errorString.contains('Network is unreachable')) {
      return 'Unable to connect. Please ensure your device is connected to the internet.';
    }

    if (errorString.contains('TimeoutException')) {
      return 'Request timed out. Please retry.';
    }

    return 'An error occurred: $errorString';
  }
}
