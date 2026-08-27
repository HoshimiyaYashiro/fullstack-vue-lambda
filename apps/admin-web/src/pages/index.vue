<script setup lang="ts">
import { NButton, NCard, NGi, NGrid, NSpin, NStatistic, NTag } from '@repo/ui';
import { useAdminMetricsQuery } from '../queries/index.js';

// Reactive metrics query with TanStack Query (auto-refreshes every 30s)
const { data: metrics, isLoading, isFetching, refetch } = useAdminMetricsQuery();
</script>

<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <h1 class="page-title">Bảng Điều Khiển Quản Trị</h1>
            <NTag type="error" size="small" round>Admin Portal</NTag>
            <NTag type="info" size="small" round>Route: / (File-based)</NTag>
            <NTag v-if="isFetching" type="warning" size="small" round>Đang đồng bộ...</NTag>
          </div>
          <p class="page-description">Tự động ánh xạ từ <code>src/pages/index.vue</code> (Quản lý bởi unplugin-vue-router).</p>
        </div>
        <NButton type="primary" secondary size="small" :loading="isLoading" @click="() => refetch()">
          Làm Mới Số Liệu
        </NButton>
      </div>
    </div>

    <!-- Metrics Grid with Naive UI NGrid & NStatistic -->
    <div v-if="isLoading" style="text-align: center; padding: 3rem 0;">
      <NSpin size="large" />
      <p style="margin-top: 1rem; color: var(--color-text-muted);">Đang truy vấn metrics từ Backend Lambda qua TanStack Query...</p>
    </div>

    <div v-else>
      <NGrid :x-gap="16" :y-gap="16" cols="1 s:2 m:4" responsive="screen" style="margin-bottom: 1.5rem;">
        <NGi>
          <NCard hoverable>
            <NStatistic label="Tổng Thành Viên" :value="metrics?.totalUsers ?? 3" />
          </NCard>
        </NGi>

        <NGi>
          <NCard hoverable>
            <NStatistic label="Thành Viên Hoạt Động" :value="metrics?.activeUsers ?? 3">
              <template #suffix>
                <span style="font-size: 0.85rem; color: #10b981; font-weight: 500;">✓ Active</span>
              </template>
            </NStatistic>
          </NCard>
        </NGi>

        <NGi>
          <NCard hoverable>
            <NStatistic label="Lambda Invocations" :value="metrics?.lambdaInvocations ?? 12480" />
          </NCard>
        </NGi>

        <NGi>
          <NCard hoverable>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Trạng Thái Hệ Thống</div>
            <NTag type="success" size="medium" round>
              {{ metrics?.systemHealth?.toUpperCase() ?? 'HEALTHY' }}
            </NTag>
          </NCard>
        </NGi>
      </NGrid>

      <!-- System Info Card -->
      <NCard title="Cấu Trúc Tách Biệt Doanh Nghiệp (Enterprise Decoupling)" hoverable>
        <NGrid :x-gap="24" :y-gap="16" cols="1 m:3" responsive="screen">
          <NGi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">File-based Routing</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Sử dụng <code>unplugin-vue-router</code> giúp cấu trúc dự án chuẩn hóa theo file-system, không lo thiếu hoặc quên đăng ký routes thủ công.
            </p>
          </NGi>

          <NGi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">@repo/ui (Naive UI)</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Cài đặt Naive UI và quản lý Theme tập trung. Cả User App và Admin App cùng dùng chung components mà không bị trùng lặp bundle.
            </p>
          </NGi>

          <NGi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">@repo/api-client (TanStack Query)</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Quản lý toàn bộ data fetching, query caching, background refetching. Đảm bảo Lambda backend hoàn toàn không dính bất kỳ Vue dependency nào.
            </p>
          </NGi>
        </NGrid>
      </NCard>
    </div>
  </div>
</template>
