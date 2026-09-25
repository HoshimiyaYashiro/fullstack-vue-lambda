import type { LoginInput, LoginResponseDto } from '@repo/shared';
import { UnauthorizedError } from '../../core/errors.js';
import { type IUsersRepository, usersRepository } from '../users/users.repository.js';

export class AuthService {
  constructor(private readonly usersRepo: IUsersRepository = usersRepository) {}

  async login(input: LoginInput): Promise<LoginResponseDto> {
    const user = await this.usersRepo.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không chính xác');
    }

    // In a real enterprise app, compare password hashes using argon2 or bcrypt
    if (input.password.length < 6) {
      throw new UnauthorizedError('Mật khẩu không hợp lệ');
    }

    // Generate mock enterprise JWT tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 8, // 8 hours
    };

    const accessToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    const refreshToken = Buffer.from(JSON.stringify({ ...tokenPayload, type: 'refresh' })).toString(
      'base64'
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 * 8,
      user,
    };
  }
}

export const authService = new AuthService();
