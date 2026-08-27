import type { ApiResponse, UserProfileDto } from '@repo/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfileDto | null>({
    id: 'usr_normal_1',
    email: 'user@enterprise.internal',
    fullName: 'Nguyễn Văn Người Dùng',
    role: 'user',
    status: 'active',
    department: 'Kinh Doanh & Phát Triển',
    phoneNumber: '+84977777777',
    createdAt: '2025-02-15T08:30:00.000Z',
    updatedAt: '2025-02-15T08:30:00.000Z',
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProfile() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch('/api/users/profile', {
        headers: {
          Authorization: 'Bearer mock-user-token',
        },
      });
      if (res.ok) {
        const json: ApiResponse<UserProfileDto> = await res.json();
        profile.value = json.data;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi tải thông tin';
    } finally {
      loading.value = false;
    }
  }

  return {
    profile,
    loading,
    error,
    fetchProfile,
  };
});
