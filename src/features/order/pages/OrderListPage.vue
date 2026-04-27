<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, View, Delete } from '@element-plus/icons-vue';
import { useOrderStore } from '@/features/order/store/orderStore';
import { customerService } from '@/features/customer/services/customerService';
import { productService } from '@/features/product/services/productService';
import type { Customer } from '@/features/customer/types/customer.types';
import type { Product } from '@/features/product/types/product.types';
import type { Order, CreateOrderInput } from '@/features/order/types/order.types';

const orderStore = useOrderStore();
const router = useRouter();

const statusFilter = ref('');

const createDialogVisible = ref(false);
const submitting = ref(false);
const customerOptions = ref<Customer[]>([]);
const productOptions = ref<Product[]>([]);

const createForm = reactive({
  customerId: '',
  productId: '',
  quantity: 1,
  price: 0,
  paidAmount: 0,
  note: '',
});

onMounted(async () => {
  await Promise.all([
    orderStore.fetchOrders(),
    loadOptions(),
  ]);
});

const loadOptions = async (): Promise<void> => {
  const [customersResult, productsResult] = await Promise.all([
    customerService.fetchCustomers(),
    productService.fetchProducts(),
  ]);
  customerOptions.value = customersResult.items;
  productOptions.value = productsResult.items;
};

const applyFilter = (): void => {
  orderStore.setFilter({ status: statusFilter.value || undefined });
};

const resetFilter = (): void => {
  statusFilter.value = '';
  orderStore.resetFilter();
  orderStore.fetchOrders();
};

const totalAmountPreview = computed(() => createForm.quantity * createForm.price);

const onSelectProduct = (): void => {
  const selected = productOptions.value.find((item) => item.id === createForm.productId);
  if (!selected) {
    return;
  }
  createForm.price = selected.price;
  createForm.paidAmount = selected.price * createForm.quantity;
};

const openCreateDialog = (): void => {
  createForm.customerId = '';
  createForm.productId = '';
  createForm.quantity = 1;
  createForm.price = 0;
  createForm.paidAmount = 0;
  createForm.note = '';
  createDialogVisible.value = true;
};

const submitCreateOrder = async (): Promise<void> => {
  if (!createForm.productId) {
    ElMessage.error('Please select a product');
    return;
  }

  if (createForm.quantity <= 0) {
    ElMessage.error('Quantity must be greater than 0');
    return;
  }

  const input: CreateOrderInput = {
    customerId: createForm.customerId || undefined,
    paidAmount: createForm.paidAmount,
    note: createForm.note || undefined,
    items: [
      {
        productId: createForm.productId,
        quantity: createForm.quantity,
        price: createForm.price,
      },
    ],
  };

  submitting.value = true;
  try {
    await orderStore.createOrder(input);
    ElMessage.success('Order created');
    createDialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Create order failed');
  } finally {
    submitting.value = false;
  }
};

const removeOrder = async (order: Order): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `Delete order "${order.code || order.id}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    await orderStore.deleteOrder(order.id);
    ElMessage.success('Order deleted');
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
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
</script>

<template>
  <div class="order-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Orders</h1>
        <p class="page-subtitle">Track sales orders and payment status</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        Create Order
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-select v-model="statusFilter" placeholder="Filter by status" clearable @change="applyFilter">
          <el-option label="Paid" value="paid" />
          <el-option label="Debt" value="debt" />
          <el-option label="Delivery" value="delivery" />
        </el-select>
        <el-button :icon="Refresh" @click="resetFilter">Reset</el-button>
      </div>
    </el-card>

    <el-card shadow="hover" v-loading="orderStore.loading">
      <el-table :data="orderStore.filteredOrders" stripe style="width: 100%">
        <el-table-column prop="code" label="Code" min-width="140">
          <template #default="{ row }">
            {{ row.code || row.id }}
          </template>
        </el-table-column>
        <el-table-column label="Customer" min-width="200">
          <template #default="{ row }">
            {{ row.customer?.name || 'Walk-in customer' }}
          </template>
        </el-table-column>
        <el-table-column label="Total" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Paid" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.paidAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Debt" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.debtAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewOrder(row.id)">
              <el-icon><View /></el-icon>
              View
            </el-button>
            <el-button link type="danger" size="small" @click="removeOrder(row)">
              <el-icon><Delete /></el-icon>
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="Create Order" width="680px">
      <el-form label-position="top">
        <el-form-item label="Customer (optional)">
          <el-select v-model="createForm.customerId" placeholder="Select customer" clearable filterable>
            <el-option
              v-for="customer in customerOptions"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Product" required>
          <el-select
            v-model="createForm.productId"
            placeholder="Select product"
            filterable
            @change="onSelectProduct"
          >
            <el-option
              v-for="product in productOptions"
              :key="product.id"
              :label="`${product.name} (${formatCurrency(product.price)})`"
              :value="product.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Quantity" required>
              <el-input-number v-model="createForm.quantity" :min="1" @change="onSelectProduct" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Unit Price" required>
              <el-input-number v-model="createForm.price" :min="0" :step="0.01" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Paid Amount" required>
          <el-input-number v-model="createForm.paidAmount" :min="0" :step="0.01" />
        </el-form-item>

        <el-alert
          :title="`Order total: ${formatCurrency(totalAmountPreview)}`"
          type="info"
          :closable="false"
          show-icon
        />

        <el-form-item label="Note">
          <el-input v-model="createForm.note" type="textarea" :rows="3" placeholder="Order note" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreateOrder">
          Create
        </el-button>
      </template>
    </el-dialog>
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
