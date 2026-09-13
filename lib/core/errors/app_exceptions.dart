abstract class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic cause;

  const AppException(this.message, {this.statusCode, this.cause});

  @override
  String toString() => message;
}

class NoInternetException extends AppException {
  const NoInternetException([
    super.message = 'No internet connection. Please check your network settings.',
    dynamic cause,
  ]) : super(cause: cause);
}

class SocketTimeoutException extends AppException {
  const SocketTimeoutException([
    super.message = 'Request timed out. The server took too long to respond.',
    dynamic cause,
  ]) : super(statusCode: 408, cause: cause);
}

class UnauthorizedException extends AppException {
  const UnauthorizedException([
    super.message = 'Authentication required or session expired.',
    dynamic cause,
  ]) : super(statusCode: 401, cause: cause);
}

class ForbiddenException extends AppException {
  const ForbiddenException([
    super.message = 'Access denied. You do not have permission to perform this action.',
    dynamic cause,
  ]) : super(statusCode: 403, cause: cause);
}

class NotFoundException extends AppException {
  const NotFoundException([
    super.message = 'The requested resource was not found.',
    dynamic cause,
  ]) : super(statusCode: 404, cause: cause);
}

class BadRequestException extends AppException {
  const BadRequestException([
    super.message = 'Invalid request parameters submitted.',
    dynamic cause,
  ]) : super(statusCode: 400, cause: cause);
}

class ServerException extends AppException {
  const ServerException([
    super.message = 'Remote server encountered an error. Please try again later.',
    int statusCode = 500,
    dynamic cause,
  ]) : super(statusCode: statusCode, cause: cause);
}

class DataParseException extends AppException {
  const DataParseException([
    super.message = 'Failed to parse response data from server.',
    dynamic cause,
  ]) : super(cause: cause);
}
