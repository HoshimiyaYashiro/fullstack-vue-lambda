import { type PaginationQuery, type UserProfileDto, UserRole, UserStatus } from '@repo/shared';

export interface IUsersRepository {
  findById(id: string): Promise<UserProfileDto | null>;
  findByEmail(email: string): Promise<UserProfileDto | null>;
  findMany(params: PaginationQuery): Promise<{ items: UserProfileDto[]; total: number }>;
  update(id: string, data: Partial<UserProfileDto>): Promise<UserProfileDto>;
}

// Enterprise Repository Implementation (In-memory mock store, easily replaceable with DynamoDB or PostgreSQL)
export class UsersRepository implements IUsersRepository {
  private users: UserProfileDto[] = [
    {
      id: 'usr_admin_1',
      email: 'admin@enterprise.internal',
      fullName: 'Quản Trị Viên Hệ Thống',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      department: 'IT & Infrastructure',
      phoneNumber: '+84988888888',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      lastLoginAt: '2025-08-27T12:00:00.000Z',
    },
    {
      id: 'usr_normal_1',
      email: 'user@enterprise.internal',
      fullName: 'Nguyễn Văn Người Dùng',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      department: 'Kinh Doanh & Phát Triển',
      phoneNumber: '+84977777777',
      createdAt: '2025-02-15T08:30:00.000Z',
      updatedAt: '2025-02-15T08:30:00.000Z',
      lastLoginAt: '2025-08-26T09:15:00.000Z',
    },
    {
      id: 'usr_manager_1',
      email: 'manager@enterprise.internal',
      fullName: 'Trần Thị Trưởng Phòng',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      department: 'Nhân Sự',
      phoneNumber: '+84966666666',
      createdAt: '2025-03-10T10:00:00.000Z',
      updatedAt: '2025-03-10T10:00:00.000Z',
      lastLoginAt: '2025-08-25T16:45:00.000Z',
    },
  ];

  async findById(id: string): Promise<UserProfileDto | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<UserProfileDto | null> {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  async findMany(params: PaginationQuery): Promise<{ items: UserProfileDto[]; total: number }> {
    let filtered = [...this.users];

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.department?.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return { items, total };
  }

  async update(id: string, data: Partial<UserProfileDto>): Promise<UserProfileDto> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    const updated = {
      ...this.users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.users[index] = updated;
    return { ...updated };
  }
}

export const usersRepository = new UsersRepository();
