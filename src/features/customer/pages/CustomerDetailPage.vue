<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { customerService } from '@/features/customer/services/customerService';
import type { Customer } from '@/features/customer/types/customer.types';

const route = useRoute();
const router = useRouter();

const customer = ref<Customer | null>(null);
const loading = ref(true);

onMounted(async () => {
  const id = String(route.params.id || '');
  if (!id) {
    router.push('/customers');
    return;
  }

  loading.value = true;
  const data = await customerService.getCustomerById(id);
  if (!data) {
    router.push('/customers');
    return;
  }

  customer.value = data;
  loading.value = false;
});

const goBack = (): void => {
  router.push('/customers');
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
  <div class="customer-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" />
        <div>
          <h1 class="page-title">Customer Detail</h1>
          <p class="page-subtitle">View customer profile and debt summary</p>
        </div>
      </div>
    </div>

    <el-card v-loading="loading" shadow="hover">
      <template v-if="customer">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">
            {{ customer.id }}
          </el-descriptions-item>
          <el-descriptions-item label="Name">
            {{ customer.name }}
          </el-descriptions-item>
          <el-descriptions-item label="Phone">
            {{ customer.phone || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Address">
            {{ customer.address || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Total Debt">
            {{ formatCurrency(customer.totalDebt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Created At">
            {{ formatDate(customer.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty v-else description="Customer not found" />
    </el-card>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CustomerDetailPage',
};
</script>

<style scoped>
.customer-detail-page {
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
</style>
