<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMenuStore } from '@/shared/store/menuStore';

defineOptions({ name: 'WelcomePage', componentName: 'WelcomePage' });

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const menuStore = useMenuStore();

const displayName = computed(() => {
  const u = authStore.user;
  return u?.displayName || u?.name || u?.id || '';
});

const hour = new Date().getHours();
const greeting = computed(() => {
  if (hour < 12) return t('welcome.morning');
  if (hour < 18) return t('welcome.afternoon');
  return t('welcome.evening');
});

// Top-level menu items (no children / has path) as quick access
const quickLinks = computed(() =>
  menuStore.visibleMenus
    .filter((m) => m.path)
    .slice(0, 6)
);

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <div class="welcome-page">
    <div class="welcome-card">
      <div class="welcome-icon">👋</div>
      <h1 class="welcome-greeting">{{ greeting }}, <span class="welcome-name">{{ displayName }}</span>!</h1>
      <p class="welcome-sub">{{ t('welcome.subtitle') }}</p>

      <div v-if="quickLinks.length" class="quick-links">
        <p class="quick-title">{{ t('welcome.quickAccess') }}</p>
        <div class="quick-grid">
          <el-card
            v-for="item in quickLinks"
            :key="item.id"
            shadow="hover"
            class="quick-item"
            @click="navigate(item.path!)"
          >
            <el-icon v-if="item.icon" class="quick-icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="quick-label">{{ item.label }}</span>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.welcome-card {
  text-align: center;
  max-width: 640px;
  width: 100%;
}

.welcome-icon {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 16px;
}

.welcome-greeting {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
}

.welcome-name {
  color: var(--el-color-primary);
}

.welcome-sub {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin: 0 0 32px;
}

.quick-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.quick-item {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px;
  transition: transform 0.15s;
}

.quick-item:hover {
  transform: translateY(-2px);
}

.quick-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.quick-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
}
</style>
