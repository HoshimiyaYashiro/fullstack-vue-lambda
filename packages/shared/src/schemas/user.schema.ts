import { z } from 'zod';
import { UserRole, UserStatus } from '../constants/index.js';

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9+]{9,15}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  department: z.string().optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export const adminCreateUserSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.MANAGER]),
  status: z
    .enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED])
    .default(UserStatus.ACTIVE),
  department: z.string().optional(),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.MANAGER]).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]).optional(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
