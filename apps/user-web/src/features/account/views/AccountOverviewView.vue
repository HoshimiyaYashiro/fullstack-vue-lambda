<script setup lang="ts">
import { useProfileQuery } from '../../profile/queries/use-profile';
import AccountOverviewCard from '../components/AccountOverviewCard.vue';

const { data: profile, isLoading, isError, error, refetch } = useProfileQuery();
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <h1 class="page-title">Cổng Thông Tin Người Dùng</h1>
        <n-tag type="info" round>File-based Routing</n-tag>
      </div>
      <p class="page-description">Route tự động: <code>src/pages/index.vue</code> (Quản lý bởi unplugin-vue-router).</p>
    </div>

    <div class="grid-cols-2">
      <AccountOverviewCard
        :profile="profile"
        :is-loading="isLoading"
        :is-error="isError"
        :error-message="error?.message"
        @refetch="() => refetch()"
      />

      <!-- Architecture Highlights Card -->
      <n-card title="Kiến Trúc Enterprise Monorepo" hoverable>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">TanStack Query Reactive Cache</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Tự động cache profile 5 phút, tự refresh ngầm trong nền, giảm thiểu gọi API Lambda dư thừa.
            </p>
          </div>
          <div>
            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Chia Sẻ Mã Dùng Chung</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Giao diện dùng <code>@repo/ui</code>, DTO dùng <code>@repo/shared</code>, HTTP client dùng <code>@repo/api-client</code>.
            </p>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>
