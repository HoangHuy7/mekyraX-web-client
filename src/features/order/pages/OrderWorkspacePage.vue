<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Plus, Delete, Printer, View, RefreshRight, CircleCheck } from '@element-plus/icons-vue';
import { customerService } from '@/features/customer/services/customerService';
import { productService } from '@/features/product/services/productService';
import { orderService } from '@/features/order/services/orderService';
import MoneyInput from '@/shared/components/common/MoneyInput.vue';
import type { Customer } from '@/features/customer/types/customer.types';
import type { Product } from '@/features/product/types/product.types';
import type { CreateOrderInput, CreateOrderItemInput, Order } from '@/features/order/types/order.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const router = useRouter();
const { t } = useI18n();

// ── State ────────────────────────────────────────────────────────────────────
const submitting = ref(false);
const loadingMeta = ref(true);
const loadingRecent = ref(false);
const printingOrderId = ref<string | null>(null);

const customerOptions = ref<Customer[]>([]);
const productOptions = ref<Product[]>([]);
const recentOrders = ref<Order[]>([]);

// Đơn vừa tạo - dùng để show success state
const createdOrder = ref<Order | null>(null);

const form = reactive({
  customerId: '',
  paidAmount: 0,
  note: '',
});

const lineItems = ref<CreateOrderItemInput[]>([{ productId: '', quantity: 1, price: 0 }]);

// ── Computed ─────────────────────────────────────────────────────────────────
const subtotal = computed(() =>
  lineItems.value.reduce((sum, item) => sum + item.quantity * item.price, 0)
);
const debtAmount = computed(() => Math.max(0, subtotal.value - form.paidAmount));
const isDebt = computed(() => debtAmount.value > 0);

const selectedCustomer = computed(() =>
  customerOptions.value.find((c) => c.id === form.customerId) ?? null
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => formatCurrencyVnd(v);

const getStatusType = (status: string) => {
  if (status === 'paid') return 'success';
  if (status === 'debt') return 'danger';
  if (status === 'delivery') return 'primary';
  return 'info';
};

const getStatusLabel = (status: string) => {
  if (status === 'paid') return 'Đã TT';
  if (status === 'debt') return 'Còn nợ';
  if (status === 'delivery') return 'Giao hàng';
  return status;
};

const timeAgo = (iso?: string): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

// ── Data loading ─────────────────────────────────────────────────────────────
const loadMeta = async () => {
  loadingMeta.value = true;
  try {
    const [customersResult, productsResult] = await Promise.all([
      customerService.fetchCustomers(undefined, { page: 1, pageSize: 300 }),
      productService.fetchProducts(undefined, { page: 1, pageSize: 300 }),
    ]);
    customerOptions.value = customersResult.items;
    productOptions.value = productsResult.items;
  } finally {
    loadingMeta.value = false;
  }
};

const loadRecentOrders = async () => {
  loadingRecent.value = true;
  try {
    const result = await orderService.fetchOrders(undefined, { page: 1, pageSize: 10 });
    recentOrders.value = result.items;
  } finally {
    loadingRecent.value = false;
  }
};

onMounted(() => Promise.all([loadMeta(), loadRecentOrders()]));

// ── Line item actions ────────────────────────────────────────────────────────
const addLineItem = () => lineItems.value.push({ productId: '', quantity: 1, price: 0 });

const removeLineItem = (index: number) => {
  if (lineItems.value.length > 1) lineItems.value.splice(index, 1);
};

const onSelectProduct = (index: number) => {
  const p = productOptions.value.find((p) => p.id === lineItems.value[index].productId);
  if (p) lineItems.value[index].price = p.price;
};

// Điền nhanh số tiền
const payFull = () => { form.paidAmount = subtotal.value; };
const payNone = () => { form.paidAmount = 0; };

// ── Draft reset ──────────────────────────────────────────────────────────────
const resetDraft = () => {
  createdOrder.value = null;
  form.customerId = '';
  form.paidAmount = 0;
  form.note = '';
  lineItems.value = [{ productId: '', quantity: 1, price: 0 }];
};

// ── Validation ───────────────────────────────────────────────────────────────
const validateDraft = (): boolean => {
  if (lineItems.value.length === 0) {
    ElMessage.error(t('orderWorkspace.oneItemRequired'));
    return false;
  }
  if (lineItems.value.some((item) => !item.productId || item.quantity <= 0 || item.price < 0)) {
    ElMessage.error(t('orderWorkspace.invalidItem'));
    return false;
  }
  if (form.paidAmount < 0) {
    ElMessage.error(t('orderWorkspace.paidAmountInvalid'));
    return false;
  }
  return true;
};

// ── Create ───────────────────────────────────────────────────────────────────
const createOrder = async () => {
  if (!validateDraft()) return;

  const input: CreateOrderInput = {
    customerId: form.customerId || undefined,
    paidAmount: form.paidAmount,
    note: form.note || undefined,
    items: lineItems.value.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  submitting.value = true;
  try {
    const created = await orderService.createOrder(input);
    createdOrder.value = created;
    ElMessage.success(`Đã tạo đơn ${created.code || created.id}`);
    await loadRecentOrders();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('orderWorkspace.createOrderFailed'));
  } finally {
    submitting.value = false;
  }
};

// ── Print ────────────────────────────────────────────────────────────────────
const printOrder = async (id: string) => {
  printingOrderId.value = id;
  try {
    const blob = await orderService.printOrder(id);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'In đơn thất bại');
  } finally {
    printingOrderId.value = null;
  }
};

const viewOrder = (id: string) => router.push(`/orders/${id}`);
</script>

<template>
  <div class="ow-page">
    <!-- ── Page header ─────────────────────────────────────────────────────── -->
    <div class="ow-header">
      <div>
        <h1 class="ow-title">{{ t('orderWorkspace.title') }}</h1>
        <p class="ow-subtitle">{{ t('orderWorkspace.subtitle') }}</p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- ════════════════════════════════ LEFT: Form ══════════════════════ -->
      <el-col :xs="24" :lg="15" :xl="16">

        <!-- ── Success state ────────────────────────────────────────────── -->
        <div v-if="createdOrder" class="success-card">
          <div class="success-icon"><el-icon :size="36" color="#67c23a"><CircleCheck /></el-icon></div>
          <div class="success-body">
            <div class="success-code">{{ createdOrder.code }}</div>
            <div class="success-meta">
              {{ createdOrder.customer?.name || 'Khách lẻ' }}
              <span class="success-divider">·</span>
              <el-tag size="small" :type="getStatusType(createdOrder.status)" effect="dark">
                {{ getStatusLabel(createdOrder.status) }}
              </el-tag>
            </div>
            <div class="success-amounts">
              <div class="success-amount-item">
                <span class="sa-label">Tổng tiền</span>
                <span class="sa-value">{{ fmt(createdOrder.totalAmount) }}</span>
              </div>
              <div class="success-amount-item">
                <span class="sa-label">Đã trả</span>
                <span class="sa-value paid">{{ fmt(createdOrder.paidAmount) }}</span>
              </div>
              <div v-if="createdOrder.debtAmount > 0" class="success-amount-item">
                <span class="sa-label">Còn nợ</span>
                <span class="sa-value debt">{{ fmt(createdOrder.debtAmount) }}</span>
              </div>
            </div>
          </div>
          <div class="success-actions">
            <el-button
              type="warning"
              :icon="Printer"
              :loading="printingOrderId === createdOrder.id"
              @click="printOrder(createdOrder.id)"
              size="large"
            >
              In đơn
            </el-button>
            <el-button type="primary" :icon="Plus" size="large" @click="resetDraft">
              Tạo đơn mới
            </el-button>
          </div>
        </div>

        <!-- ── Order form ───────────────────────────────────────────────── -->
        <el-card v-else shadow="never" class="form-card" v-loading="loadingMeta">
          <template #header>
            <div class="card-header-row">
              <span class="card-title">Tạo đơn hàng</span>
              <el-tag
                :type="isDebt ? 'danger' : 'success'"
                effect="plain"
                size="small"
              >
                {{ isDebt ? 'Còn nợ ' + fmt(debtAmount) : 'Thanh toán đủ' }}
              </el-tag>
            </div>
          </template>

          <!-- Customer + Note row -->
          <el-row :gutter="12" class="mb-12">
            <el-col :span="14">
              <div class="field-label">Khách hàng <span class="optional">(không bắt buộc)</span></div>
              <el-select
                v-model="form.customerId"
                placeholder="Chọn khách hàng..."
                clearable
                filterable
                style="width:100%"
              >
                <el-option
                  v-for="c in customerOptions"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                >
                  <span>{{ c.name }}</span>
                  <span v-if="c.phone" class="opt-sub"> · {{ c.phone }}</span>
                </el-option>
              </el-select>
              <div v-if="selectedCustomer?.totalDebt" class="customer-debt-hint">
                Nợ hiện tại: <b class="debt-text">{{ fmt(selectedCustomer.totalDebt) }}</b>
              </div>
            </el-col>
          </el-row>

          <!-- Items header -->
          <div class="items-header">
            <div class="field-label mb-0">Danh sách sản phẩm</div>
            <el-button :icon="Plus" size="small" type="primary" plain @click="addLineItem">
              Thêm sản phẩm
            </el-button>
          </div>

          <!-- Column headers -->
          <div class="item-col-headers">
            <span class="col-product">Sản phẩm</span>
            <span class="col-qty">SL</span>
            <span class="col-price">Đơn giá</span>
            <span class="col-total">Thành tiền</span>
            <span class="col-del"></span>
          </div>

          <!-- Item rows -->
          <div class="items-list">
            <div
              v-for="(item, index) in lineItems"
              :key="index"
              class="item-row"
            >
              <div class="col-product">
                <el-select
                  v-model="item.productId"
                  placeholder="Chọn sản phẩm"
                  filterable
                  style="width:100%"
                  @change="onSelectProduct(index)"
                >
                  <el-option
                    v-for="p in productOptions"
                    :key="p.id"
                    :label="p.name"
                    :value="p.id"
                  >
                    <span>{{ p.name }}</span>
                    <span class="opt-sub"> · {{ fmt(p.price) }}</span>
                  </el-option>
                </el-select>
              </div>
              <div class="col-qty">
                <el-input-number
                  v-model="item.quantity"
                  :min="1"
                  controls-position="right"
                  style="width:100%"
                />
              </div>
              <div class="col-price">
                <MoneyInput
                  v-model="item.price"
                  :min="0"
                  :step="1000"
                  style="width:100%"
                />
              </div>
              <div class="col-total line-total">
                {{ fmt(item.quantity * item.price) }}
              </div>
              <div class="col-del">
                <el-button
                  text
                  type="danger"
                  :icon="Delete"
                  :disabled="lineItems.length === 1"
                  @click="removeLineItem(index)"
                />
              </div>
            </div>
          </div>

          <!-- Note textarea -->
          <div class="field-label mt-12">Ghi chú <span class="optional">(không bắt buộc)</span></div>
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="Ghi chú đơn hàng..."
            class="mb-12"
          />

          <!-- Summary + Paid -->
          <div class="bottom-section">
            <div class="paid-section">
              <div class="field-label">Số tiền khách trả</div>
              <div class="paid-row">
                <MoneyInput
                  v-model="form.paidAmount"
                  :min="0"
                  :step="10000"
                  style="flex:1"
                />
                <el-button size="small" @click="payFull">Trả đủ</el-button>
                <el-button size="small" @click="payNone">Ghi nợ</el-button>
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-row">
                <span>Tạm tính</span>
                <strong>{{ fmt(subtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>Đã trả</span>
                <strong class="paid-text">{{ fmt(form.paidAmount) }}</strong>
              </div>
              <div class="summary-row summary-row--total">
                <span>{{ isDebt ? 'Còn nợ' : 'Thừa tiền' }}</span>
                <strong :class="isDebt ? 'debt-text' : 'paid-text'">
                  {{ fmt(Math.abs(debtAmount)) }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <el-button :icon="RefreshRight" @click="resetDraft">Làm mới</el-button>
            <el-button
              type="primary"
              size="large"
              :loading="submitting"
              :disabled="lineItems.every(i => !i.productId)"
              @click="createOrder"
            >
              ✓ Tạo đơn hàng
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- ═══════════════════════════ RIGHT: Recent orders ═════════════════ -->
      <el-col :xs="24" :lg="9" :xl="8">
        <el-card shadow="never" class="recent-card" v-loading="loadingRecent">
          <template #header>
            <div class="card-header-row">
              <span class="card-title">Đơn gần đây</span>
              <el-button text :icon="RefreshRight" size="small" @click="loadRecentOrders" />
            </div>
          </template>

          <el-empty v-if="recentOrders.length === 0" description="Chưa có đơn hàng" :image-size="60" />

          <div v-else class="recent-list">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="recent-item"
              :class="{ 'recent-item--new': createdOrder?.id === order.id }"
            >
              <div class="ri-left">
                <div class="ri-code">{{ order.code || order.id.slice(0, 8) }}</div>
                <div class="ri-customer">
                  {{ order.customer?.name || 'Khách lẻ' }}
                </div>
                <div class="ri-time">{{ timeAgo(order.createdAt) }}</div>
              </div>
              <div class="ri-right">
                <div class="ri-amount">{{ fmt(order.totalAmount) }}</div>
                <el-tag size="small" :type="getStatusType(order.status)" effect="light" class="ri-tag">
                  {{ getStatusLabel(order.status) }}
                </el-tag>
                <div class="ri-btns">
                  <el-button
                    size="small"
                    :icon="Printer"
                    :loading="printingOrderId === order.id"
                    @click="printOrder(order.id)"
                  />
                  <el-button
                    size="small"
                    :icon="View"
                    @click="viewOrder(order.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
export default { name: 'OrderWorkspacePage' };
</script>

<style scoped>
/* ── Page ──────────────────────────────────────────────────────────────────── */
.ow-page { padding: 12px 16px; }

.ow-header {
  margin-bottom: 16px;
}
.ow-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.ow-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ── Success card ──────────────────────────────────────────────────────────── */
.success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 24px;
  border: 2px solid var(--el-color-success-light-5);
  border-radius: 12px;
  background: var(--el-color-success-light-9);
  text-align: center;
}
.success-icon { line-height: 1; }
.success-code {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.success-meta {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.success-divider { color: var(--el-border-color); }

.success-amounts {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.success-amount-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.sa-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sa-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.sa-value.paid { color: var(--el-color-success); }
.sa-value.debt { color: var(--el-color-danger); }

.success-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* ── Form card ─────────────────────────────────────────────────────────────── */
.form-card { border-radius: 12px; border: 1px solid var(--el-border-color-lighter); }
.recent-card { border-radius: 12px; border: 1px solid var(--el-border-color-lighter); }

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ── Fields ────────────────────────────────────────────────────────────────── */
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.field-label.mb-0 { margin-bottom: 0; }
.optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--el-text-color-secondary); }
.mb-12 { margin-bottom: 12px; }
.mt-12 { margin-top: 12px; }

.opt-sub { color: var(--el-text-color-secondary); font-size: 12px; }
.customer-debt-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* ── Items table ────────────────────────────────────────────────────────────── */
.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.item-col-headers,
.item-row {
  display: grid;
  grid-template-columns: 1fr 80px 120px 110px 36px;
  gap: 8px;
  align-items: center;
}
.item-col-headers {
  padding: 0 4px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--el-text-color-secondary);
}
.col-total { text-align: right; }
.col-del { text-align: center; }

.items-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }

.item-row {
  padding: 8px 4px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  transition: background 0.15s;
}
.item-row:hover { background: var(--el-fill-color-light); }

.line-total {
  font-weight: 700;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

/* ── Bottom section ─────────────────────────────────────────────────────────── */
.bottom-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;
}

.paid-section {}
.paid-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.summary-box {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--el-text-color-regular);
  padding: 2px 0;
}
.summary-row--total {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 6px;
  margin-top: 2px;
  font-size: 14px;
}

.paid-text { color: var(--el-color-success); }
.debt-text { color: var(--el-color-danger); }

/* ── Form actions ───────────────────────────────────────────────────────────── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ── Recent orders ──────────────────────────────────────────────────────────── */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  gap: 8px;
}
.recent-item:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
.recent-item--new {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.ri-left { flex: 1; min-width: 0; }
.ri-code {
  font-weight: 700;
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ri-customer {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ri-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.ri-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.ri-amount {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.ri-tag { }
.ri-btns {
  display: flex;
  gap: 4px;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }
  .item-col-headers,
  .item-row {
    grid-template-columns: 1fr 60px 90px 90px 32px;
  }
}
</style>

