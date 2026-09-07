<script setup lang="ts">
import type { UserProfileDto } from '@repo/shared';

const searchQuery = ref('');
const { data, isLoading, refetch } = useAdminUsersQuery();

const filteredUsers = computed(() => {
  const users: UserProfileDto[] = data.value?.items ?? [
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
  ];

  if (!searchQuery.value) return users;
  const q = searchQuery.value.toLowerCase();
  return users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
  );
});
</script>

<template>
  <div>
    <UserFilterBar
      v-model:search-query="searchQuery"
      :is-loading="isLoading"
      @refresh="() => refetch()"
    />

    <n-card hoverable>
      <template #header>
        <div style="width: 320px;">
          <n-input
            v-model:value="searchQuery"
            :placeholder="$t('users.searchPlaceholder')"
            clearable
          />
        </div>
      </template>

      <UserTable :users="filteredUsers" :is-loading="isLoading" />
    </n-card>
  </div>
</template>
