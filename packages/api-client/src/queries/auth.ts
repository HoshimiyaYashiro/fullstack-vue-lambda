import type { LoginInput, LoginResponseDto } from '@repo/shared';
import { useMutation } from '@tanstack/vue-query';
import { api } from '../client.js';

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const result = await api.post<LoginResponseDto>('/auth/login', credentials);
      api.setToken(result.accessToken);
      return result;
    },
  });
}
