import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { TabItem } from '@/shared/types/common.types';

export const useTabStore = defineStore('tab', () => {
  const tabs = ref<TabItem[]>([]);
  const activeTabPath = ref<string>('/');

  const cachedViews = computed<string[]>(() => {
    return tabs.value
      .map((tab) => tab.componentName || tab.name)
      .filter(Boolean);
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
    const index = tabs.value.findIndex((tab) => tab.path === path);
    if (index === -1) return;

    tabs.value.splice(index, 1);

    if (activeTabPath.value === path) {
      const prevTab = tabs.value[index - 1] || tabs.value[0];
      activeTabPath.value = prevTab ? prevTab.path : '/';
    }
  };

  const setActiveTab = (path: string): void => {
    if (hasTab(path)) {
      activeTabPath.value = path;
    }
  };

  const closeOtherTabs = (path: string): void => {
    const targetTab = tabs.value.find((tab) => tab.path === path);
    tabs.value = targetTab ? [targetTab] : [];
    activeTabPath.value = targetTab ? path : '/';
  };

  const closeAllTabs = (): void => {
    tabs.value = [];
    activeTabPath.value = '/';
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
  };
});

