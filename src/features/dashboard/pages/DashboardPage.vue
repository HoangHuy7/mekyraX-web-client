<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Goods, Money, List, Plus, Document, User, CreditCard, Warning, Printer } from '@element-plus/icons-vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { dashboardService } from '@/features/dashboard/services/dashboardService';
import type { DashboardStats, DailySalesPoint, MonthlySalesPoint } from '@/features/dashboard/types/dashboard.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';
import { ElMessage } from 'element-plus';

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

defineOptions({ name: 'Dashboard' });

const router = useRouter();
const { t } = useI18n();

// ── State ─────────────────────────────────────────────────────────────────────
const stats = ref<DashboardStats>({
  totalProducts: 0, totalCustomers: 0, totalRevenue: 0,
  totalDebt: 0, debtOrders: 0, todayRevenue: 0, todayOrders: 0,
});
const dailySales = ref<DailySalesPoint[]>([]);
const monthlySales = ref<MonthlySalesPoint[]>([]);
const loading = ref(true);
const chartsLoading = ref(true);

onMounted(async () => {
  try {
    const now = new Date();
    const from30 = new Date(now); from30.setDate(now.getDate() - 29);
    const [s, daily, monthly] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getSalesByDay(from30, now),
      dashboardService.getSalesByMonth(now.getFullYear()),
    ]);
    if (s) stats.value = s;
    dailySales.value = daily;
    monthlySales.value = monthly;
  } catch {
    ElMessage.error('Không tải được dữ liệu dashboard');
  } finally {
    loading.value = false;
    chartsLoading.value = false;
  }
});

// ── Stat cards ────────────────────────────────────────────────────────────────
const statCards = [
  { title: 'Doanh thu hôm nay', key: 'todayRevenue', icon: Money, color: '#67C23A', isCurrency: true },
  { title: 'Đơn hôm nay', key: 'todayOrders', icon: Document, color: '#409EFF', isCurrency: false },
  { title: 'Đơn đang nợ', key: 'debtOrders', icon: Warning, color: '#F56C6C', isCurrency: false },
  { title: 'Tổng nợ khách', key: 'totalDebt', icon: CreditCard, color: '#E6A23C', isCurrency: true },
  { title: 'Sản phẩm', key: 'totalProducts', icon: Goods, color: '#909399', isCurrency: false },
  { title: 'Khách hàng', key: 'totalCustomers', icon: User, color: '#909399', isCurrency: false },
];

// ── Chart: 30 ngày gần đây (Line) ────────────────────────────────────────────
const lineOption = computed(() => {
  // Fill missing days with 0
  const days: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  for (const p of dailySales.value) {
    const key = p.date ? p.date.slice(0, 10) : '';
    if (key in days) days[key] = p.total;
  }
  const labels = Object.keys(days).map((d) => {
    const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`;
  });
  const values = Object.values(days);

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/><b>${formatCurrencyVnd(p.value)}</b>`;
      },
    },
    grid: { left: 16, right: 16, top: 16, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { color: '#999', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#999', fontSize: 11, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}` }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#409EFF', width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(64,158,255,0.25)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }] } },
    }],
  };
});

// ── Chart: doanh thu theo tháng năm nay (Bar) ─────────────────────────────────
const barOption = computed(() => {
  const months: Record<string, number> = {};
  for (let m = 1; m <= 12; m++) months[`Th${m}`] = 0;
  for (const p of monthlySales.value) {
    if (!p.month) continue;
    const dt = new Date(p.month);
    months[`Th${dt.getMonth() + 1}`] = p.total;
  }
  const labels = Object.keys(months);
  const values = Object.values(months);
  const maxVal = Math.max(...values, 1);

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/><b>${formatCurrencyVnd(p.value)}</b>`;
      },
    },
    grid: { left: 16, right: 16, top: 16, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: labels, axisTick: { show: false }, axisLabel: { color: '#999', fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { color: '#999', fontSize: 11, formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}` }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [{
      data: values.map((v) => ({
        value: v,
        itemStyle: { color: v === maxVal && maxVal > 0 ? '#67C23A' : '#409EFF', borderRadius: [4, 4, 0, 0] },
      })),
      type: 'bar',
      barMaxWidth: 36,
    }],
  };
});

// ── Navigation ────────────────────────────────────────────────────────────────
const goProducts = () => router.push('/products');
const goOrders = () => router.push('/order-workspace');
const goCustomers = () => router.push('/customers');
const goOrderList = () => router.push('/orders');

// ── Print ─────────────────────────────────────────────────────────────────────
const printing = ref(false);
const printDashboard = async () => {
  printing.value = true;
  try {
    await dashboardService.printDashboard();
    ElMessage.success('Xuất báo cáo thành công');
  } catch {
    ElMessage.error('Không thể xuất báo cáo');
  } finally {
    printing.value = false;
  }
};
</script>

<template>
  <div class="dashboard-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('dashboard.title') }}</h1>
        <p class="page-subtitle">{{ t('dashboard.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <el-button type="success" :icon="Document" @click="goOrders">Tạo đơn hàng</el-button>
        <el-button type="primary" plain :icon="Printer" :loading="printing" @click="printDashboard">
          In báo cáo
        </el-button>
      </div>
    </div>

    <!-- Stat cards -->
    <el-row :gutter="14" class="stats-row">
      <el-col :xs="12" :sm="8" :lg="4" v-for="card in statCards" :key="card.key">
        <el-card class="stat-card" shadow="hover" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: card.color + '18', color: card.color }">
              <el-icon :size="26"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">
                {{ card.isCurrency
                  ? formatCurrencyVnd(stats[card.key as keyof DashboardStats] as number)
                  : (stats[card.key as keyof DashboardStats] as number).toLocaleString() }}
              </div>
              <div class="stat-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="16" class="charts-row">
      <!-- Line: 30 ngày -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">Doanh thu 30 ngày gần đây</span>
            </div>
          </template>
          <div v-loading="chartsLoading" class="chart-wrap">
            <v-chart :option="lineOption" autoresize />
          </div>
        </el-card>
      </el-col>

      <!-- Quick actions -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header><span class="chart-title">Thao tác nhanh</span></template>
          <div class="quick-actions">
            <el-button type="primary" plain size="large" class="action-btn" @click="goOrders">
              <el-icon><Plus /></el-icon> Tạo đơn mới
            </el-button>
            <el-button type="warning" plain size="large" class="action-btn" @click="goOrderList">
              <el-icon><List /></el-icon> Danh sách đơn hàng
            </el-button>
            <el-button plain size="large" class="action-btn" @click="goProducts">
              <el-icon><Goods /></el-icon> Quản lý sản phẩm
            </el-button>
            <el-button plain size="large" class="action-btn" @click="goCustomers">
              <el-icon><User /></el-icon> Quản lý khách hàng
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Bar: theo tháng -->
    <el-row :gutter="16" class="charts-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">Doanh thu theo tháng — {{ new Date().getFullYear() }}</span>
            </div>
          </template>
          <div v-loading="chartsLoading" class="chart-wrap chart-wrap--bar">
            <v-chart :option="barOption" autoresize />
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
  margin-bottom: 18px;
}
.header-actions { display: flex; gap: 8px; align-items: center; }
.page-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: var(--el-text-color-primary); }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }

/* stat cards */
.stats-row { margin-bottom: 14px; }
.stat-card { margin-bottom: 14px; }
:deep(.stat-card .el-card__body) { padding: 14px; }
.stat-content { display: flex; align-items: center; gap: 12px; }
.stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-info { flex: 1; min-width: 0; }
.stat-value { font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-title { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 3px; }

/* charts */
.charts-row { margin-bottom: 14px; }
.chart-card { margin-bottom: 14px; }
.chart-header { display: flex; align-items: center; justify-content: space-between; }
.chart-title { font-weight: 600; font-size: 14px; color: var(--el-text-color-primary); }
.chart-wrap { height: 260px; }
.chart-wrap--bar { height: 220px; }
.chart-wrap :deep(.v-chart) { width: 100%; height: 100%; }

/* quick actions */
.quick-actions { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
.action-btn { justify-content: flex-start; margin: 0 !important; }
</style>


