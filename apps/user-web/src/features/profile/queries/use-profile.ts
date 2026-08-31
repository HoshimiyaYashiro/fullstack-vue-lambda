import { api, useMutation, useQuery, useQueryClient } from '@repo/api-client';
import type { UpdateUserProfileInput, UserProfileDto } from '@repo/shared';

export const USER_QUERY_KEYS = {
  profile: ['user', 'profile'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile,
    queryFn: () => api.get<UserProfileDto>('/users/profile'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
