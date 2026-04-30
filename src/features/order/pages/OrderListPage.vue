<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { View } from '@element-plus/icons-vue';
import { useOrderStore } from '@/features/order/store/orderStore';
import { customerService } from '@/features/customer/services/customerService';
import type { Customer } from '@/features/customer/types/customer.types';
import AppDataTable, { type AppDataTableColumn } from '@/shared/components/common/AppDataTable.vue';
import AppFilterBar from '@/shared/components/common/AppFilterBar.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const orderStore = useOrderStore();
const router = useRouter();
const { t } = useI18n();

const filterForm = reactive({
  status: '',
  customerId: '' as string | '',
  dateRange: [] as string[],
});

const currentPage = ref(1);
const pageSize = ref(20);
const sort = ref<{ prop: string; order: 'ascending' | 'descending' } | undefined>({
  prop: 'createdAt',
  order: 'descending',
});
const customers = ref<Customer[]>([]);

const fetchPage = (): Promise<void> =>
  orderStore.fetchOrders({ page: currentPage.value, pageSize: pageSize.value });

const loadCustomers = async (): Promise<void> => {
  const r = await customerService.fetchCustomers({}, { page: 1, pageSize: 100 });
  customers.value = r.items;
};

onMounted(() => {
  orderStore.setFilter({});
  fetchPage();
  loadCustomers();
});

watch([currentPage, pageSize], fetchPage);

const apply = (): void => {
  orderStore.setFilter({
    status: filterForm.status || undefined,
    customerId: filterForm.customerId || undefined,
    fromDate: filterForm.dateRange?.[0] || undefined,
    toDate: filterForm.dateRange?.[1] || undefined,
  });
  if (currentPage.value === 1) fetchPage();
  else currentPage.value = 1;
};

const reset = (): void => {
  filterForm.status = '';
  filterForm.customerId = '';
  filterForm.dateRange = [];
  orderStore.resetFilter();
  if (currentPage.value === 1) fetchPage();
  else currentPage.value = 1;
};

const view = (id: string): void => {
  router.push(`/orders/${id}`);
};

const onSort = (e: { prop: string; order: 'ascending' | 'descending' | null }): void => {
  if (e.order) sort.value = { prop: e.prop, order: e.order };
  else sort.value = undefined;
};

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

const fmtDate = (d?: string): string => (d
  ? new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  : '—');

const columns: AppDataTableColumn[] = [
  { prop: 'code', label: t('orders.code'), width: 130, slot: 'code' },
  { prop: 'customer', label: t('orders.customer'), minWidth: 160, slot: 'customer' },
  { prop: 'totalAmount', label: t('orders.total'), width: 140, sortable: true, slot: 'totalAmount', align: 'right' },
  { prop: 'paidAmount', label: t('orders.paidAmount'), width: 130, sortable: true, slot: 'paidAmount', align: 'right' },
  { prop: 'debtAmount', label: t('orders.debtAmount'), width: 130, sortable: true, slot: 'debtAmount', align: 'right' },
  { prop: 'status', label: t('common.status'), width: 130, slot: 'status', align: 'center' },
  { prop: 'createdAt', label: t('orders.createdAt'), width: 170, sortable: true, slot: 'createdAt' },
  { prop: 'actions', label: '', width: 70, slot: 'actions', fixed: 'right', align: 'center' },
];
</script>

<template>
  <div class="order-list-page">
    <div class="page-header">
      <h1 class="page-title">{{ t('orders.title') }}</h1>
      <p class="page-subtitle">{{ t('orders.subtitle') }}</p>
    </div>

    <AppFilterBar :total="orderStore.pageInfo.total" @apply="apply" @reset="reset">
      <el-select v-model="filterForm.status" :placeholder="t('orders.filterByStatus')" clearable style="width:170px">
        <el-option :label="t('orders.paid')" value="paid" />
        <el-option :label="t('orders.debt')" value="debt" />
        <el-option :label="t('orders.delivery')" value="delivery" />
        <el-option :label="t('orders.pending')" value="pending" />
        <el-option :label="t('orders.cancelled')" value="cancelled" />
      </el-select>
      <el-select
        v-model="filterForm.customerId"
        :placeholder="t('orders.filterByCustomer')"
        filterable clearable
        style="width:220px"
      >
        <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-date-picker
        v-model="filterForm.dateRange"
        type="daterange"
        :range-separator="t('common.to')"
        :start-placeholder="t('common.from')"
        :end-placeholder="t('common.to')"
        value-format="YYYY-MM-DDTHH:mm:ssZ"
        style="width:280px"
      />
    </AppFilterBar>

    <AppDataTable
      :data="orderStore.orders"
      :columns="columns"
      :loading="orderStore.loading"
      :total="orderStore.pageInfo.total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :default-sort="sort"
      @sort-change="onSort"
      @row-click="(row) => view(row.id)"
    >
      <template #code="{ row }">
        <b>{{ row.code || row.id.slice(0, 8) }}</b>
      </template>
      <template #customer="{ row }">
        {{ row.customer?.name || t('orders.walkInCustomer') }}
      </template>
      <template #totalAmount="{ row }">{{ formatCurrencyVnd(row.totalAmount) }}</template>
      <template #paidAmount="{ row }">
        <span class="paid">{{ formatCurrencyVnd(row.paidAmount) }}</span>
      </template>
      <template #debtAmount="{ row }">
        <span v-if="row.debtAmount > 0" class="debt">{{ formatCurrencyVnd(row.debtAmount) }}</span>
        <span v-else class="muted">—</span>
      </template>
      <template #status="{ row }">
        <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
      </template>
      <template #createdAt="{ row }">
        <span class="muted">{{ fmtDate(row.createdAt) }}</span>
      </template>
      <template #actions="{ row }">
        <el-button link type="primary" :icon="View" @click.stop="view(row.id)" />
      </template>
    </AppDataTable>
  </div>
</template>

<script lang="ts">
export default { name: 'OrderListPage' };
</script>

<style scoped>
.order-list-page { padding: 8px; }
.page-header { margin-bottom: 16px; }
.page-title { margin: 0 0 4px; font-size: 24px; font-weight: 600; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); }
.paid { color: var(--el-color-success); font-weight: 500; }
.debt { color: var(--el-color-danger); font-weight: 600; }
.muted { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
