import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export function jsonSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const body: ApiSuccessResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { status });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  const body: ApiErrorResponse = { success: false, error: message, ...(details !== undefined ? { details } : {}) };
  return NextResponse.json(body, { status });
}
