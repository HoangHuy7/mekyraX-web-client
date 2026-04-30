<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMenuStore } from '@/shared/store/menuStore';

defineOptions({ name: 'ForbiddenPage' });

const router = useRouter();
const { t } = useI18n();
const menuStore = useMenuStore();

function goHome() {
  const firstPath = menuStore.menuPaths[0] || '/login';
  router.push(firstPath);
}
</script>

<template>
  <div class="forbidden-page">
    <div class="forbidden-content">
      <div class="forbidden-code">403</div>
      <h2 class="forbidden-title">{{ t('common.forbidden') }}</h2>
      <p class="forbidden-sub">{{ t('common.forbiddenDesc') }}</p>
      <el-button type="primary" @click="goHome">{{ t('common.goHome') }}</el-button>
    </div>
  </div>
</template>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page);
}
.forbidden-content {
  text-align: center;
  padding: 40px;
}
.forbidden-code {
  font-size: 96px;
  font-weight: 800;
  color: var(--el-color-danger);
  line-height: 1;
  margin-bottom: 16px;
}
.forbidden-title {
  font-size: 24px;
  margin: 0 0 8px;
}
.forbidden-sub {
  color: var(--el-text-color-secondary);
  margin: 0 0 24px;
}
</style>
