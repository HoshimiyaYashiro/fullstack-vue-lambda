<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
});

defineEmits<(e: 'click', event: MouseEvent) => void>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner"></span>
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  border: 1px solid transparent;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.btn--md {
  padding: 0.55rem 1.15rem;
  font-size: 0.95rem;
}

.btn--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.05rem;
}

.btn--primary {
  background-color: var(--color-primary, #3b82f6);
  color: #ffffff;
}

.btn--primary:not(:disabled):hover {
  background-color: var(--color-primary-hover, #2563eb);
}

.btn--secondary {
  background-color: var(--color-secondary-light, #f1f5f9);
  color: var(--color-text-main, #0f172a);
  border-color: var(--color-border, #cbd5e1);
}

.btn--secondary:not(:disabled):hover {
  background-color: #e2e8f0;
}

.btn--danger {
  background-color: var(--color-danger, #ef4444);
  color: #ffffff;
}

.btn--danger:not(:disabled):hover {
  background-color: var(--color-danger-hover, #dc2626);
}

.btn--outline {
  background-color: transparent;
  border-color: var(--color-border, #cbd5e1);
  color: var(--color-text-main, #0f172a);
}

.btn--outline:not(:disabled):hover {
  background-color: var(--color-surface-hover, #f8fafc);
  border-color: var(--color-primary, #3b82f6);
}

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
