<script setup lang="ts">
interface Props {
  appName: string;
  portalType?: string;
}

withDefaults(defineProps<Props>(), {
  portalType: 'User Portal',
});
</script>

<template>
  <header class="navbar">
    <div class="navbar__container">
      <div class="navbar__brand">
        <div class="navbar__logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="navbar__info">
          <span class="navbar__title">{{ appName }}</span>
          <span class="navbar__portal-badge">{{ portalType }}</span>
        </div>
      </div>

      <nav class="navbar__nav">
        <slot name="nav" />
      </nav>

      <div class="navbar__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background-color: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar__container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.navbar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.navbar__logo {
  color: var(--color-primary, #3b82f6);
  display: flex;
  align-items: center;
}

.navbar__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar__title {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--color-text-main, #0f172a);
}

.navbar__portal-badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm, 4px);
  background-color: var(--color-surface-hover, #f1f5f9);
  color: var(--color-text-muted, #64748b);
  font-weight: 500;
}

.navbar__nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
