export interface ApiErrorDetail {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[] | Record<string, unknown> | null;

  constructor(
    message: string,
    status: number,
    code: string = 'API_ERROR',
    details: ApiErrorDetail[] | Record<string, unknown> | null = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(status: number, body: unknown): ApiError {
    if (!body || typeof body !== 'object') {
      return new ApiError(`HTTP Error ${status}`, status, `HTTP_${status}`);
    }

    const payload = body as Record<string, unknown>;

    if (typeof payload.detail === 'string') {
      return new ApiError(payload.detail, status, `HTTP_${status}`);
    }

    if (Array.isArray(payload.detail)) {
      const messages = payload.detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            const loc = Array.isArray(item.loc) ? item.loc.join('.') : '';
            return loc ? `${loc}: ${String(item.msg)}` : String(item.msg);
          }
          return String(item);
        })
        .filter(Boolean);

      const message = messages.length > 0 ? messages.join(', ') : `Validation failed with status ${status}`;
      return new ApiError(message, status, 'VALIDATION_ERROR', payload.detail as ApiErrorDetail[]);
    }

    if (typeof payload.message === 'string') {
      return new ApiError(payload.message, status, `HTTP_${status}`);
    }

    return new ApiError(`Request failed with status ${status}`, status, `HTTP_${status}`, payload);
  }

  static timeout(timeoutMs: number): ApiError {
    return new ApiError(`Request timed out after ${timeoutMs}ms`, 408, 'REQUEST_TIMEOUT');
  }

  static networkError(originalError: Error): ApiError {
    return new ApiError(
      originalError.message || 'Unable to connect to the Parvaah server. Please verify your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}
