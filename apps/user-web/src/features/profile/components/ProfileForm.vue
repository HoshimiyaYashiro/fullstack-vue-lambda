<script setup lang="ts">
import { updateUserProfileSchema } from '@repo/shared';
import { AppButton, AppCard, AppInput } from '@repo/ui';
import { ref } from 'vue';
import { useUserStore } from '../../../stores/user';

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
  successMsg.value = 'Hồ sơ đã được cập nhật thành công (đồng bộ validation Zod)!';
}
</script>

<template>
  <div style="max-width: 640px;">
    <AppCard title="Chỉnh Sửa Thông Tin" subtitle="Dữ liệu được validate bằng schema dùng chung @repo/shared">
      <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div v-if="successMsg" style="padding: 0.75rem 1rem; border-radius: var(--radius-md); background-color: var(--color-success-light); color: var(--color-success); font-weight: 500; font-size: 0.9rem;">
          {{ successMsg }}
        </div>

        <AppInput
          label="Họ và tên"
          v-model="fullName"
          placeholder="Nhập họ và tên..."
          :error="errors.fullName"
          required
        />

        <AppInput
          label="Số điện thoại"
          v-model="phoneNumber"
          placeholder="+84..."
          :error="errors.phoneNumber"
        />

        <AppInput
          label="Phòng ban"
          v-model="department"
          placeholder="Tên phòng ban..."
          :error="errors.department"
        />

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem;">
          <router-link to="/" style="text-decoration: none;">
            <AppButton variant="secondary" type="button">Quay Lại</AppButton>
          </router-link>
          <AppButton variant="primary" type="submit">Lưu Thay Đổi</AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
