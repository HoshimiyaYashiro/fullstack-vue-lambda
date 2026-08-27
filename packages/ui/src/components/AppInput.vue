<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  type: 'text',
  error: '',
  disabled: false,
  required: false,
});

defineEmits<(e: 'update:modelValue', value: string) => void>();
</script>

<template>
  <div class="input-group">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['input-field', { 'input-field--error': !!error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-main, #0f172a);
}

.required {
  color: var(--color-danger, #ef4444);
}

.input-field {
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-border, #cbd5e1);
  background-color: var(--color-surface, #ffffff);
  font-size: 0.95rem;
  color: var(--color-text-main, #0f172a);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field:focus {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px var(--color-primary-light, #eff6ff);
}

.input-field--error {
  border-color: var(--color-danger, #ef4444);
}

.input-field--error:focus {
  border-color: var(--color-danger, #ef4444);
  box-shadow: 0 0 0 3px var(--color-danger-light, #fef2f2);
}

.input-field:disabled {
  background-color: var(--color-surface-hover, #f1f5f9);
  cursor: not-allowed;
}

.input-error {
  font-size: 0.8rem;
  color: var(--color-danger, #ef4444);
}
</style>
