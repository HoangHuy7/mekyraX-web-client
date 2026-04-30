<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppPagination from '@/shared/components/common/AppPagination.vue';
import { auditLogService, type AuditLog } from '@/shared/graphql/auditLogService';

interface Props {
  entityType: string;
  entityId: string;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), { pageSize: 10 });
const { t } = useI18n();

const logs = ref<AuditLog[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(props.pageSize);

const fetchLogs = async (): Promise<void> => {
  if (!props.entityId) {
    return;
  }
  loading.value = true;
  try {
    const result = await auditLogService.fetch(
      { entityType: props.entityType, entityId: props.entityId },
      { page: currentPage.value, pageSize: pageSize.value }
    );
    logs.value = result.items;
    total.value = result.pageInfo.total;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLogs);
watch([() => props.entityId, currentPage, pageSize], fetchLogs);

const fmtDate = (d?: string): string => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const tagType = (action: string): 'success' | 'warning' | 'danger' | 'info' => {
  const a = action.toLowerCase();
  if (a.includes('create')) return 'success';
  if (a.includes('update')) return 'warning';
  if (a.includes('delete')) return 'danger';
  return 'info';
};
</script>

<template>
  <el-card shadow="never" class="logs-panel" v-loading="loading">
    <template #header>
      <div class="header">
        <span class="title">{{ t('logs.title') }}</span>
        <span class="count">{{ t('logs.totalEntries', { n: total }) }}</span>
      </div>
    </template>

    <el-empty v-if="!loading && logs.length === 0" :description="t('logs.empty')" />

    <el-timeline v-else class="timeline">
      <el-timeline-item
        v-for="log in logs"
        :key="log.id"
        :timestamp="fmtDate(log.createdAt)"
        :type="tagType(log.action)"
        placement="top"
      >
        <div class="log-row">
          <el-tag :type="tagType(log.action)" size="small" effect="plain">
            {{ log.action }}
          </el-tag>
          <span class="feature">{{ log.feature || log.entityType || '—' }}</span>
          <span v-if="log.createdBy" class="user">{{ log.createdBy }}</span>
        </div>
        <div v-if="log.newData || log.oldData" class="diff">
          <details>
            <summary>{{ t('logs.viewChanges') }}</summary>
            <div v-if="log.oldData" class="json">
              <span class="label">{{ t('logs.before') }}</span>
              <pre>{{ log.oldData }}</pre>
            </div>
            <div v-if="log.newData" class="json">
              <span class="label">{{ t('logs.after') }}</span>
              <pre>{{ log.newData }}</pre>
            </div>
          </details>
        </div>
      </el-timeline-item>
    </el-timeline>

    <AppPagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
    />
  </el-card>
</template>

<script lang="ts">
export default { name: 'AppLogsPanel' };
</script>

<style scoped>
.logs-panel { margin-top: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; }
.title { font-weight: 600; }
.count { color: var(--el-text-color-secondary); font-size: 13px; }
.timeline { padding-left: 6px; }
.log-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.feature { font-weight: 500; }
.user { color: var(--el-text-color-secondary); font-size: 12px; }
.diff { margin-top: 6px; font-size: 12px; }
.diff details summary { cursor: pointer; color: var(--el-color-primary); }
.json { margin-top: 4px; }
.json .label { color: var(--el-text-color-secondary); font-size: 11px; text-transform: uppercase; }
.json pre {
  margin: 4px 0;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}
</style>
