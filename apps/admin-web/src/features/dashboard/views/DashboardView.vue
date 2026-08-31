<script setup lang="ts">
import DashboardMetrics from '../components/DashboardMetrics.vue';
import { useAdminMetricsQuery } from '../queries/use-admin-metrics';

const { data: metrics, isLoading, isFetching, refetch } = useAdminMetricsQuery();
</script>

<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <h1 class="page-title">Bảng Điều Khiển Quản Trị</h1>
            <n-tag type="error" size="small" round>Admin Portal</n-tag>
            <n-tag type="info" size="small" round>Route: / (File-based)</n-tag>
            <n-tag v-if="isFetching" type="warning" size="small" round>Đang đồng bộ...</n-tag>
          </div>
          <p class="page-description">Tự động ánh xạ từ <code>src/pages/index.vue</code> (Quản lý bởi unplugin-vue-router).</p>
        </div>
        <n-button type="primary" secondary size="small" :loading="isLoading" @click="() => refetch()">
          Làm Mới Số Liệu
        </n-button>
      </div>
    </div>

    <!-- Metrics Grid with Naive UI NGrid & NStatistic -->
    <div v-if="isLoading" style="text-align: center; padding: 3rem 0;">
      <n-spin size="large" />
      <p style="margin-top: 1rem; color: var(--color-text-muted);">Đang truy vấn metrics từ Backend Lambda qua TanStack Query...</p>
    </div>

    <div v-else>
      <DashboardMetrics :metrics="metrics" />

      <!-- System Info Card -->
      <n-card title="Cấu Trúc Tách Biệt Doanh Nghiệp (Enterprise Decoupling)" hoverable>
        <n-grid :x-gap="24" :y-gap="16" cols="1 m:3" responsive="screen">
          <n-gi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">File-based Routing</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Sử dụng <code>unplugin-vue-router</code> giúp cấu trúc dự án chuẩn hóa theo file-system, không lo thiếu hoặc quên đăng ký routes thủ công.
            </p>
          </n-gi>

          <n-gi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">@repo/ui (Naive UI)</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Cài đặt Naive UI và quản lý Theme tập trung. Cả User App và Admin App cùng dùng chung components mà không bị trùng lặp bundle.
            </p>
          </n-gi>

          <n-gi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">@repo/api-client (TanStack Query)</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              Quản lý toàn bộ data fetching, query caching, background refetching. Đảm bảo Lambda backend hoàn toàn không dính bất kỳ Vue dependency nào.
            </p>
          </n-gi>
        </n-grid>
      </n-card>
    </div>
  </div>
</template>
