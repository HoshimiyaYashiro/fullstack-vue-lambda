<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
});
</script>

<template>
  <span :class="['badge', `badge--${variant}`, `badge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  border-radius: var(--radius-full, 9999px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.badge--sm {
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
}

.badge--md {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.badge--primary {
  background-color: var(--color-primary-light, #eff6ff);
  color: var(--color-primary, #3b82f6);
}

.badge--success {
  background-color: var(--color-success-light, #ecfdf5);
  color: var(--color-success, #10b981);
}

.badge--warning {
  background-color: var(--color-warning-light, #fffbeb);
  color: var(--color-warning, #f59e0b);
}

.badge--danger {
  background-color: var(--color-danger-light, #fef2f2);
  color: var(--color-danger, #ef4444);
}

.badge--neutral {
  background-color: var(--color-surface-hover, #f1f5f9);
  color: var(--color-secondary, #64748b);
}
</style>
