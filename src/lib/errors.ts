import { NextResponse } from "next/server";

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  statusCode = 400,
  code = "BAD_REQUEST",
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status: statusCode }
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error.message, error.statusCode, error.code, error.details);
  }
  console.error("Unhandled API Error:", error);
  return apiError(
    error instanceof Error ? error.message : "An unexpected error occurred",
    500,
    "INTERNAL_SERVER_ERROR"
  );
}
