<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useTabStore } from '@/shared/store/tabStore';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTabs } from '@/shared/hooks/useTabs';
import { loadRuntimeConfig } from '@/shared/config/runtimeConfig';
import TabBar from '@/shared/components/tabs/TabBar.vue';
import SidebarMenu from '@/shared/components/menu/SidebarMenu.vue';
import {
  Moon,
  Sunny,
  Fold,
  Expand,
  SwitchButton,
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

const handleLogout = (): void => {
  authStore.logout();
  logout().then(()=>{
  })
};

const logout = async () => {
  const token = localStorage.getItem('casdoor_access_token')
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
  } catch (e) {
    console.error(e)
  } finally {
    localStorage.clear()
    router.push('/login')
  }
}

const changeLanguage = (value: string): void => {
  locale.value = value;
  language.value = value;
  localStorage.setItem('app_locale', value);
};
</script>

<template>
  <el-container class="admin-layout">
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
