import { count, db, eq, ilike, or, users } from '@repo/database';
import { type PaginationQuery, type UserProfileDto, UserRole, UserStatus } from '@repo/shared';
import type { IUsersRepository } from './users.repository.js';

export class PostgresUsersRepository implements IUsersRepository {
  async findById(id: string): Promise<UserProfileDto | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return null;
    return this.mapToDto(user);
  }

  async findByEmail(email: string): Promise<UserProfileDto | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return null;
    return this.mapToDto(user);
  }

  async findMany(params: PaginationQuery): Promise<{ items: UserProfileDto[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;

    const whereClause = params.search
      ? or(ilike(users.fullName, `%${params.search}%`), ilike(users.email, `%${params.search}%`))
      : undefined;

    const items = await db.select().from(users).where(whereClause).limit(limit).offset(offset);

    const [totalResult] = await db.select({ count: count() }).from(users).where(whereClause);

    return {
      items: items.map(this.mapToDto),
      total: totalResult?.count ?? 0,
    };
  }

  async update(id: string, data: Partial<UserProfileDto>): Promise<UserProfileDto> {
    const [updated] = await db
      .update(users)
      .set({
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.avatarUrl ? { avatarUrl: data.avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new Error(`User with id ${id} not found in database`);
    }

    return this.mapToDto(updated);
  }

  private mapToDto(u: typeof users.$inferSelect): UserProfileDto {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: (u.role as UserProfileDto['role']) || UserRole.USER,
      status: (u.status as UserProfileDto['status']) || UserStatus.ACTIVE,
      avatarUrl: u.avatarUrl ?? undefined,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }
}
