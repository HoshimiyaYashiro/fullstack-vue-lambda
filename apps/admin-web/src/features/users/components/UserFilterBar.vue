<script setup lang="ts">
const searchQuery = defineModel<string>('searchQuery', { default: '' });
defineProps<{
  isLoading?: boolean;
}>();

defineEmits<{
  (e: 'refresh'): void;
  (e: 'addUser'): void;
}>();
</script>

<template>
  <div class="page-header">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <h1 class="page-title">{{ $t('users.title') }}</h1>
          <n-tag type="info" size="small" round>{{ $t('users.routeTag') }}</n-tag>
        </div>
        <p class="page-description">{{ $t('users.description') }}</p>
      </div>
      <n-space>
        <n-button secondary size="small" :loading="isLoading" @click="$emit('refresh')">
          {{ $t('users.refresh') }}
        </n-button>
        <n-button type="primary" size="small" @click="$emit('addUser')">
          {{ $t('users.addUser') }}
        </n-button>
      </n-space>
    </div>
  </div>
</template>
