<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

withDefaults(defineProps<Props>(), { showBack: true });

const emit = defineEmits<{
  back: [];
}>();
</script>

<template>
  <div class="detail-header">
    <div class="header-left">
      <el-button v-if="showBack" :icon="ArrowLeft" circle @click="emit('back')" />
      <div class="title-block">
        <h1 class="title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div class="header-right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'AppDetailHeader' };
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}
.title-block { min-width: 0; }
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.subtitle {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
