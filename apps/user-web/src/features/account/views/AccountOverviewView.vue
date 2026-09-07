<script setup lang="ts">
const { data: profile, isLoading, isError, error, refetch } = useProfileQuery();
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <h1 class="page-title">{{ $t('portal.title') }}</h1>
        <n-tag type="info" round>{{ $t('portal.fileBasedRouting') }}</n-tag>
      </div>
      <p class="page-description">{{ $t('portal.routeDescription') }}</p>
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
      <n-card :title="$t('architecture.title')" hoverable>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">{{ $t('architecture.cacheTitle') }}</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              {{ $t('architecture.cacheDesc') }}
            </p>
          </div>
          <div>
            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">{{ $t('architecture.sharingTitle') }}</h4>
            <p style="font-size: 0.875rem; color: var(--color-text-muted);">
              {{ $t('architecture.sharingDesc') }}
            </p>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>
