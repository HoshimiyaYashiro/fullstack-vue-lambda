<script setup lang="ts">
import { updateUserProfileSchema } from '@repo/shared';

const { t } = useI18n();
const userStore = useUserStore();

const fullName = ref(userStore.profile?.fullName || '');
const phoneNumber = ref(userStore.profile?.phoneNumber || '');
const department = ref(userStore.profile?.department || '');
const errors = ref<Record<string, string>>({});
const successMsg = ref('');

function handleSubmit() {
  errors.value = {};
  successMsg.value = '';

  const validation = updateUserProfileSchema.safeParse({
    fullName: fullName.value,
    phoneNumber: phoneNumber.value,
    department: department.value,
  });

  if (!validation.success) {
    for (const err of validation.error.errors) {
      const field = err.path[0] as string;
      errors.value[field] = err.message;
    }
    return;
  }

  if (userStore.profile) {
    userStore.profile.fullName = fullName.value;
    userStore.profile.phoneNumber = phoneNumber.value;
    userStore.profile.department = department.value;
  }
  successMsg.value = t('profile.success');
}
</script>

<template>
  <div style="max-width: 640px;">
    <AppCard :title="$t('profile.editTitle')" :subtitle="$t('profile.editSubtitle')">
      <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div v-if="successMsg" style="padding: 0.75rem 1rem; border-radius: var(--radius-md); background-color: var(--color-success-light); color: var(--color-success); font-weight: 500; font-size: 0.9rem;">
          {{ successMsg }}
        </div>

        <AppInput
          :label="$t('profile.fullNameLabel')"
          v-model="fullName"
          :placeholder="$t('profile.fullNamePlaceholder')"
          :error="errors.fullName"
          required
        />

        <AppInput
          :label="$t('profile.phoneLabel')"
          v-model="phoneNumber"
          :placeholder="$t('profile.phonePlaceholder')"
          :error="errors.phoneNumber"
        />

        <AppInput
          :label="$t('profile.departmentLabel')"
          v-model="department"
          :placeholder="$t('profile.departmentPlaceholder')"
          :error="errors.department"
        />

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
          <router-link to="/" style="text-decoration: none;">
            <AppButton variant="secondary" type="button">{{ $t('profile.back') }}</AppButton>
          </router-link>
          <AppButton variant="primary" type="submit">{{ $t('profile.saveChanges') }}</AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
