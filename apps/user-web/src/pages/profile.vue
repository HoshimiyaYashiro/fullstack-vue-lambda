<script setup lang="ts">
import { updateUserProfileSchema } from '@repo/shared';
import { AppButton, AppCard, AppInput, NTag } from '@repo/ui';
import { ref } from 'vue';
import { useUserStore } from '../stores/user';

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
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <h1 class="page-title">Hồ Sơ Cá Nhân</h1>
        <NTag type="info" size="small" round>Route: /profile</NTag>
      </div>
      <p class="page-description">Quản lý thông tin cá nhân. Tự động ánh xạ từ file <code>src/pages/profile.vue</code>.</p>
    </div>

    <div style="max-width: 640px;">
      <AppCard title="Chỉnh Sửa Thông Tin" subtitle="Dữ liệu được validate bằng schema dùng chung @repo/shared">
        <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div v-if="successMsg" style="padding: 0.75rem 1rem; border-radius: var(--radius-md); background-color: var(--color-success-light); color: var(--color-success); font-weight: 500; font-size: 0.9rem;">
            {{ successMsg }}
          </div>

          <AppInput
            label="Họ và tên"
            v-model="fullName"
            :error="errors.fullName"
            placeholder="Nhập họ và tên"
            required
          />

          <AppInput
            label="Số điện thoại"
            v-model="phoneNumber"
            :error="errors.phoneNumber"
            placeholder="+84988888888"
          />

          <AppInput
            label="Phòng ban"
            v-model="department"
            :error="errors.department"
            placeholder="Ví dụ: Công nghệ thông tin"
          />

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem;">
            <router-link to="/" style="text-decoration: none;">
              <AppButton variant="secondary">Quay lại</AppButton>
            </router-link>
            <AppButton type="submit" variant="primary">Lưu Thay Đổi</AppButton>
          </div>
        </form>
      </AppCard>
    </div>
  </div>
</template>
