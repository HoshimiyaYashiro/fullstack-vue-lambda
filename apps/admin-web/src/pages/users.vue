<script setup lang="ts">
import { useAdminUsersQuery } from '@repo/api-client';
import type { UserProfileDto } from '@repo/shared';
import { type DataTableColumns, NButton, NCard, NDataTable, NInput, NSpace, NTag } from '@repo/ui';
import { computed, h, ref } from 'vue';

const searchQuery = ref('');

// Reactive query with TanStack Query (cached and auto-managed)
const { data, isLoading, refetch } = useAdminUsersQuery();

// Client-side search filtering demonstration over cached data
const filteredUsers = computed(() => {
  const users = data.value?.items ?? [
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

// Naive UI DataTable Column Definitions with typed records
const columns: DataTableColumns<UserProfileDto> = [
  {
    title: 'ID',
    key: 'id',
    render(row) {
      return h(
        'span',
        { style: { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' } },
        row.id
      );
    },
  },
  {
    title: 'Họ và Tên',
    key: 'fullName',
    render(row) {
      return h('span', { style: { fontWeight: '600' } }, row.fullName);
    },
  },
  {
    title: 'Email',
    key: 'email',
  },
  {
    title: 'Phòng Ban',
    key: 'department',
    render(row) {
      return row.department || 'N/A';
    },
  },
  {
    title: 'Vai Trò',
    key: 'role',
    render(row) {
      const type = row.role === 'admin' ? 'error' : row.role === 'manager' ? 'warning' : 'info';
      return h(NTag, { type, size: 'small', round: true }, { default: () => row.role });
    },
  },
  {
    title: 'Trạng Thái',
    key: 'status',
    render(row) {
      const type = row.status === 'active' ? 'success' : 'default';
      return h(NTag, { type, size: 'small' }, { default: () => row.status });
    },
  },
  {
    title: 'Thao Tác',
    key: 'actions',
    align: 'right',
    render() {
      return h(
        NButton,
        { size: 'small', secondary: true, type: 'primary' },
        { default: () => 'Chỉnh Sửa' }
      );
    },
  },
];
</script>

<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <h1 class="page-title">Quản Lý Người Dùng</h1>
            <NTag type="info" size="small" round>Route: /users (File-based)</NTag>
          </div>
          <p class="page-description">Tự động ánh xạ từ <code>src/pages/users.vue</code> với Naive UI NDataTable.</p>
        </div>
        <NSpace>
          <NButton secondary size="small" :loading="isLoading" @click="() => refetch()">
            Làm Mới
          </NButton>
          <NButton type="primary" size="small">
            + Thêm Người Dùng
          </NButton>
        </NSpace>
      </div>
    </div>

    <!-- Naive UI Card wrapping Naive UI DataTable -->
    <NCard hoverable>
      <template #header>
        <div style="width: 320px;">
          <NInput
            v-model:value="searchQuery"
            placeholder="Tìm kiếm theo tên, email, phòng ban..."
            clearable
          />
        </div>
      </template>

      <NDataTable
        :columns="columns"
        :data="filteredUsers"
        :loading="isLoading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
      />
    </NCard>
  </div>
</template>
