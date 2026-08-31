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
          <h1 class="page-title">Quản Lý Người Dùng</h1>
          <n-tag type="info" size="small" round>Route: /users (File-based)</n-tag>
        </div>
        <p class="page-description">Tự động ánh xạ từ <code>src/pages/users.vue</code> với Naive UI NDataTable.</p>
      </div>
      <n-space>
        <n-button secondary size="small" :loading="isLoading" @click="$emit('refresh')">
          Làm Mới
        </n-button>
        <n-button type="primary" size="small" @click="$emit('addUser')">
          + Thêm Người Dùng
        </n-button>
      </n-space>
    </div>
  </div>
</template>
