class ApiError extends Error {
  statusCode: number;
  field?: string;

  code?: string;

  retryAfter?: number;

  isOperational = true;

  constructor(statusCode: number, message: string, field?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }

  withCode(code: string): this {
    this.code = code;
    return this;
  }

  withRetryAfter(seconds: number): this {
    this.retryAfter = seconds;
    return this;
  }

  static badRequest(message: string, field?: string): ApiError {
    return new ApiError(400, message, field);
  }

  static unauthorized(message: string, field?: string): ApiError {
    return new ApiError(401, message, field);
  }

  static forbidden(message: string, field?: string): ApiError {
    return new ApiError(403, message, field);
  }

  static notFound(message: string, field?: string): ApiError {
    return new ApiError(404, message, field);
  }

  static conflict(message: string, field?: string): ApiError {
    return new ApiError(409, message, field);
  }

  static tooLarge(message: string, field?: string): ApiError {
    return new ApiError(413, message, field);
  }

  static internal(message: string): ApiError {
    return new ApiError(500, message);
  }
}

export default ApiError;
