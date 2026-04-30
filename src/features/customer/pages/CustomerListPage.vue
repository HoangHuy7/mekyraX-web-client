<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, View } from '@element-plus/icons-vue';
import { useCustomerStore } from '@/features/customer/store/customerStore';
import type {
  Customer,
  CustomerMutationInput,
} from '@/features/customer/types/customer.types';
import AppDataTable, {
  type AppDataTableColumn,
} from '@/shared/components/common/AppDataTable.vue';import AppFilterBar from '@/shared/components/common/AppFilterBar.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const customerStore = useCustomerStore();
const router = useRouter();
const { t } = useI18n();

const filterForm = reactive({
  search: '',
  phone: '',
  email: '',
  idCard: '',
  hasDebt: '' as '' | 'true' | 'false',
});

const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const sort = ref<{ prop: string; order: 'ascending' | 'descending' } | undefined>({
  prop: 'createdAt',
  order: 'descending',
});

const customerForm = reactive<CustomerMutationInput>({
  name: '',
  phone: '',
  address: '',
  idCard: '',
  email: '',
  imgUrl: '',
  note: '',
});

const fetchPage = async (): Promise<void> => {
  await customerStore.fetchCustomers({ page: currentPage.value, pageSize: pageSize.value });
};

onMounted(() => {
  customerStore.setFilter({});
  fetchPage();
});

watch([currentPage, pageSize], fetchPage);

const handleApply = (): void => {
  customerStore.setFilter({
    search: filterForm.search || undefined,
    phone: filterForm.phone || undefined,
    email: filterForm.email || undefined,
    idCard: filterForm.idCard || undefined,
    hasDebt: filterForm.hasDebt === '' ? undefined : filterForm.hasDebt === 'true',
  });
  if (currentPage.value === 1) {
    fetchPage();
  } else {
    currentPage.value = 1;
  }
};

const handleReset = (): void => {
  filterForm.search = '';
  filterForm.phone = '';
  filterForm.email = '';
  filterForm.idCard = '';
  filterForm.hasDebt = '';
  customerStore.resetFilter();
  if (currentPage.value === 1) {
    fetchPage();
  } else {
    currentPage.value = 1;
  }
};

const openCreate = (): void => {
  editingId.value = null;
  Object.assign(customerForm, {
    name: '', phone: '', address: '', idCard: '', email: '', imgUrl: '', note: '',
  });
  dialogVisible.value = true;
};

const openEdit = (c: Customer): void => {
  editingId.value = c.id;
  Object.assign(customerForm, {
    name: c.name,
    phone: c.phone || '',
    address: c.address || '',
    idCard: c.idCard || '',
    email: c.email || '',
    imgUrl: c.imgUrl || '',
    note: c.note || '',
  });
  dialogVisible.value = true;
};

const submit = async (): Promise<void> => {
  if (!customerForm.name.trim()) {
    ElMessage.error(t('customers.customerNameRequired'));
    return;
  }
  submitting.value = true;
  try {
    if (editingId.value) {
      await customerStore.updateCustomer(editingId.value, customerForm);
      ElMessage.success(t('customers.customerUpdated'));
    } else {
      await customerStore.createCustomer(customerForm);
      ElMessage.success(t('customers.customerCreated'));
    }
    dialogVisible.value = false;
    fetchPage();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('customers.actionFailed'));
  } finally {
    submitting.value = false;
  }
};

const view = (id: string): void => {
  router.push(`/customers/${id}`);
};

const remove = async (c: Customer): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      t('customers.deleteConfirm', { name: c.name }),
      t('common.confirmDelete'),
      { confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), type: 'warning' }
    );
    await customerStore.deleteCustomer(c.id);
    ElMessage.success(t('customers.customerDeleted'));
    fetchPage();
  } catch {
    /* dismissed */
  }
};

const onSortChange = (e: { prop: string; order: 'ascending' | 'descending' | null }): void => {
  if (e.order) {
    sort.value = { prop: e.prop, order: e.order };
  } else {
    sort.value = undefined;
  }
  // Local sort only; backend ordering can be added later.
};

const columns: AppDataTableColumn[] = [
  { prop: 'name', label: t('customers.name'), minWidth: 200, sortable: true },
  { prop: 'phone', label: t('customers.phone'), minWidth: 140, sortable: true },
  { prop: 'email', label: t('customers.email'), minWidth: 180 },
  { prop: 'idCard', label: t('customers.idCard'), minWidth: 140 },
  { prop: 'address', label: t('customers.address'), minWidth: 200 },
  { prop: 'totalDebt', label: t('customers.totalDebt'), width: 140, sortable: true, slot: 'totalDebt', align: 'right' },
  { prop: 'createdAt', label: t('customers.createdAt'), width: 160, sortable: true, slot: 'createdAt' },
  { prop: 'actions', label: t('common.actions'), width: 220, slot: 'actions', fixed: 'right', align: 'center' },
];

const formatDate = (s?: string): string => (s ? new Date(s).toLocaleDateString('vi-VN') : '—');
</script>

<template>
  <div class="customer-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('customers.title') }}</h1>
        <p class="page-subtitle">{{ t('customers.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">
        {{ t('customers.addCustomer') }}
      </el-button>
    </div>

    <AppFilterBar :total="customerStore.pageInfo.total" @apply="handleApply" @reset="handleReset">
      <el-input
        v-model="filterForm.search"
        :placeholder="t('customers.searchPlaceholder')"
        clearable style="width: 280px"
        @keyup.enter="handleApply"
      />
      <el-input v-model="filterForm.phone" :placeholder="t('customers.phone')" clearable style="width: 160px" />
      <el-input v-model="filterForm.email" :placeholder="t('customers.email')" clearable style="width: 200px" />
      <el-input v-model="filterForm.idCard" :placeholder="t('customers.idCard')" clearable style="width: 160px" />
      <el-select v-model="filterForm.hasDebt" :placeholder="t('customers.hasDebt')" clearable style="width: 140px">
        <el-option :label="t('common.all')" value="" />
        <el-option :label="t('common.yes')" value="true" />
        <el-option :label="t('common.no')" value="false" />
      </el-select>
    </AppFilterBar>

    <AppDataTable
      :data="customerStore.customers"
      :columns="columns"
      :loading="customerStore.loading"
      :total="customerStore.pageInfo.total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :default-sort="sort"
      @sort-change="onSortChange"
    >
      <template #totalDebt="{ row }">
        <span :class="{ 'debt-warn': row.totalDebt > 0 }">{{ formatCurrencyVnd(row.totalDebt) }}</span>
      </template>
      <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
      <template #actions="{ row }">
        <el-button link type="primary" size="small" :icon="View" @click.stop="view(row.id)">{{ t('common.view') }}</el-button>
        <el-button link type="warning" size="small" :icon="Edit" @click.stop="openEdit(row)">{{ t('common.edit') }}</el-button>
        <el-button link type="danger" size="small" :icon="Delete" @click.stop="remove(row)">{{ t('common.delete') }}</el-button>
      </template>
    </AppDataTable>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? t('customers.editCustomer') : t('customers.createCustomer')"
      width="640px"
    >
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('customers.customerName')" required>
              <el-input v-model="customerForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('customers.phone')">
              <el-input v-model="customerForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('customers.email')">
              <el-input v-model="customerForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('customers.idCard')">
              <el-input v-model="customerForm.idCard" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('customers.address')">
              <el-input v-model="customerForm.address" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('customers.imgUrl')">
              <el-input v-model="customerForm.imgUrl" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('customers.note')">
              <el-input v-model="customerForm.note" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
export default { name: 'CustomerListPage' };
</script>

<style scoped>
.customer-list-page { padding: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { margin: 0 0 6px; font-size: 24px; font-weight: 600; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); }
.debt-warn { color: var(--el-color-danger); font-weight: 600; }
</style>
