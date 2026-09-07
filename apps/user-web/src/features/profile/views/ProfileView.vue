<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <h1 class="page-title">{{ $t('profile.title') }}</h1>
        <n-tag type="info" size="small" round>{{ $t('profile.routeTag') }}</n-tag>
      </div>
      <p class="page-description">{{ $t('profile.description') }}</p>
    </div>

    <ProfileForm />
  </div>
</template>
