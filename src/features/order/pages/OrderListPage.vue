<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Refresh, View } from '@element-plus/icons-vue';
import { useOrderStore } from '@/features/order/store/orderStore';
import AppPagination from '@/shared/components/common/AppPagination.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const orderStore = useOrderStore();
const router = useRouter();
const { t } = useI18n();
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

const fetchOrdersPage = async (): Promise<void> => {
  await orderStore.fetchOrders({ page: currentPage.value, pageSize: pageSize.value });
};

onMounted(() => { fetchOrdersPage(); });

const applyFilter = (): void => {
  orderStore.setFilter({ status: statusFilter.value || undefined });
  currentPage.value === 1 ? fetchOrdersPage() : (currentPage.value = 1);
};

const resetFilter = (): void => {
  statusFilter.value = '';
  orderStore.resetFilter();
  currentPage.value === 1 ? fetchOrdersPage() : (currentPage.value = 1);
};

const viewOrder = (id: string): void => { router.push(`/orders/${id}`); };

const getStatusType = (status: string): string => {
  if (status === 'paid') return 'success';
  if (status === 'debt') return 'danger';
  if (status === 'delivery') return 'primary';
  return 'info';
};

const getStatusLabel = (status: string): string => {
  if (status === 'paid') return 'Đã thanh toán';
  if (status === 'debt') return 'Còn nợ';
  if (status === 'delivery') return 'Giao hàng';
  return status;
};

const formatDate = (d?: string): string => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

watch([currentPage, pageSize], () => { fetchOrdersPage(); });
</script>

<template>
  <div class="order-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('orders.title') }}</h1>
        <p class="page-subtitle">Danh sách tất cả đơn hàng</p>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-row">
        <el-select v-model="statusFilter" placeholder="Lọc theo trạng thái" clearable style="width:180px" @change="applyFilter">
          <el-option label="Đã thanh toán" value="paid" />
          <el-option label="Còn nợ" value="debt" />
          <el-option label="Giao hàng" value="delivery" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">Reset</el-button>
        <span class="total-hint">Tổng: <b>{{ orderStore.pageInfo.total }}</b> đơn</span>
      </div>
    </el-card>

    <el-card shadow="never" v-loading="orderStore.loading">
      <el-table :data="orderStore.filteredOrders" stripe style="width:100%" :row-class-name="() => 'order-row'">
        <el-table-column prop="code" label="Mã đơn" width="130">
          <template #default="{ row }">
            <b>{{ row.code || row.id.slice(0,8) }}</b>
          </template>
        </el-table-column>
        <el-table-column label="Khách hàng" min-width="150">
          <template #default="{ row }">
            {{ row.customer?.name || 'Khách lẻ' }}
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrencyVnd(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Đã trả" width="120" align="right">
          <template #default="{ row }">
            <span class="paid-text">{{ formatCurrencyVnd(row.paidAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Còn nợ" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.debtAmount > 0" class="debt-text">{{ formatCurrencyVnd(row.debtAmount) }}</span>
            <span v-else class="paid-text">—</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thời gian tạo" width="150">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :icon="View" @click="viewOrder(row.id)" />
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
export default { name: 'OrderListPage' };
</script>

<style scoped>
.order-list-page { padding: 8px; }
.page-header { margin-bottom: 20px; }
.page-title { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); font-size: 14px; }
.filter-card { margin-bottom: 16px; }
.filter-row { display: flex; gap: 12px; align-items: center; }
.total-hint { margin-left: auto; font-size: 13px; color: var(--el-text-color-secondary); }
.paid-text { color: var(--el-color-success); font-weight: 500; }
.debt-text { color: var(--el-color-danger); font-weight: 600; }
.date-text { font-size: 12px; color: var(--el-text-color-secondary); }
:deep(.order-row:hover) { cursor: pointer; }
</style>
