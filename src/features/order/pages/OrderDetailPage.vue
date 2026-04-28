<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { orderService } from '@/features/order/services/orderService';
import type { Order } from '@/features/order/types/order.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const order = ref<Order | null>(null);
const loading = ref(true);
const status = ref('');
const saving = ref(false);

onMounted(async () => {
  const id = String(route.params.id || '');
  if (!id) {
    router.push('/orders');
    return;
  }

  loading.value = true;
  const data = await orderService.getOrderById(id);
  if (!data) {
    router.push('/orders');
    return;
  }
  order.value = data;
  status.value = data.status;
  loading.value = false;
});

const goBack = (): void => {
  router.push('/orders');
};

const saveStatus = async (): Promise<void> => {
  if (!order.value) {
    return;
  }

  saving.value = true;
  try {
    const updated = await orderService.updateOrder(order.value.id, { status: status.value });
    order.value = updated;
    ElMessage.success(t('orders.orderStatusUpdated'));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('orders.updateFailed'));
  } finally {
    saving.value = false;
  }
};

const formatCurrency = (value: number): string =>
  formatCurrencyVnd(value);

const formatDate = (value?: string): string => {
  if (!value) {
    return t('common.notAvailable');
  }
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <div class="order-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" />
        <div>
          <h1 class="page-title">{{ t('orders.orderDetail') }}</h1>
          <p class="page-subtitle">{{ t('orders.orderReviewSubtitle') }}</p>
        </div>
      </div>
    </div>

    <el-card v-loading="loading" shadow="hover">
      <template v-if="order">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('orders.orderCode')">
            {{ order.code || order.id }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('orders.customer')">
            {{ order.customer?.name || t('orders.walkInCustomer') }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('orders.totalAmount')">
            {{ formatCurrency(order.totalAmount) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('orders.paidAmount')">
            {{ formatCurrency(order.paidAmount) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('orders.debtAmountLabel')">
            {{ formatCurrency(order.debtAmount) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('orders.createdAt')">
            {{ formatDate(order.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="status-editor">
          <el-select v-model="status" :placeholder="t('orders.orderStatus')">
            <el-option :label="t('orders.paid')" value="paid" />
            <el-option :label="t('orders.debt')" value="debt" />
            <el-option :label="t('orders.delivery')" value="delivery" />
          </el-select>
          <el-button type="primary" :loading="saving" @click="saveStatus">
            {{ t('orders.saveStatus') }}
          </el-button>
        </div>

        <el-divider />

        <el-table :data="order.items" stripe style="width: 100%">
          <el-table-column prop="productName" :label="t('orders.product')" min-width="220" />
          <el-table-column prop="quantity" :label="t('orders.qty')" width="100" />
          <el-table-column :label="t('products.price')" width="140">
            <template #default="{ row }">
              {{ formatCurrency(row.price) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('orders.total')" width="140">
            <template #default="{ row }">
              {{ formatCurrency(row.total) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else :description="t('orders.orderNotFound')" />
    </el-card>
  </div>
</template>

<script lang="ts">
export default {
  name: 'OrderDetailPage',
};
</script>

<style scoped>
.order-detail-page {
  padding: 8px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.status-editor {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}
</style>
