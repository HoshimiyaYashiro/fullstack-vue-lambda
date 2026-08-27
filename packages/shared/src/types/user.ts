import type { UserRoleType, UserStatusType } from '../constants/index.js';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRoleType;
  status: UserStatusType;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDto extends UserDto {
  phoneNumber?: string;
  department?: string;
  lastLoginAt?: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
  expiresIn: number;
}
