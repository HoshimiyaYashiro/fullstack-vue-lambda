<script setup lang="ts">
import ProfileForm from '../components/ProfileForm.vue';
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <h1 class="page-title">Hồ Sơ Cá Nhân</h1>
        <n-tag type="info" size="small" round>Route: /profile</n-tag>
      </div>
      <p class="page-description">Quản lý thông tin cá nhân. Tự động ánh xạ từ file <code>src/pages/profile.vue</code>.</p>
    </div>

    <ProfileForm />
  </div>
</template>
