export type ErrorCode =
  | "INVALID_REQUEST"
  | "METHOD_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_SPECIFICATION"
  | "UNSUPPORTED_OPENAPI_VERSION"
  | "SPEC_TOO_COMPLEX"
  | "ANALYSIS_FAILED";

const STATUS: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  METHOD_NOT_ALLOWED: 405,
  PAYLOAD_TOO_LARGE: 413,
  INVALID_SPECIFICATION: 422,
  UNSUPPORTED_OPENAPI_VERSION: 422,
  SPEC_TOO_COMPLEX: 422,
  ANALYSIS_FAILED: 500,
};

/**
 * An expected, caller-facing failure. Every error maps to a non-2xx status, so Bankr does not
 * settle the payment (verified in T-001, D-023). Messages must never echo spec content.
 */
export class BreakraError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly details: Record<string, string | number> | undefined;

  constructor(code: ErrorCode, message: string, details?: Record<string, string | number>) {
    super(message);
    this.name = "BreakraError";
    this.code = code;
    this.status = STATUS[code];
    this.retryable = code === "ANALYSIS_FAILED";
    this.details = details;
  }
}

export interface ErrorBody {
  status: "error";
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
    details?: Record<string, string | number>;
  };
}

export function errorBody(err: BreakraError): ErrorBody {
  return {
    status: "error",
    error: {
      code: err.code,
      message: err.message,
      retryable: err.retryable,
      ...(err.details ? { details: err.details } : {}),
    },
  };
}
