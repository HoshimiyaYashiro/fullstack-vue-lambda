<script setup lang="ts">
import type { SystemMetricsDto } from '@repo/shared';

defineProps<{
  metrics?: SystemMetricsDto;
}>();
</script>

<template>
  <n-grid :x-gap="16" :y-gap="16" cols="1 s:2 m:4" responsive="screen" style="margin-bottom: 1.5rem;">
    <n-gi>
      <n-card hoverable>
        <n-statistic :label="$t('metrics.totalUsers')" :value="metrics?.totalUsers ?? 3" />
      </n-card>
    </n-gi>

    <n-gi>
      <n-card hoverable>
        <n-statistic :label="$t('metrics.activeUsers')" :value="metrics?.activeUsers ?? 3">
          <template #suffix>
            <span style="font-size: 0.85rem; color: #10b981; font-weight: 500;">✓ {{ $t('metrics.active') }}</span>
          </template>
        </n-statistic>
      </n-card>
    </n-gi>

    <n-gi>
      <n-card hoverable>
        <n-statistic :label="$t('metrics.lambdaInvocations')" :value="metrics?.lambdaInvocations ?? 12480" />
      </n-card>
    </n-gi>

    <n-gi>
      <n-card hoverable>
        <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">{{ $t('metrics.systemHealth') }}</div>
        <n-tag type="success" size="medium" round>
          {{ metrics?.systemHealth?.toUpperCase() ?? $t('metrics.healthy') }}
        </n-tag>
      </n-card>
    </n-gi>
  </n-grid>
</template>
