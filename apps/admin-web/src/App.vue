<script setup lang="ts">
import { AppBadge, AppButton, AppConfigProvider, AppNavbar } from '@repo/ui';
</script>

<template>
  <AppConfigProvider>
    <div class="admin-layout">
      <AppNavbar appName="Enterprise One" portalType="Admin Portal">
        <template #actions>
          <AppBadge variant="danger">Super Admin</AppBadge>
          <AppButton variant="outline" size="sm">Đăng Xuất</AppButton>
        </template>
      </AppNavbar>

      <div class="admin-container">
        <aside class="admin-sidebar">
          <router-link to="/" class="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </router-link>

          <router-link to="/users" class="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Quản Lý Users
          </router-link>
        </aside>

        <main class="admin-main">
          <router-view />
        </main>
      </div>
    </div>
  </AppConfigProvider>
</template>
