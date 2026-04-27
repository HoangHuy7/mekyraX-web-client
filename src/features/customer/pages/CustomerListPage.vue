<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, View, Edit, Delete } from '@element-plus/icons-vue';
import { useCustomerStore } from '@/features/customer/store/customerStore';
import type { Customer, CustomerMutationInput } from '@/features/customer/types/customer.types';

const customerStore = useCustomerStore();
const router = useRouter();
const searchQuery = ref('');

const dialogVisible = ref(false);
const editingCustomerId = ref<string | null>(null);
const submitting = ref(false);

const customerForm = reactive<CustomerMutationInput>({
  name: '',
  phone: '',
  address: '',
});

onMounted(() => {
  customerStore.fetchCustomers();
});

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
  customerStore.fetchCustomers();
};

const handleReset = (): void => {
  searchQuery.value = '';
  customerStore.resetFilter();
  customerStore.fetchCustomers();
};

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
    ElMessage.error('Customer name is required');
    return;
  }

  submitting.value = true;
  try {
    if (editingCustomerId.value) {
      await customerStore.updateCustomer(editingCustomerId.value, customerForm);
      ElMessage.success('Customer updated');
    } else {
      await customerStore.createCustomer(customerForm);
      ElMessage.success('Customer created');
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Action failed');
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
      `Delete customer "${customer.name}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    await customerStore.deleteCustomer(customer.id);
    ElMessage.success('Customer deleted');
  } catch {
    // User cancelled dialog.
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
</script>

<template>
  <div class="customer-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Customers</h1>
        <p class="page-subtitle">Manage your customer directory</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Add Customer
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchQuery"
          placeholder="Search customer by name, phone, address..."
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          Search
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">
          Reset
        </el-button>
      </div>
    </el-card>

    <el-card shadow="hover" v-loading="customerStore.loading">
      <el-table :data="customerStore.filteredCustomers" stripe style="width: 100%">
        <el-table-column prop="name" label="Name" min-width="220" />
        <el-table-column prop="phone" label="Phone" min-width="150" />
        <el-table-column prop="address" label="Address" min-width="220" />
        <el-table-column label="Total Debt" width="140">
          <template #default="{ row }">
            {{ formatCurrency(row.totalDebt) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewCustomer(row.id)">
              <el-icon><View /></el-icon>
              View
            </el-button>
            <el-button link type="warning" size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon>
              Edit
            </el-button>
            <el-button link type="danger" size="small" @click="removeCustomer(row)">
              <el-icon><Delete /></el-icon>
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingCustomerId ? 'Edit Customer' : 'Create Customer'"
      width="560px"
    >
      <el-form label-position="top">
        <el-form-item label="Customer Name" required>
          <el-input v-model="customerForm.name" placeholder="Customer name" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="customerForm.phone" placeholder="Phone number" />
        </el-form-item>
        <el-form-item label="Address">
          <el-input v-model="customerForm.address" type="textarea" :rows="3" placeholder="Address" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCustomer">
          Save
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
