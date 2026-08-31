<script setup lang="ts">
import type { UserProfileDto } from '@repo/shared';

defineProps<{
  profile: UserProfileDto | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}>();

defineEmits<(e: 'refetch') => void>();
</script>

<template>
  <n-card title="Tổng Quan Tài Khoản" hoverable>
    <template #header-extra>
      <n-tag type="success" size="small" round>{{ profile?.status || 'Active' }}</n-tag>
    </template>

    <div v-if="isLoading" style="text-align: center; padding: 2rem 0;">
      <n-spin size="medium" />
      <p style="margin-top: 0.5rem; color: var(--color-text-muted);">Đang tải dữ liệu từ Lambda qua TanStack Query...</p>
    </div>

    <div v-else-if="isError" style="margin-bottom: 1rem;">
      <n-alert type="error" title="Không thể tải dữ liệu">
        {{ errorMessage }}
      </n-alert>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div>
        <span style="font-size: 0.85rem; color: var(--color-text-muted);">Họ và tên:</span>
        <p style="font-weight: 600;">{{ profile?.fullName || 'Nguyễn Văn Người Dùng' }}</p>
      </div>
      <div>
        <span style="font-size: 0.85rem; color: var(--color-text-muted);">Email:</span>
        <p style="font-weight: 600;">{{ profile?.email || 'user@enterprise.internal' }}</p>
      </div>
      <div>
        <span style="font-size: 0.85rem; color: var(--color-text-muted);">Phòng ban:</span>
        <p>{{ profile?.department || 'Kinh Doanh & Phát Triển' }}</p>
      </div>
    </div>

    <template #action>
      <n-space justify="space-between">
        <router-link to="/profile" style="text-decoration: none;">
          <n-button type="primary" size="small">Xem Chi Tiết Hồ Sơ</n-button>
        </router-link>
        <n-button size="small" :loading="isLoading" @click="$emit('refetch')">
          Refetch Query
        </n-button>
      </n-space>
    </template>
  </n-card>
</template>
