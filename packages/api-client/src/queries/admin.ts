import type {
  PaginatedResponse,
  PaginationQuery,
  SystemMetricsDto,
  UserProfileDto,
} from '@repo/shared';
import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';
import { api } from '../client.js';

export const ADMIN_QUERY_KEYS = {
  metrics: ['admin', 'metrics'] as const,
  users: (params?: MaybeRefOrGetter<PaginationQuery | undefined>) =>
    ['admin', 'users', params] as const,
};

export function useAdminMetricsQuery() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.metrics,
    queryFn: () => api.get<SystemMetricsDto>('/admin/metrics'),
    refetchInterval: 1000 * 30, // Auto refresh every 30 seconds
  });
}

export function useAdminUsersQuery(params?: MaybeRefOrGetter<PaginationQuery | undefined>) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.users(params),
    queryFn: () => {
      const resolvedParams = toValue(params);
      return api.get<PaginatedResponse<UserProfileDto>>(
        '/admin/users',
        resolvedParams as Record<string, string | number | boolean | undefined>
      );
    },
  });
}
