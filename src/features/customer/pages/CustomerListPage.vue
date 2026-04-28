<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, View, Edit, Delete } from '@element-plus/icons-vue';
import { useCustomerStore } from '@/features/customer/store/customerStore';
import type { Customer, CustomerMutationInput } from '@/features/customer/types/customer.types';
import AppPagination from '@/shared/components/common/AppPagination.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const customerStore = useCustomerStore();
const router = useRouter();
const { t } = useI18n();
const searchQuery = ref('');

const dialogVisible = ref(false);
const editingCustomerId = ref<string | null>(null);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

const customerForm = reactive<CustomerMutationInput>({
  name: '',
  phone: '',
  address: '',
});

onMounted(() => {
  fetchCustomersPage();
});

const fetchCustomersPage = async (): Promise<void> => {
  await customerStore.fetchCustomers({
    page: currentPage.value,
    pageSize: pageSize.value,
  });
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => searchQuery.value,
  (newValue) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      customerStore.setFilter({ search: newValue });
    }, 300);
  }
);

const handleSearch = (): void => {
  customerStore.setFilter({ search: searchQuery.value });

  if (currentPage.value === 1) {
    fetchCustomersPage();
    return;
  }
  currentPage.value = 1;
};

const handleReset = (): void => {
  searchQuery.value = '';
  customerStore.resetFilter();

  if (currentPage.value === 1) {
    fetchCustomersPage();
    return;
  }
  currentPage.value = 1;
};

watch([currentPage, pageSize], () => {
  fetchCustomersPage();
});

const openCreateDialog = (): void => {
  editingCustomerId.value = null;
  customerForm.name = '';
  customerForm.phone = '';
  customerForm.address = '';
  dialogVisible.value = true;
};

const openEditDialog = (customer: Customer): void => {
  editingCustomerId.value = customer.id;
  customerForm.name = customer.name;
  customerForm.phone = customer.phone || '';
  customerForm.address = customer.address || '';
  dialogVisible.value = true;
};

const submitCustomer = async (): Promise<void> => {
  if (!customerForm.name.trim()) {
    ElMessage.error(t('customers.customerNameRequired'));
    return;
  }

  submitting.value = true;
  try {
    if (editingCustomerId.value) {
      await customerStore.updateCustomer(editingCustomerId.value, customerForm);
      ElMessage.success(t('customers.customerUpdated'));
    } else {
      await customerStore.createCustomer(customerForm);
      ElMessage.success(t('customers.customerCreated'));
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('customers.actionFailed'));
  } finally {
    submitting.value = false;
  }
};

const viewCustomer = (id: string): void => {
  router.push(`/customers/${id}`);
};

const removeCustomer = async (customer: Customer): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      t('customers.deleteConfirm', { name: customer.name }),
      t('common.confirmDelete'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    await customerStore.deleteCustomer(customer.id);
    ElMessage.success(t('customers.customerDeleted'));
  } catch {
    // User cancelled dialog.
  }
};

const formatCurrency = (value: number): string => {
  return formatCurrencyVnd(value);
};
</script>

<template>
  <div class="customer-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('customers.title') }}</h1>
        <p class="page-subtitle">{{ t('customers.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ t('customers.addCustomer') }}
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchQuery"
          :placeholder="t('customers.searchPlaceholder')"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          {{ t('common.search') }}
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">
          {{ t('common.reset') }}
        </el-button>
      </div>
    </el-card>

    <el-card shadow="hover" v-loading="customerStore.loading">
      <el-table :data="customerStore.filteredCustomers" stripe style="width: 100%">
        <el-table-column prop="name" :label="t('customers.name')" min-width="220" />
        <el-table-column prop="phone" :label="t('customers.phone')" min-width="150" />
        <el-table-column prop="address" :label="t('customers.address')" min-width="220" />
        <el-table-column :label="t('customers.totalDebt')" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.totalDebt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewCustomer(row.id)">
              <el-icon><View /></el-icon>
              {{ t('common.view') }}
            </el-button>
            <el-button link type="warning" size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>
              {{ t('common.edit') }}
            </el-button>
            <el-button link type="danger" size="small" @click="removeCustomer(row)">
              <el-icon><Delete /></el-icon>
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <AppPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="customerStore.pageInfo.total"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingCustomerId ? t('customers.editCustomer') : t('customers.createCustomer')"
      width="560px"
    >
      <el-form label-position="top">
        <el-form-item :label="t('customers.customerName')" required>
          <el-input v-model="customerForm.name" :placeholder="t('customers.customerName')" />
        </el-form-item>
        <el-form-item :label="t('customers.phone')">
          <el-input v-model="customerForm.phone" :placeholder="t('customers.phone')" />
        </el-form-item>
        <el-form-item :label="t('customers.address')">
          <el-input v-model="customerForm.address" type="textarea" :rows="3" :placeholder="t('customers.address')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCustomer">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CustomerListPage',
};
</script>

<style scoped>
.customer-list-page {
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

.search-input {
  width: 360px;
}
</style>
