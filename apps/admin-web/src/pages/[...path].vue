<template>
  <div style="max-width: 600px; margin: 4rem auto;">
    <NCard hoverable>
      <NResult
        status="404"
        :title="$t('notFound.title')"
        :description="$t('notFound.description')"
      >
        <template #footer>
          <router-link to="/" style="text-decoration: none;">
            <NButton type="primary">{{ $t('notFound.backHome') }}</NButton>
          </router-link>
        </template>
      </NResult>
    </NCard>
  </div>
</template>
