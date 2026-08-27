<script setup lang="ts">
import { useProfileQuery } from '@repo/api-client';
import { NAlert, NButton, NCard, NSpace, NSpin, NTag } from '@repo/ui';

// Using TanStack Query for reactive data fetching & caching
const { data: profile, isLoading, isError, error, refetch } = useProfileQuery();
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <h1 class="page-title">Cổng Thông Tin Người Dùng</h1>
        <NTag type="info" round>File-based Routing</NTag>
      </div>
      <p class="page-description">Route tự động: <code>src/pages/index.vue</code> (Quản lý bởi unplugin-vue-router).</p>
    </div>

    <div class="grid-cols-2">
      <!-- Account Overview Card using Naive UI & TanStack Query -->
      <NCard title="Tổng Quan Tài Khoản" hoverable>
        <template #header-extra>
          <NTag type="success" size="small" round>{{ profile?.status || 'Active' }}</NTag>
        </template>

        <div v-if="isLoading" style="text-align: center; padding: 2rem 0;">
          <NSpin size="medium" />
          <p style="margin-top: 0.5rem; color: var(--color-text-muted);">Đang tải dữ liệu từ Lambda qua TanStack Query...</p>
        </div>

        <div v-else-if="isError" style="margin-bottom: 1rem;">
          <NAlert type="error" title="Không thể tải dữ liệu">
            {{ error?.message }}
          </NAlert>
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
          <NSpace justify="space-between">
            <router-link to="/profile" style="text-decoration: none;">
              <NButton type="primary" size="small">Xem Chi Tiết Hồ Sơ</NButton>
            </router-link>
            <NButton size="small" :loading="isLoading" @click="() => refetch()">
              Refetch Query
            </NButton>
          </NSpace>
        </template>
      </NCard>

      <!-- Architecture Card -->
      <NCard title="Kiến Trúc File-based Routing Chuẩn Doanh Nghiệp" hoverable>
        <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--color-text-muted);">
          <li><strong style="color: var(--color-text-main);">Tự động quét routes:</strong> Mọi file trong <code>src/pages/*.vue</code> tự động chuyển thành routes mà không cần khai báo tay.</li>
          <li><strong style="color: var(--color-text-main);">Type-safe navigation:</strong> Tự sinh <code>typed-router.d.ts</code> giúp gợi ý đường dẫn route chính xác 100%.</li>
          <li><strong style="color: var(--color-text-main);">packages/ui:</strong> Naive UI được chia sẻ tập trung qua <code>@repo/ui</code>.</li>
          <li><strong style="color: var(--color-text-main);">packages/api-client:</strong> Quản lý cache và truy vấn API với TanStack Query.</li>
        </ul>

        <template #action>
          <NTag type="success" size="small">Auto Generated Route: /</NTag>
        </template>
      </NCard>
    </div>
  </div>
</template>
