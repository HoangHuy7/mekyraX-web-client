<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, View, Delete } from '@element-plus/icons-vue';
import { useOrderStore } from '@/features/order/store/orderStore';
import type { Order } from '@/features/order/types/order.types';
import AppPagination from '@/shared/components/common/AppPagination.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const orderStore = useOrderStore();
const router = useRouter();
const { t } = useI18n();
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const fetchOrdersPage = async (): Promise<void> => {
  await orderStore.fetchOrders({
    page: currentPage.value,
    pageSize: pageSize.value,
  });
};

onMounted(() => {
  fetchOrdersPage();
});

const applyFilter = (): void => {
  orderStore.setFilter({ status: statusFilter.value || undefined });
  if (currentPage.value === 1) {
    fetchOrdersPage();
    return;
  }
  currentPage.value = 1;
};

const resetFilter = (): void => {
  statusFilter.value = '';
  orderStore.resetFilter();
  if (currentPage.value === 1) {
    fetchOrdersPage();
    return;
  }
  currentPage.value = 1;
};

const removeOrder = async (order: Order): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      t('orders.deleteConfirm', { code: order.code || order.id }),
      t('common.confirmDelete'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    await orderStore.deleteOrder(order.id);
    ElMessage.success(t('orders.orderDeleted'));
    fetchOrdersPage();
  } catch {
    // User cancelled dialog.
  }
};

const viewOrder = (id: string): void => {
  router.push(`/orders/${id}`);
};

const getStatusType = (status: string): string => {
  if (status === 'paid') return 'success';
  if (status === 'debt') return 'warning';
  if (status === 'delivery') return 'primary';
  return 'info';
};

const formatCurrency = (value: number): string =>
  formatCurrencyVnd(value);

watch([currentPage, pageSize], () => {
  fetchOrdersPage();
});
</script>

<template>
  <div class="order-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('orders.title') }}</h1>
        <p class="page-subtitle">{{ t('orders.subtitle') }}</p>
      </div>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-select v-model="statusFilter" :placeholder="t('orders.filterByStatus')" clearable @change="applyFilter">
          <el-option :label="t('orders.paid')" value="paid" />
          <el-option :label="t('orders.debt')" value="debt" />
          <el-option :label="t('orders.delivery')" value="delivery" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">{{ t('common.reset') }}</el-button>
      </div>
    </el-card>

    <el-card shadow="hover" v-loading="orderStore.loading">
      <el-table :data="orderStore.filteredOrders" stripe style="width: 100%">
        <el-table-column prop="code" :label="t('orders.code')" min-width="150">
          <template #default="{ row }">
            {{ row.code || row.id }}
          </template>
        </el-table-column>
        <el-table-column :label="t('orders.customer')" min-width="220">
          <template #default="{ row }">
            {{ row.customer?.name || t('orders.walkInCustomer') }}
          </template>
        </el-table-column>
        <el-table-column :label="t('orders.total')" width="130">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('orders.paid')" width="130">
          <template #default="{ row }">
            {{ formatCurrency(row.paidAmount) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('orders.debtAmount')" width="130">
          <template #default="{ row }">
            {{ formatCurrency(row.debtAmount) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.status')" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewOrder(row.id)">
              <el-icon><View /></el-icon>
              {{ t('common.view') }}
            </el-button>
            <el-button link type="danger" size="small" @click="removeOrder(row)">
              <el-icon><Delete /></el-icon>
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <AppPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="orderStore.pageInfo.total"
      />
    </el-card>
  </div>
</template>

<script lang="ts">
export default {
  name: 'OrderListPage',
};
</script>

<style scoped>
.order-list-page {
  padding: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
