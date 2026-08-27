import type {
  ApiResponse,
  PaginatedResponse,
  SystemMetricsDto,
  UserProfileDto,
} from '@repo/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAdminStore = defineStore('admin', () => {
  const metrics = ref<SystemMetricsDto>({
    totalUsers: 3,
    activeUsers: 3,
    lambdaInvocations: 12480,
    systemHealth: 'healthy',
    uptimeSeconds: 86400,
  });

  const users = ref<UserProfileDto[]>([
    {
      id: 'usr_admin_1',
      email: 'admin@enterprise.internal',
      fullName: 'Quản Trị Viên Hệ Thống',
      role: 'admin',
      status: 'active',
      department: 'IT & Infrastructure',
      phoneNumber: '+84988888888',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_normal_1',
      email: 'user@enterprise.internal',
      fullName: 'Nguyễn Văn Người Dùng',
      role: 'user',
      status: 'active',
      department: 'Kinh Doanh & Phát Triển',
      phoneNumber: '+84977777777',
      createdAt: '2025-02-15T08:30:00.000Z',
      updatedAt: '2025-02-15T08:30:00.000Z',
    },
    {
      id: 'usr_manager_1',
      email: 'manager@enterprise.internal',
      fullName: 'Trần Thị Trưởng Phòng',
      role: 'manager',
      status: 'active',
      department: 'Nhân Sự',
      phoneNumber: '+84966666666',
      createdAt: '2025-03-10T10:00:00.000Z',
      updatedAt: '2025-03-10T10:00:00.000Z',
    },
  ]);

  const loading = ref(false);

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: 'Bearer mock-admin-token' },
      });
      if (res.ok) {
        const json: ApiResponse<SystemMetricsDto> = await res.json();
        metrics.value = json.data;
      }
    } catch (err) {
      console.error('Lỗi khi tải thông số metrics:', err);
    }
  }

  async function fetchUsers() {
    loading.value = true;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: 'Bearer mock-admin-token' },
      });
      if (res.ok) {
        const json: ApiResponse<PaginatedResponse<UserProfileDto>> = await res.json();
        users.value = json.data.items;
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách users:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    metrics,
    users,
    loading,
    fetchMetrics,
    fetchUsers,
  };
});
