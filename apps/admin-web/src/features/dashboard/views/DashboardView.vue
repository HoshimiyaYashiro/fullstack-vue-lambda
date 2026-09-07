<script setup lang="ts">
const { data: metrics, isLoading, isFetching, refetch } = useAdminMetricsQuery();
</script>

<template>
  <div>
    <div class="page-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <h1 class="page-title">{{ $t('portal.title') }}</h1>
            <n-tag type="error" size="small" round>{{ $t('portal.type') }}</n-tag>
            <n-tag type="info" size="small" round>{{ $t('portal.routeTag') }}</n-tag>
            <n-tag v-if="isFetching" type="warning" size="small" round>{{ $t('portal.syncing') }}</n-tag>
          </div>
          <p class="page-description">{{ $t('portal.routeDescription') }}</p>
        </div>
        <n-button type="primary" secondary size="small" :loading="isLoading" @click="() => refetch()">
          {{ $t('portal.refreshMetrics') }}
        </n-button>
      </div>
    </div>

    <!-- Metrics Grid with Naive UI NGrid & NStatistic -->
    <div v-if="isLoading" style="text-align: center; padding: 3rem 0;">
      <n-spin size="large" />
      <p style="margin-top: 1rem; color: var(--color-text-muted);">{{ $t('portal.queryingMetrics') }}</p>
    </div>

    <div v-else>
      <DashboardMetrics :metrics="metrics" />

      <!-- System Info Card -->
      <n-card :title="$t('decoupling.title')" hoverable>
        <n-grid :x-gap="24" :y-gap="16" cols="1 m:3" responsive="screen">
          <n-gi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">{{ $t('decoupling.fileRoutingTitle') }}</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              {{ $t('decoupling.fileRoutingDesc') }}
            </p>
          </n-gi>

          <n-gi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">{{ $t('decoupling.uiTitle') }}</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              {{ $t('decoupling.uiDesc') }}
            </p>
          </n-gi>

          <n-gi>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-primary);">{{ $t('decoupling.apiClientTitle') }}</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              {{ $t('decoupling.apiClientDesc') }}
            </p>
          </n-gi>
        </n-grid>
      </n-card>
    </div>
  </div>
</template>
