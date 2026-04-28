<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTabStore } from '@/shared/store/tabStore';
import { Close, ArrowDown } from '@element-plus/icons-vue';

const tabStore = useTabStore();
const { t } = useI18n();

const tabs = computed(() => tabStore.tabs);
const activeTabPath = computed(() => tabStore.activeTabPath);

const handleTabClick = (path: string): void => {
  tabStore.setActiveTab(path);
};

const handleCloseTab = (event: MouseEvent, path: string): void => {
  event.stopPropagation();
  tabStore.removeTab(path);
};

const handleContextMenu = (event: MouseEvent, _path: string): void => {
  event.preventDefault();
};

const closeOtherTabs = (): void => {
  tabStore.closeOtherTabs(activeTabPath.value);
};

const closeAllTabs = (): void => {
  tabStore.closeAllTabs();
};
</script>

<template>
  <div class="tab-bar">
    <el-dropdown trigger="click" class="tab-actions-dropdown">
      <el-button text size="small">
        {{ t('common.tabOptions') }}
        <el-icon><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="closeOtherTabs">
            {{ t('common.closeOthers') }}
          </el-dropdown-item>
          <el-dropdown-item @click="closeAllTabs">
            {{ t('common.closeAll') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="tab-item"
      :class="{ active: activeTabPath === tab.path }"
      @click="handleTabClick(tab.path)"
      @contextmenu="handleContextMenu($event, tab.path)"
    >
      <span class="tab-title">{{ tab.title }}</span>
      <el-icon
        v-if="tab.closable"
        class="tab-close"
        @click="handleCloseTab($event, tab.path)"
      >
        <Close />
      </el-icon>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 4px 8px 0;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tab-actions-dropdown {
  flex-shrink: 0;
}

.tab-bar::-webkit-scrollbar {
  height: 4px;
}

.tab-bar::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 2px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
  min-width: 100px;
  max-width: 200px;
}

.tab-item:hover {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.tab-item.active {
  background-color: var(--el-bg-color);
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-bg-color);
  margin-bottom: -1px;
  font-weight: 500;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.tab-close:hover {
  background-color: var(--el-color-danger-light);
  color: var(--el-color-danger);
}
</style>
