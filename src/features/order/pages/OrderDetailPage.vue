<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Printer } from '@element-plus/icons-vue';
import { orderService } from '@/features/order/services/orderService';
import type { Order } from '@/features/order/types/order.types';
import AppDetailHeader from '@/shared/components/common/AppDetailHeader.vue';
import AppLogsPanel from '@/shared/components/common/AppLogsPanel.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';
import { deviceBus } from '@/shared/devices/deviceBus';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const order = ref<Order | null>(null);
const loading = ref(true);
const status = ref('');
const saving = ref(false);
const tab = ref<'items' | 'logs'>('items');

const orderId = computed<string>(() => String(route.params.id || ''));

onMounted(async () => {
  if (!orderId.value) {
    router.push('/orders');
    return;
  }
  try {
    const data = await orderService.getOrderById(orderId.value);
    if (!data) {
      router.push('/orders');
      return;
    }
    order.value = data;
    status.value = data.status;
  } finally {
    loading.value = false;
  }
});

const back = (): void => { router.push('/orders'); };

const saveStatus = async (): Promise<void> => {
  if (!order.value) return;
  saving.value = true;
  try {
    order.value = await orderService.updateOrder(order.value.id, { status: status.value });
    ElMessage.success(t('orders.orderStatusUpdated'));
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('orders.updateFailed'));
  } finally {
    saving.value = false;
  }
};

const print = async (): Promise<void> => {
  if (!order.value) return;
  await deviceBus.printReceipt({ orderId: order.value.id });
  ElMessage.success(t('orders.printReceipt'));
};

const fmtDate = (s?: string): string => (s
  ? new Date(s).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  : '—');

const statusType = (s: string): 'success' | 'danger' | 'primary' | 'warning' | 'info' => {
  if (s === 'paid') return 'success';
  if (s === 'debt') return 'danger';
  if (s === 'delivery') return 'primary';
  if (s === 'pending') return 'warning';
  return 'info';
};

const statusLabel = (s: string): string => {
  const map: Record<string, string> = {
    paid: t('orders.paid'),
    debt: t('orders.debt'),
    delivery: t('orders.delivery'),
    pending: t('orders.pending'),
    cancelled: t('orders.cancelled'),
  };
  return map[s] || s;
};
</script>

<template>
  <div class="order-detail-page" v-loading="loading">
    <AppDetailHeader
      :title="order?.code || t('orders.orderDetail')"
      :subtitle="order?.customer?.name || t('orders.walkInCustomer')"
      @back="back"
    >
      <template #actions>
        <el-tag v-if="order" :type="statusType(order.status)" size="large">
          {{ statusLabel(order.status) }}
        </el-tag>
        <el-button :icon="Printer" @click="print">{{ t('orders.printReceipt') }}</el-button>
      </template>
    </AppDetailHeader>

    <el-empty v-if="!loading && !order" :description="t('orders.orderNotFound')" />

    <template v-if="order">
      <el-row :gutter="16" class="stats-row">
        <el-col :xs="24" :sm="8">
          <el-card shadow="never" class="stat-card">
            <div class="stat-label">{{ t('orders.totalAmount') }}</div>
            <div class="stat-value">{{ formatCurrencyVnd(order.totalAmount) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-card shadow="never" class="stat-card">
            <div class="stat-label">{{ t('orders.paidAmount') }}</div>
            <div class="stat-value paid">{{ formatCurrencyVnd(order.paidAmount) }}</div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-card shadow="never" class="stat-card">
            <div class="stat-label">{{ t('orders.debtAmountLabel') }}</div>
            <div class="stat-value" :class="{ debt: order.debtAmount > 0 }">
              {{ formatCurrencyVnd(order.debtAmount) }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="info-card">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('orders.orderCode')">{{ order.code || order.id }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.createdAt')">{{ fmtDate(order.createdAt) }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.customer')">
            {{ order.customer?.name || t('orders.walkInCustomer') }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('common.status')">
            <div class="status-edit">
              <el-select v-model="status" size="small" style="width:160px">
                <el-option :label="t('orders.paid')" value="paid" />
                <el-option :label="t('orders.debt')" value="debt" />
                <el-option :label="t('orders.delivery')" value="delivery" />
                <el-option :label="t('orders.pending')" value="pending" />
                <el-option :label="t('orders.cancelled')" value="cancelled" />
              </el-select>
              <el-button size="small" type="primary" :loading="saving" @click="saveStatus">
                {{ t('orders.saveStatus') }}
              </el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="order.note" :label="t('orderWorkspace.note')" :span="2">
            {{ order.note }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="tabs-card">
        <el-tabs v-model="tab">
          <el-tab-pane :label="t('orders.tabItems')" name="items">
            <el-table :data="order.items" stripe style="width: 100%">
              <el-table-column prop="productName" :label="t('orders.product')" min-width="240" />
              <el-table-column prop="quantity" :label="t('orders.qty')" width="100" align="right" />
              <el-table-column :label="t('products.price')" width="140" align="right">
                <template #default="{ row }">{{ formatCurrencyVnd(row.price) }}</template>
              </el-table-column>
              <el-table-column :label="t('orders.total')" width="140" align="right">
                <template #default="{ row }"><b>{{ formatCurrencyVnd(row.total) }}</b></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane :label="t('orders.tabLogs')" name="logs" lazy>
            <AppLogsPanel entity-type="order" :entity-id="order.id" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
  </div>
</template>

<script lang="ts">
export default { name: 'OrderDetailPage' };
</script>

<style scoped>
.order-detail-page { padding: 8px; }
.stats-row { margin-bottom: 16px; }
.stat-card { text-align: center; }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; }
.stat-value.paid { color: var(--el-color-success); }
.stat-value.debt { color: var(--el-color-danger); }
.info-card { margin-bottom: 16px; }
.tabs-card {}
.status-edit { display: flex; gap: 8px; align-items: center; }
</style>
