<script setup lang="ts">
import type { UserProfileDto } from '@repo/shared';
import { type DataTableColumns, NButton, NTag } from '@repo/ui';
import { computed, h } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  users: UserProfileDto[];
  isLoading: boolean;
}>();

const { t } = useI18n();

const columns = computed<DataTableColumns<UserProfileDto>>(() => [
  {
    title: t('users.table.id'),
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
    title: t('users.table.fullName'),
    key: 'fullName',
    render(row) {
      return h('span', { style: { fontWeight: '600' } }, row.fullName);
    },
  },
  {
    title: t('users.table.email'),
    key: 'email',
  },
  {
    title: t('users.table.department'),
    key: 'department',
    render(row) {
      return row.department || 'N/A';
    },
  },
  {
    title: t('users.table.role'),
    key: 'role',
    render(row) {
      const type = row.role === 'admin' ? 'error' : row.role === 'manager' ? 'warning' : 'info';
      return h(NTag, { type, size: 'small', round: true }, { default: () => row.role });
    },
  },
  {
    title: t('users.table.status'),
    key: 'status',
    render(row) {
      const type = row.status === 'active' ? 'success' : 'default';
      return h(NTag, { type, size: 'small' }, { default: () => row.status });
    },
  },
  {
    title: t('users.table.actions'),
    key: 'actions',
    align: 'right',
    render() {
      return h(
        NButton,
        { size: 'small', secondary: true, type: 'primary' },
        { default: () => t('users.table.edit') }
      );
    },
  },
]);
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
