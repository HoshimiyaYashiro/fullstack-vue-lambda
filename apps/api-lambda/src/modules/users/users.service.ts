import type { UpdateUserProfileInput, UserProfileDto } from '@repo/shared';
import { NotFoundError } from '../../core/errors.js';
import { type IUsersRepository, usersRepository } from './users.repository.js';

export class UsersService {
  constructor(private readonly repo: IUsersRepository = usersRepository) {}

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy thông tin người dùng');
    }
    return user;
  }

  async updateProfile(userId: string, input: UpdateUserProfileInput): Promise<UserProfileDto> {
    const existing = await this.repo.findById(userId);
    if (!existing) {
      throw new NotFoundError('Không tìm thấy thông tin người dùng');
    }

    return await this.repo.update(userId, input);
  }
}

export const usersService = new UsersService();
