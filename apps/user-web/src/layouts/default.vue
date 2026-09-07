<script setup lang="ts">
const userStore = useUserStore();
const { locale } = useI18n();

function toggleLocale() {
  locale.value = locale.value === 'vi' ? 'en' : 'vi';
}
</script>

<template>
  <div class="app-layout">
    <AppNavbar :appName="$t('portal.appName')" :portalType="$t('portal.type')">
      <template #nav>
        <router-link to="/" class="nav-link">{{ $t('nav.home') }}</router-link>
        <router-link to="/profile" class="nav-link">{{ $t('nav.profile') }}</router-link>
      </template>

      <template #actions>
        <div style="font-size: 0.85rem; font-weight: 500;">{{ userStore.profile?.fullName }}</div>
        <AppButton variant="outline" size="sm" @click="toggleLocale">
          {{ locale === 'vi' ? 'EN' : 'VI' }} TEST
        </AppButton>
        <AppButton variant="outline" size="sm">{{ $t('actions.logout') }}</AppButton>
      </template>
    </AppNavbar>

    <main class="app-content">
      <router-view />
    </main>
  </div>
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
