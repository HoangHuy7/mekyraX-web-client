<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Plus, Delete, RefreshRight, View } from '@element-plus/icons-vue';
import { customerService } from '@/features/customer/services/customerService';
import { productService } from '@/features/product/services/productService';
import { orderService } from '@/features/order/services/orderService';
import type { Customer } from '@/features/customer/types/customer.types';
import type { Product } from '@/features/product/types/product.types';
import type { CreateOrderInput, CreateOrderItemInput, Order } from '@/features/order/types/order.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const router = useRouter();
const { t } = useI18n();

const submitting = ref(false);
const loadingMeta = ref(true);
const loadingRecent = ref(false);
const customerOptions = ref<Customer[]>([]);
const productOptions = ref<Product[]>([]);
const recentOrders = ref<Order[]>([]);

const form = reactive({
  customerId: '',
  paidAmount: 0,
  note: '',
});

const lineItems = ref<CreateOrderItemInput[]>([
  {
    productId: '',
    quantity: 1,
    price: 0,
  },
]);

const availableProducts = computed(() => productOptions.value);

const subtotal = computed(() =>
  lineItems.value.reduce((sum, item) => sum + item.quantity * item.price, 0)
);

const debtAmount = computed(() => Math.max(0, subtotal.value - form.paidAmount));

const statusPreview = computed(() =>
  debtAmount.value > 0 ? t('orderWorkspace.statusDebt') : t('orderWorkspace.statusPaid')
);
const statusPreviewType = computed(() => (debtAmount.value > 0 ? 'warning' : 'success'));

const formatCurrency = (value: number): string =>
  formatCurrencyVnd(value);

const getStatusType = (status: string): string => {
  if (status === 'paid') return 'success';
  if (status === 'debt') return 'warning';
  if (status === 'delivery') return 'primary';
  return 'info';
};

const loadMeta = async (): Promise<void> => {
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

const loadRecentOrders = async (): Promise<void> => {
  loadingRecent.value = true;
  try {
    const result = await orderService.fetchOrders(undefined, { page: 1, pageSize: 8 });
    recentOrders.value = result.items;
  } finally {
    loadingRecent.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadMeta(), loadRecentOrders()]);
});

const addLineItem = (): void => {
  lineItems.value.push({
    productId: '',
    quantity: 1,
    price: 0,
  });
};

const removeLineItem = (index: number): void => {
  if (lineItems.value.length === 1) {
    return;
  }
  lineItems.value.splice(index, 1);
};

const onSelectProduct = (index: number): void => {
  const selected = availableProducts.value.find((item) => item.id === lineItems.value[index].productId);
  if (!selected) {
    return;
  }
  lineItems.value[index].price = selected.price;
};

const resetDraft = (): void => {
  form.customerId = '';
  form.paidAmount = 0;
  form.note = '';
  lineItems.value = [
    {
      productId: '',
      quantity: 1,
      price: 0,
    },
  ];
};

const validateDraft = (): boolean => {
  if (lineItems.value.length === 0) {
    ElMessage.error(t('orderWorkspace.oneItemRequired'));
    return false;
  }

  const hasInvalidItem = lineItems.value.some(
    (item) => !item.productId || item.quantity <= 0 || item.price < 0
  );
  if (hasInvalidItem) {
    ElMessage.error(t('orderWorkspace.invalidItem'));
    return false;
  }

  if (form.paidAmount < 0) {
    ElMessage.error(t('orderWorkspace.paidAmountInvalid'));
    return false;
  }

  return true;
};

const createOrder = async (): Promise<void> => {
  if (!validateDraft()) {
    return;
  }

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
    ElMessage.success(t('orderWorkspace.createOrderSuccess', { code: created.code || created.id }));
    resetDraft();
    await loadRecentOrders();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('orderWorkspace.createOrderFailed'));
  } finally {
    submitting.value = false;
  }
};

const viewOrder = (id: string): void => {
  router.push(`/orders/${id}`);
};
</script>

<template>
  <div class="order-workspace-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('orderWorkspace.title') }}</h1>
        <p class="page-subtitle">{{ t('orderWorkspace.subtitle') }}</p>
      </div>
      <el-button :icon="RefreshRight" @click="resetDraft">{{ t('orderWorkspace.newDraft') }}</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :xl="16">
        <el-card shadow="hover" v-loading="loadingMeta">
          <template #header>
            <div class="card-header">
              <span>{{ t('orderWorkspace.createOrder') }}</span>
              <el-tag :type="statusPreviewType" effect="plain">{{ statusPreview }}</el-tag>
            </div>
          </template>

          <el-form label-position="top">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="t('orderWorkspace.customerOptional')">
                  <el-select
                    v-model="form.customerId"
                    :placeholder="t('orderWorkspace.selectCustomer')"
                    clearable
                    filterable
                  >
                    <el-option
                      v-for="customer in customerOptions"
                      :key="customer.id"
                      :label="customer.name"
                      :value="customer.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('orderWorkspace.paidAmount')">
                  <el-input-number v-model="form.paidAmount" :min="0" :step="0.01" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item :label="t('orderWorkspace.orderItems')">
              <div class="items-wrapper">
                <div v-for="(item, index) in lineItems" :key="index" class="item-row">
                  <el-row :gutter="12" style="width: 100%">
                    <el-col :span="10">
                      <el-select
                        v-model="item.productId"
                        :placeholder="t('orderWorkspace.selectProduct')"
                        filterable
                        @change="onSelectProduct(index)"
                      >
                        <el-option
                          v-for="product in availableProducts"
                          :key="product.id"
                          :label="`${product.name} (${formatCurrency(product.price)})`"
                          :value="product.id"
                        />
                      </el-select>
                    </el-col>
                    <el-col :span="4">
                      <el-input-number v-model="item.quantity" :min="1" :step="1" style="width: 100%" />
                    </el-col>
                    <el-col :span="5">
                      <el-input-number v-model="item.price" :min="0" :step="0.01" style="width: 100%" />
                    </el-col>
                    <el-col :span="3" class="line-total">
                      {{ formatCurrency(item.quantity * item.price) }}
                    </el-col>
                    <el-col :span="2" class="line-actions">
                      <el-button text type="danger" :icon="Delete" @click="removeLineItem(index)" />
                    </el-col>
                  </el-row>
                </div>

                <el-button :icon="Plus" plain type="primary" @click="addLineItem">
                  {{ t('orderWorkspace.addItem') }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item :label="t('orderWorkspace.note')">
              <el-input v-model="form.note" type="textarea" :rows="3" :placeholder="t('orderWorkspace.orderNote')" />
            </el-form-item>
          </el-form>

          <div class="summary">
            <div class="summary-line">
              <span>{{ t('orderWorkspace.subtotal') }}</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>
            <div class="summary-line">
              <span>{{ t('orderWorkspace.paid') }}</span>
              <strong>{{ formatCurrency(form.paidAmount) }}</strong>
            </div>
            <div class="summary-line">
              <span>{{ t('orderWorkspace.debt') }}</span>
              <strong>{{ formatCurrency(debtAmount) }}</strong>
            </div>
          </div>

          <div class="actions">
            <el-button size="large" @click="resetDraft">{{ t('common.reset') }}</el-button>
            <el-button size="large" type="primary" :loading="submitting" @click="createOrder">
              {{ t('orderWorkspace.createOrder') }}
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :xl="8">
        <el-card shadow="hover" v-loading="loadingRecent">
          <template #header>
            <span>{{ t('orderWorkspace.recentOrders') }}</span>
          </template>

          <el-empty v-if="recentOrders.length === 0" :description="t('orderWorkspace.noOrdersYet')" />

          <div v-else class="recent-list">
            <div v-for="order in recentOrders" :key="order.id" class="recent-item">
              <div>
                <div class="recent-title">{{ order.code || order.id }}</div>
                <div class="recent-meta">
                  {{ order.customer?.name || t('orderWorkspace.walkIn') }} · {{ formatCurrency(order.totalAmount) }}
                </div>
              </div>
              <div class="recent-actions">
                <el-tag size="small" :type="getStatusType(order.status)">{{ order.status }}</el-tag>
                <el-button link type="primary" :icon="View" @click="viewOrder(order.id)">{{ t('common.view') }}</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
export default {
  name: 'OrderWorkspacePage',
};
</script>

<style scoped>
.order-workspace-page {
  padding: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.items-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.line-total {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-weight: 600;
}

.line-actions {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary {
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin: 12px 0 16px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.recent-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recent-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.recent-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

@media (max-width: 1200px) {
  .page-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style>
