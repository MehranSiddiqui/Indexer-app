export class ResponseSuccessStructure<T> {
  public readonly success: boolean;
  public readonly data: T | null;
  public readonly message: string;
  public readonly code: number;

  constructor(data: T | null = null, message: string, code: number) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.code = code;
  }
}

export class ErrorResponse {
  public readonly success: boolean;
  public readonly message: string;
  public readonly errors: unknown;

  constructor(message: string, errors: unknown = null) {
    this.success = false;
    this.message = message;
    this.errors = errors;
  }
}

export class AppError extends Error {
  public readonly code: number;
  public readonly isOperational: boolean;
  constructor(message: string, stasusCode = 500) {
    super(message);
    this.code = stasusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
