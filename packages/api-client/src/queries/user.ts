import type { UpdateUserProfileInput, UserProfileDto } from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../client.js';

export const USER_QUERY_KEYS = {
  profile: ['user', 'profile'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile,
    queryFn: () => api.get<UserProfileDto>('/users/profile'),
    staleTime: 1000 * 60 * 5, // Cache valid for 5 minutes
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserProfileInput) =>
      api.patch<UserProfileDto>('/users/profile', input),
    onSuccess: (updated) => {
      queryClient.setQueryData(USER_QUERY_KEYS.profile, updated);
    },
  });
}
