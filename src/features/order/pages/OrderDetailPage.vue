<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { orderService } from '@/features/order/services/orderService';
import type { Order } from '@/features/order/types/order.types';

const route = useRoute();
const router = useRouter();

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
    ElMessage.success('Order status updated');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Update failed');
  } finally {
    saving.value = false;
  }
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

const formatDate = (value?: string): string => {
  if (!value) {
    return 'N/A';
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
          <h1 class="page-title">Order Detail</h1>
          <p class="page-subtitle">Review order items and payment state</p>
        </div>
      </div>
    </div>

    <el-card v-loading="loading" shadow="hover">
      <template v-if="order">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Order Code">
            {{ order.code || order.id }}
          </el-descriptions-item>
          <el-descriptions-item label="Customer">
            {{ order.customer?.name || 'Walk-in customer' }}
          </el-descriptions-item>
          <el-descriptions-item label="Total Amount">
            {{ formatCurrency(order.totalAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="Paid Amount">
            {{ formatCurrency(order.paidAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="Debt Amount">
            {{ formatCurrency(order.debtAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="Created At">
            {{ formatDate(order.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="status-editor">
          <el-select v-model="status" placeholder="Order status">
            <el-option label="Paid" value="paid" />
            <el-option label="Debt" value="debt" />
            <el-option label="Delivery" value="delivery" />
          </el-select>
          <el-button type="primary" :loading="saving" @click="saveStatus">
            Save Status
          </el-button>
        </div>

        <el-divider />

        <el-table :data="order.items" stripe style="width: 100%">
          <el-table-column prop="productName" label="Product" min-width="220" />
          <el-table-column prop="quantity" label="Qty" width="100" />
          <el-table-column label="Price" width="140">
            <template #default="{ row }">
              {{ formatCurrency(row.price) }}
            </template>
          </el-table-column>
          <el-table-column label="Total" width="140">
            <template #default="{ row }">
              {{ formatCurrency(row.total) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="Order not found" />
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
