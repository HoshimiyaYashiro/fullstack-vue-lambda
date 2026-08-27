<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string;
  bordered?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  bordered: true,
});
</script>

<template>
  <div :class="['card', { 'card--bordered': bordered }]">
    <div v-if="title || $slots.header" class="card__header">
      <slot name="header">
        <div>
          <h3 class="card__title">{{ title }}</h3>
          <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="card__actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--color-surface, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card--bordered {
  border: 1px solid var(--color-border, #e2e8f0);
}

.card__header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.card__title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text-main, #0f172a);
}

.card__subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted, #64748b);
  margin-top: 0.25rem;
}

.card__body {
  padding: 1.5rem;
  flex: 1;
}

.card__footer {
  padding: 1rem 1.5rem;
  background-color: var(--color-surface-hover, #f8fafc);
  border-top: 1px solid var(--color-border, #f1f5f9);
}
</style>
