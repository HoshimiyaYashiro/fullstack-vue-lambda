<script setup lang="ts">
import { NButton, NCard, NResult } from '@repo/ui';
</script>

<template>
  <div class="page-container" style="max-width: 600px; margin-top: 4rem;">
    <NCard hoverable>
      <NResult
        status="404"
        title="404 - Không Tìm Thấy Trang"
        description="Đường dẫn bạn yêu cầu không tồn tại trên hệ thống."
      >
        <template #footer>
          <router-link to="/" style="text-decoration: none;">
            <NButton type="primary">Trở Về Trang Chủ</NButton>
          </router-link>
        </template>
      </NResult>
    </NCard>
  </div>
</template>
