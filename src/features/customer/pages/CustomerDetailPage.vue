<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Edit, Phone, Message, Location, CreditCard } from '@element-plus/icons-vue';
import { customerService } from '@/features/customer/services/customerService';
import type { Customer } from '@/features/customer/types/customer.types';
import AppDetailHeader from '@/shared/components/common/AppDetailHeader.vue';
import AppLogsPanel from '@/shared/components/common/AppLogsPanel.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const customer = ref<Customer | null>(null);
const loading = ref(false);
const tab = ref<'info' | 'logs'>('info');

const customerId = computed(() => String(route.params.id || ''));

const load = async (): Promise<void> => {
  loading.value = true;
  try {
    customer.value = await customerService.getCustomerById(customerId.value);
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const back = (): void => {
  router.push('/customers');
};

const initial = computed<string>(() => {
  const n = customer.value?.name || '';
  return n.trim().slice(0, 1).toUpperCase() || '?';
});

const fmtDate = (s?: string): string => (s ? new Date(s).toLocaleString('vi-VN') : '—');
</script>

<template>
  <div class="customer-detail-page" v-loading="loading">
    <AppDetailHeader
      :title="customer?.name || t('customers.customerDetail')"
      :subtitle="customer?.phone || t('customers.customerProfile')"
      @back="back"
    >
      <template #actions>
        <el-button :icon="Edit" type="primary">{{ t('common.edit') }}</el-button>
      </template>
    </AppDetailHeader>

    <el-empty v-if="!loading && !customer" :description="t('customers.customerNotFound')" />

    <template v-if="customer">
      <el-row :gutter="16" class="hero-row">
        <el-col :xs="24" :md="8">
          <el-card shadow="never" class="hero-card">
            <div class="avatar-wrap">
              <el-avatar v-if="customer.imgUrl" :src="customer.imgUrl" :size="96" />
              <el-avatar v-else :size="96">{{ initial }}</el-avatar>
            </div>
            <h2 class="hero-name">{{ customer.name }}</h2>
            <div class="hero-meta">
              <div v-if="customer.phone"><el-icon><Phone /></el-icon> {{ customer.phone }}</div>
              <div v-if="customer.email"><el-icon><Message /></el-icon> {{ customer.email }}</div>
              <div v-if="customer.idCard"><el-icon><CreditCard /></el-icon> {{ customer.idCard }}</div>
              <div v-if="customer.address"><el-icon><Location /></el-icon> {{ customer.address }}</div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="16">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-card shadow="never" class="stat-card">
                <div class="stat-label">{{ t('customers.totalDebt') }}</div>
                <div class="stat-value" :class="{ 'has-debt': customer.totalDebt > 0 }">
                  {{ formatCurrencyVnd(customer.totalDebt) }}
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="stat-card">
                <div class="stat-label">{{ t('customers.createdAt') }}</div>
                <div class="stat-value-sm">{{ fmtDate(customer.createdAt) }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" class="tabs-card">
            <el-tabs v-model="tab">
              <el-tab-pane :label="t('customers.tabInfo')" name="info">
                <el-descriptions :column="2" border>
                  <el-descriptions-item :label="t('customers.name')">{{ customer.name }}</el-descriptions-item>
                  <el-descriptions-item :label="t('customers.phone')">{{ customer.phone || '—' }}</el-descriptions-item>
                  <el-descriptions-item :label="t('customers.email')">{{ customer.email || '—' }}</el-descriptions-item>
                  <el-descriptions-item :label="t('customers.idCard')">{{ customer.idCard || '—' }}</el-descriptions-item>
                  <el-descriptions-item :label="t('customers.address')" :span="2">{{ customer.address || '—' }}</el-descriptions-item>
                  <el-descriptions-item :label="t('customers.note')" :span="2">{{ customer.note || '—' }}</el-descriptions-item>
                  <el-descriptions-item :label="t('customers.updatedAt')">{{ fmtDate(customer.updatedAt) }}</el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
              <el-tab-pane :label="t('customers.tabLogs')" name="logs" lazy>
                <AppLogsPanel entity-type="customer" :entity-id="customer.id" />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script lang="ts">
export default { name: 'CustomerDetailPage' };
</script>

<style scoped>
.customer-detail-page { padding: 8px; }
.hero-row { margin-bottom: 16px; }
.hero-card { text-align: center; }
.avatar-wrap { display: flex; justify-content: center; margin-bottom: 12px; }
.hero-name { margin: 0 0 12px; font-size: 20px; font-weight: 600; }
.hero-meta { text-align: left; display: flex; flex-direction: column; gap: 8px; color: var(--el-text-color-regular); font-size: 14px; }
.hero-meta div { display: flex; align-items: center; gap: 8px; }
.stat-card { margin-bottom: 16px; }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.stat-value { font-size: 22px; font-weight: 600; }
.stat-value.has-debt { color: var(--el-color-danger); }
.stat-value-sm { font-size: 14px; color: var(--el-text-color-primary); }
.tabs-card { margin-top: 0; }
</style>
