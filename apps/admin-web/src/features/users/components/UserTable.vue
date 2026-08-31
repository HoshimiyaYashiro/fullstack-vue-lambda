<script setup lang="ts">
import type { UserProfileDto } from '@repo/shared';
import { type DataTableColumns, NButton, NTag } from '@repo/ui';
import { h } from 'vue';

defineProps<{
  users: UserProfileDto[];
  isLoading: boolean;
}>();

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
  <n-data-table
    :columns="columns"
    :data="users"
    :loading="isLoading"
    :pagination="{ pageSize: 10 }"
    :bordered="false"
  />
</template>
