<script setup lang="ts">
import { NButton, NCard, NResult } from '@repo/ui';
</script>

<template>
  <div style="max-width: 600px; margin: 4rem auto;">
    <NCard hoverable>
      <NResult
        status="404"
        title="404 - Trang Không Tồn Tại"
        description="Đường dẫn quản trị bạn yêu cầu không tồn tại."
      >
        <template #footer>
          <router-link to="/" style="text-decoration: none;">
            <NButton type="primary">Trở Về Bảng Điều Khiển</NButton>
          </router-link>
        </template>
      </NResult>
    </NCard>
  </div>
</template>
