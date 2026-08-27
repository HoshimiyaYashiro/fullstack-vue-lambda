<script setup lang="ts">
import { AppButton, AppConfigProvider, AppNavbar } from '@repo/ui';
import { useUserStore } from './stores/user';

const userStore = useUserStore();
</script>

<template>
  <AppConfigProvider>
    <div class="app-layout">
      <AppNavbar appName="Enterprise One" portalType="User Portal">
        <template #nav>
          <router-link to="/" class="nav-link">Trang Chủ</router-link>
          <router-link to="/profile" class="nav-link">Hồ Sơ</router-link>
        </template>

        <template #actions>
          <div style="font-size: 0.85rem; font-weight: 500;">{{ userStore.profile?.fullName }}</div>
          <AppButton variant="outline" size="sm">Đăng Xuất</AppButton>
        </template>
      </AppNavbar>

      <main class="app-content">
        <router-view />
      </main>
    </div>
  </AppConfigProvider>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
}
</style>
