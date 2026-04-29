<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Goods, Money, List, Plus, Document, User, CreditCard, Warning } from '@element-plus/icons-vue';
import { dashboardService } from '@/features/dashboard/services/dashboardService';
import type { DashboardStats } from '@/features/dashboard/types/dashboard.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';
import { ElMessage } from 'element-plus';

defineOptions({ name: 'Dashboard' });

const router = useRouter();
const { t } = useI18n();

const stats = ref<DashboardStats>({
  totalProducts: 0,
  totalCustomers: 0,
  totalRevenue: 0,
  totalDebt: 0,
  debtOrders: 0,
  todayRevenue: 0,
  todayOrders: 0,
});

const loading = ref(true);

onMounted(async () => {
  try {
    const data = await dashboardService.getStats();
    if (data) stats.value = data;
  } catch {
    ElMessage.error('Không tải được thống kê');
  } finally {
    loading.value = false;
  }
});

const statCards = [
  { title: 'Doanh thu hôm nay', key: 'todayRevenue', icon: Money, color: '#67C23A', isCurrency: true },
  { title: 'Đơn hôm nay', key: 'todayOrders', icon: Document, color: '#409EFF', isCurrency: false },
  { title: 'Đơn đang nợ', key: 'debtOrders', icon: Warning, color: '#F56C6C', isCurrency: false },
  { title: 'Tổng nợ khách', key: 'totalDebt', icon: CreditCard, color: '#E6A23C', isCurrency: true },
  { title: 'Sản phẩm', key: 'totalProducts', icon: Goods, color: '#909399', isCurrency: false },
  { title: 'Khách hàng', key: 'totalCustomers', icon: User, color: '#909399', isCurrency: false },
];

const goProducts = (): void => { router.push('/products'); };
const goOrders = (): void => { router.push('/order-workspace'); };
const goCustomers = (): void => { router.push('/customers'); };
const goOrderList = (): void => { router.push('/orders'); };
</script>

<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('dashboard.title') }}</h1>
        <p class="page-subtitle">{{ t('dashboard.subtitle') }}</p>
      </div>
      <el-button type="success" :icon="Document" @click="goOrders">
        Tạo đơn hàng
      </el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="8" :lg="4" v-for="card in statCards" :key="card.key">
        <el-card class="stat-card" shadow="hover" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: card.color + '18', color: card.color }">
              <el-icon :size="28"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ card.isCurrency
                  ? formatCurrencyVnd(stats[card.key as keyof DashboardStats] as number)
                  : (stats[card.key as keyof DashboardStats] as number).toLocaleString()
                }}
              </div>
              <div class="stat-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="actions-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header><span>Thao tác nhanh</span></template>
          <div class="quick-actions">
            <el-button type="primary" plain size="large" @click="goOrders">
              <el-icon><Plus /></el-icon> Tạo đơn mới
            </el-button>
            <el-button type="warning" plain size="large" @click="goOrderList">
              <el-icon><List /></el-icon> Xem danh sách đơn
            </el-button>
            <el-button plain size="large" @click="goProducts">
              <el-icon><Goods /></el-icon> Quản lý sản phẩm
            </el-button>
            <el-button plain size="large" @click="goCustomers">
              <el-icon><User /></el-icon> Quản lý khách hàng
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-page { padding: 8px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.stats-row { margin-bottom: 16px; }

.stat-card { margin-bottom: 16px; }

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info { flex: 1; min-width: 0; }

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 3px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-actions .el-button {
  margin: 0;
}
</style>

