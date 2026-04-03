<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Goods, Check, Money, List } from '@element-plus/icons-vue';
import type { DashboardStats } from '@/features/dashboard/types/dashboard.types';

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
</script>

<template>
  <div class="dashboard-page">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Welcome to the admin dashboard</p>

    <el-row :gutter="24" class="stats-row">
      <el-col :xs="12" :sm="12" :md="12" :lg="6" v-for="card in statCards" :key="card.key">
        <el-card class="stat-card" shadow="hover" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: card.color + '20', color: card.color }">
              <el-icon :size="48">
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

    <el-row :gutter="24" class="content-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover" class="full-height-card">
          <template #header>
            <span class="card-header">Recent Activity</span>
          </template>
          <el-timeline>
            <el-timeline-item timestamp="2024-01-15" type="primary" size="large">
              <span class="timeline-text">New product added: "Wireless Headphones Pro"</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-14" type="success" size="large">
              <span class="timeline-text">Order #1234 completed successfully</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-13" type="warning" size="large">
              <span class="timeline-text">Low stock alert: "Gaming Mouse X5"</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2024-01-12" type="info" size="large">
              <span class="timeline-text">System backup completed</span>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="full-height-card">
          <template #header>
            <span class="card-header">Quick Actions</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" plain class="action-btn" size="large">
              <el-icon :size="24"><Plus /></el-icon>
              <span>Add Product</span>
            </el-button>
            <el-button type="success" plain class="action-btn" size="large">
              <el-icon :size="24"><Document /></el-icon>
              <span>View Orders</span>
            </el-button>
            <el-button type="warning" plain class="action-btn" size="large">
              <el-icon :size="24"><Setting /></el-icon>
              <span>Settings</span>
            </el-button>
            <el-button type="info" plain class="action-btn" size="large">
              <el-icon :size="24"><User /></el-icon>
              <span>Profile</span>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Plus, Document, Setting, User } from '@element-plus/icons-vue';

export default {
  name: 'Dashboard',
  components: {
    Plus,
    Document,
    Setting,
    User,
  },
};
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  min-height: 100%;
}

.page-title {
  margin: 0 0 12px;
  font-size: 36px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 0 0 32px;
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

.stats-row {
  margin-bottom: 32px;
}

.stat-card {
  margin-bottom: 24px;
  border-radius: 16px;
  min-height: 140px;
  transition: transform 0.2s ease;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px;
}

.stat-icon {
  width: 88px;
  height: 88px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 40px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.stat-title {
  font-size: 18px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
  font-weight: 500;
}

.content-row {
  margin-top: 24px;
}

.full-height-card {
  min-height: 400px;
  border-radius: 16px;
}

.card-header {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.timeline-text {
  font-size: 18px;
  line-height: 1.6;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px;
}

.action-btn {
  justify-content: flex-start;
  gap: 16px;
  height: 64px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 500;
  padding: 0 24px;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.97);
}

/* Kiosk/iPad optimizations */
@media (max-width: 1024px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-title {
    font-size: 28px;
  }

  .page-subtitle {
    font-size: 16px;
  }

  .stat-icon {
    width: 72px;
    height: 72px;
  }

  .stat-value {
    font-size: 32px;
  }

  .stat-title {
    font-size: 16px;
  }

  .action-btn {
    height: 56px;
    font-size: 18px;
  }
}

/* Touch-friendly optimizations */
@media (pointer: coarse) {
  .stat-card {
    cursor: pointer;
  }

  .action-btn {
    min-height: 60px;
  }
}
</style>
