import { type ApiErrorResponse, type ApiResponse, ErrorCode, HttpStatus } from '@repo/shared';
import type { LambdaResult } from './types.js';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

export function formatSuccessResponse<T>(
  data: T,
  statusCode: number = HttpStatus.OK,
  message?: string
): LambdaResult {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload),
  };
}

export function formatErrorResponse(
  error: {
    code?: string;
    message: string;
    details?: { field?: string; message: string; code?: string }[];
  },
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR
): LambdaResult {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code || ErrorCode.INTERNAL_ERROR,
      message: error.message,
      details: error.details,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload),
  };
}
