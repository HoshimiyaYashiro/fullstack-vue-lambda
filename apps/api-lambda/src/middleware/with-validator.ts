import type { z } from 'zod';
import { ValidationError } from '../core/errors.js';

export function validateBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    throw new ValidationError('Dữ liệu yêu cầu không hợp lệ', errorDetails);
  }
  return result.data;
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    throw new ValidationError('Tham số truy vấn không hợp lệ', errorDetails);
  }
  return result.data;
}
