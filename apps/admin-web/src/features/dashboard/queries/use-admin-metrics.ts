import { api, useQuery } from '@repo/api-client';
import type { SystemMetricsDto } from '@repo/shared';

export const ADMIN_METRICS_QUERY_KEYS = {
  metrics: ['admin', 'metrics'] as const,
};

export function useAdminMetricsQuery() {
  return useQuery({
    queryKey: ADMIN_METRICS_QUERY_KEYS.metrics,
    queryFn: () => api.get<SystemMetricsDto>('/admin/metrics'),
    refetchInterval: 1000 * 30, // Auto refresh every 30 seconds
  });
}
