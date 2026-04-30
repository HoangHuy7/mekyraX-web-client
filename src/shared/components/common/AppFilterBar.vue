<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Refresh, Search } from '@element-plus/icons-vue';

interface Props {
  total?: number;
  totalLabel?: string;
}

withDefaults(defineProps<Props>(), {
  total: 0,
});

const emit = defineEmits<{
  apply: [];
  reset: [];
}>();

const { t } = useI18n();

const onApply = (): void => emit('apply');
const onReset = (): void => emit('reset');
</script>

<template>
  <el-card shadow="never" class="filter-bar">
    <div class="filter-row">
      <slot />
      <div class="filter-actions">
        <el-button type="primary" :icon="Search" @click="onApply">
          {{ t('common.search') }}
        </el-button>
        <el-button :icon="Refresh" @click="onReset">{{ t('common.reset') }}</el-button>
      </div>
      <span v-if="total > 0" class="total-hint">
        {{ totalLabel || t('common.totalRecords') }}: <b>{{ total }}</b>
      </span>
    </div>
  </el-card>
</template>

<script lang="ts">
export default { name: 'AppFilterBar' };
</script>

<style scoped>
.filter-bar {
  margin-bottom: 16px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.total-hint {
  width: 100%;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
@media (min-width: 1280px) {
  .total-hint { width: auto; margin-left: 16px; }
}
</style>
