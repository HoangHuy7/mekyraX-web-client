<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Goods, Check, Money, List, Plus, Document, User } from '@element-plus/icons-vue';
import type { DashboardStats } from '@/features/dashboard/types/dashboard.types';

const router = useRouter();

const stats = ref<DashboardStats>({
  totalProducts: 0,
  activeProducts: 0,
  totalRevenue: 0,
  pendingOrders: 0,
});

const loading = ref(true);

onMounted(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  stats.value = {
    totalProducts: 156,
    activeProducts: 142,
    totalRevenue: 45800,
    pendingOrders: 23,
  };
  loading.value = false;
});

const statCards = [
  { title: 'Total Products', key: 'totalProducts', icon: Goods, color: '#409EFF' },
  { title: 'Active Products', key: 'activeProducts', icon: Check, color: '#67C23A' },
  { title: 'Total Revenue', key: 'totalRevenue', icon: Money, color: '#E6A23C', prefix: '$' },
  { title: 'Pending Orders', key: 'pendingOrders', icon: List, color: '#F56C6C' },
];

const goProducts = (): void => {
  router.push('/products');
};

const goOrders = (): void => {
  router.push('/orders');
};

const goCustomers = (): void => {
  router.push('/customers');
};
</script>

<template>
  <div class="dashboard-page">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Welcome to the admin dashboard</p>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.key">
        <el-card class="stat-card" shadow="hover" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: card.color + '20', color: card.color }">
              <el-icon :size="32">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ card.prefix || '' }}{{ stats[card.key as keyof DashboardStats].toLocaleString() }}
              </div>
              <div class="stat-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover">
          <template #header>
            <span>Recent Activity</span>
          </template>
          <el-timeline>
            <el-timeline-item timestamp="2024-01-15" type="primary">
              New product added: "Wireless Headphones Pro"
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-14" type="success">
              Order #1234 completed successfully
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-13" type="warning">
              Low stock alert: "Gaming Mouse X5"
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-12" type="info">
              System backup completed
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="hover">
          <template #header>
            <span>Quick Actions</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" plain class="action-btn" @click="goProducts">
              <el-icon><Plus /></el-icon>
              Add Product
            </el-button>
            <el-button type="success" plain class="action-btn" @click="goOrders">
              <el-icon><Document /></el-icon>
              View Orders
            </el-button>
            <el-button type="info" plain class="action-btn" @click="goCustomers">
              <el-icon><User /></el-icon>
              View Customers
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 8px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 0 0 24px;
  color: var(--el-text-color-secondary);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.stat-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.content-row {
  margin-top: 20px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  justify-content: flex-start;
  gap: 8px;
}
</style>
