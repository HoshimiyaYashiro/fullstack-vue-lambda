import { api, useQuery } from '@repo/api-client';
import type { PaginatedResponse, PaginationQuery, UserProfileDto } from '@repo/shared';
import type { MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';

export const ADMIN_USERS_QUERY_KEYS = {
  users: (params?: MaybeRefOrGetter<PaginationQuery | undefined>) =>
    ['admin', 'users', params] as const,
};

export function useAdminUsersQuery(params?: MaybeRefOrGetter<PaginationQuery | undefined>) {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEYS.users(params),
    queryFn: () => {
      const resolvedParams = toValue(params);
      return api.get<PaginatedResponse<UserProfileDto>>(
        '/admin/users',
        resolvedParams as Record<string, string | number | boolean | undefined>
      );
    },
  });
}
