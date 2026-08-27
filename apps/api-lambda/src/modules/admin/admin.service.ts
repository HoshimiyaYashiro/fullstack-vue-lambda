import type {
  PaginatedResponse,
  PaginationQuery,
  SystemMetricsDto,
  UserProfileDto,
} from '@repo/shared';
import { type IUsersRepository, usersRepository } from '../users/users.repository.js';

export class AdminService {
  constructor(private readonly usersRepo: IUsersRepository = usersRepository) {}

  async listUsers(query: PaginationQuery): Promise<PaginatedResponse<UserProfileDto>> {
    const { items, total } = await this.usersRepo.findMany(query);
    const limit = query.limit || 10;
    const page = query.page || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMetrics(): Promise<SystemMetricsDto> {
    const { total } = await this.usersRepo.findMany({ page: 1, limit: 1 });

    return {
      totalUsers: total,
      activeUsers: total,
      lambdaInvocations: 12480,
      systemHealth: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}

export const adminService = new AdminService();
