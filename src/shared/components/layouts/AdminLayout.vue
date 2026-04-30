<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTabStore } from '@/shared/store/tabStore';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTabs } from '@/shared/hooks/useTabs';
import { loadRuntimeConfig } from '@/shared/config/runtimeConfig';
import TabBar from '@/shared/components/tabs/TabBar.vue';
import SidebarMenu from '@/shared/components/menu/SidebarMenu.vue';
import ChangePasswordDialog from '@/shared/components/common/ChangePasswordDialog.vue';
import { adminService } from '@/features/admin/services/adminService';
import {
  Moon,
  Sunny,
  Fold,
  Expand,
  SwitchButton,
  Loading,
} from '@element-plus/icons-vue';

useTabs();

const route = useRoute();
const router = useRouter();
const tabStore = useTabStore();
const authStore = useAuthStore();
const { locale, t } = useI18n();

const isCollapse = ref(false);
const isDark = ref(false);
const language = ref(locale.value);

// Profile state — block layout until checked
const profileReady = ref(false);
const mustChangePwd = ref(false);

const languageOptions = computed(() => [
  { value: 'vi', label: t('common.vietnamese') },
  { value: 'en', label: t('common.english') },
]);

const cachedViews = computed(() => tabStore.cachedViews);

const toggleSidebar = (): void => {
  isCollapse.value = !isCollapse.value;
};

const toggleDarkMode = (value: boolean): void => {
  isDark.value = value;
  const html = document.documentElement;
  if (value) {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

const initDarkMode = (): void => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  if (shouldBeDark) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
};

initDarkMode();

// First: fetch myProfile only — if mustChangePassword show dialog and block rest
onMounted(async () => {
  try {
    const profile = await adminService.getMyProfile();
    mustChangePwd.value = profile.mustChangePassword;
  } catch {
    // ignore — user may not be in DB yet
  } finally {
    profileReady.value = true;
  }
});

// After password changed — reload page so everything re-fetches fresh
function onPasswordChanged() {
  window.location.reload();
}

const handleLogout = (): void => {
  authStore.logout();
  logout().then(() => {});
};

const logout = async () => {
  const token = localStorage.getItem('casdoor_access_token');
  let casdoorServerUrl = 'http://localhost:8000';
  try {
    const config = await loadRuntimeConfig();
    casdoorServerUrl = config.casdoorServerUrl;
  } catch {
    // use fallback
  }
  try {
    await fetch(`${casdoorServerUrl}/api/sso-logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
  } catch (e) {
    console.error(e);
  } finally {
    const preserved = ['app_setup_info'];
    const keysToRemove = Object.keys(localStorage).filter(k => !preserved.includes(k));
    keysToRemove.forEach(k => localStorage.removeItem(k));
    router.push('/login');
  }
};

const changeLanguage = (value: string): void => {
  locale.value = value;
  language.value = value;
  localStorage.setItem('app_locale', value);
};
</script>

<template>
  <!-- Loading profile check -->
  <div v-if="!profileReady" class="profile-loading">
    <el-icon class="spin" :size="40"><Loading /></el-icon>
  </div>

  <!-- Force password change — render nothing else -->
  <div v-else-if="mustChangePwd" class="profile-loading">
    <ChangePasswordDialog :model-value="true" @changed="onPasswordChanged" />
  </div>

  <!-- Normal layout -->
  <el-container v-else class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">Admin</span>
        <span v-else>A</span>
      </div>
      <SidebarMenu :collapse="isCollapse" />
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="header-right">
          <el-select
            v-model="language"
            class="language-select"
            size="small"
            @change="changeLanguage"
          >
            <el-option
              v-for="item in languageOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-switch
            v-model="isDark"
            active-text="Dark"
            inactive-text="Light"
            :active-icon="Moon"
            :inactive-icon="Sunny"
            inline-prompt
            @update:model-value="toggleDarkMode"
          />
          <el-button
            type="danger"
            :icon="SwitchButton"
            circle
            size="small"
            title="Logout"
            @click="handleLogout"
          />
        </div>
      </el-header>

      <TabBar />

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100vw;
}

.profile-loading {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page);
}

.spin {
  animation: spin 1s linear infinite;
  color: var(--el-color-primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color-light);
}

.main-container {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: var(--el-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.language-select {
  width: 140px;
}

.main-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background-color: var(--el-bg-color-page);
}
</style>
