import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TabItem } from '@/shared/types/common.types';

const DASHBOARD_PATH = '/dashboard';
const DASHBOARD_TAB: TabItem = {
  path: DASHBOARD_PATH,
  title: 'Dashboard',
  name: 'Dashboard',
  closable: false,
};

export const useTabStore = defineStore('tab', () => {
  const tabs = ref<TabItem[]>([DASHBOARD_TAB]);
  const activeTabPath = ref<string>(DASHBOARD_PATH);

  const cachedViews = computed<string[]>(() => {
    return tabs.value.map((tab) => tab.name);
  });

  const hasTab = (path: string): boolean => {
    return tabs.value.some((tab) => tab.path === path);
  };

  const addTab = (tab: TabItem): void => {
    if (!hasTab(tab.path)) {
      tabs.value.push(tab);
    }
    activeTabPath.value = tab.path;
  };

  const removeTab = (path: string): void => {
    if (path === DASHBOARD_PATH) {
      return;
    }

    const index = tabs.value.findIndex((tab) => tab.path === path);
    if (index === -1) {
      return;
    }

    tabs.value.splice(index, 1);

    if (activeTabPath.value === path) {
      const prevTab = tabs.value[index - 1] || tabs.value[0];
      activeTabPath.value = prevTab.path;
    }
  };

  const setActiveTab = (path: string): void => {
    if (hasTab(path)) {
      activeTabPath.value = path;
    }
  };

  const closeOtherTabs = (path: string): void => {
    const targetTab = tabs.value.find((tab) => tab.path === path);
    if (!targetTab) {
      return;
    }

    tabs.value = [DASHBOARD_TAB];
    if (path !== DASHBOARD_PATH) {
      tabs.value.push(targetTab);
    }
    activeTabPath.value = path;
  };

  const closeAllTabs = (): void => {
    tabs.value = [DASHBOARD_TAB];
    activeTabPath.value = DASHBOARD_PATH;
  };

  const restoreTabs = (savedTabs: TabItem[], activePath: string): void => {
    const dashboardExists = savedTabs.some((tab) => tab.path === DASHBOARD_PATH);
    if (!dashboardExists) {
      savedTabs.unshift(DASHBOARD_TAB);
    }

    tabs.value = savedTabs.map((tab) => ({
      ...tab,
      closable: tab.path !== DASHBOARD_PATH,
    }));
    activeTabPath.value = activePath || DASHBOARD_PATH;
  };

  return {
    tabs,
    activeTabPath,
    cachedViews,
    hasTab,
    addTab,
    removeTab,
    setActiveTab,
    closeOtherTabs,
    closeAllTabs,
    restoreTabs,
  };
}, {
  persist: {
    key: 'admin-tabs',
    pick: ['tabs', 'activeTabPath'],
  },
});
