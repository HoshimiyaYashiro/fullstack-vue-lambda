import { api, useMutation } from '@repo/api-client';
import type { LoginInput, LoginResponseDto } from '@repo/shared';

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const result = await api.post<LoginResponseDto>('/auth/login', credentials);
      api.setToken(result.accessToken);
      return result;
    },
  });
}
