<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Edit, Plus, Box } from '@element-plus/icons-vue';
import { productService } from '@/features/product/services/productService';
import { inventoryService, type InventoryLog } from '@/features/product/services/inventoryService';
import MoneyInput from '@/shared/components/common/MoneyInput.vue';
import AppDetailHeader from '@/shared/components/common/AppDetailHeader.vue';
import AppLogsPanel from '@/shared/components/common/AppLogsPanel.vue';
import type { Product, ProductMutationInput } from '@/features/product/types/product.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const product = ref<Product | null>(null);
const loading = ref(true);
const logs = ref<InventoryLog[]>([]);
const logsLoading = ref(false);
const tab = ref<'inventory' | 'audit'>('inventory');

// Edit dialog
const editVisible = ref(false);
const saving = ref(false);
const editForm = reactive({
  name: '', price: 0, category: '', unit: '', costPrice: 0, barcode: '',
});

// Import dialog
const importVisible = ref(false);
const importing = ref(false);
const importForm = reactive({ quantity: 1, note: '' });

onMounted(async () => {
  const id = String(route.params.id || '');
  if (!id) { router.push('/products'); return; }
  loading.value = true;
  const data = await productService.getProductById(id);
  if (!data) { router.push('/products'); return; }
  product.value = data;
  loading.value = false;
  fetchLogs();
});

const fetchLogs = async () => {
  if (!product.value) return;
  logsLoading.value = true;
  logs.value = await inventoryService.fetchLogs(product.value.id, 30);
  logsLoading.value = false;
};

const fmt = (n: number) => formatCurrencyVnd(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

const stockStatus = computed(() => {
  const q = product.value?.stockQuantity ?? 0;
  if (q <= 0) return { type: 'danger' as const, label: 'Hết hàng' };
  if (q <= 5) return { type: 'warning' as const, label: 'Sắp hết' };
  return { type: 'success' as const, label: 'Còn hàng' };
});

// ── Edit ──────────────────────────────────────────────────────────────────────
const openEdit = () => {
  if (!product.value) return;
  Object.assign(editForm, {
    name: product.value.name,
    price: product.value.price,
    category: product.value.category || '',
    unit: product.value.unit || '',
    costPrice: product.value.costPrice || 0,
    barcode: product.value.barcode || '',
  });
  editVisible.value = true;
};

const submitEdit = async () => {
  if (!product.value) return;
  if (!editForm.name.trim()) { ElMessage.error('Tên sản phẩm không được để trống'); return; }
  saving.value = true;
  try {
    const input: ProductMutationInput = {
      name: editForm.name.trim(),
      price: editForm.price,
      category: editForm.category.trim() || undefined,
      unit: editForm.unit.trim() || undefined,
      costPrice: editForm.costPrice,
      barcode: editForm.barcode.trim() || undefined,
    };
    product.value = await productService.updateProduct(product.value.id, input);
    editVisible.value = false;
    ElMessage.success('Đã cập nhật sản phẩm');
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Cập nhật thất bại');
  } finally {
    saving.value = false;
  }
};

// ── Import stock ──────────────────────────────────────────────────────────────
const openImport = () => {
  importForm.quantity = 1;
  importForm.note = '';
  importVisible.value = true;
};

const submitImport = async () => {
  if (!product.value) return;
  if (importForm.quantity <= 0) { ElMessage.error('Số lượng phải lớn hơn 0'); return; }
  importing.value = true;
  try {
    await inventoryService.importStock(product.value.id, importForm.quantity, importForm.note || undefined);
    product.value.stockQuantity += importForm.quantity;
    importVisible.value = false;
    ElMessage.success(`Đã nhập thêm ${importForm.quantity} ${product.value.unit || 'sản phẩm'}`);
    fetchLogs();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Nhập hàng thất bại');
  } finally {
    importing.value = false;
  }
};

const logTypeLabel = (type: string) => ({ import: 'Nhập kho', sale: 'Bán hàng', adjust: 'Điều chỉnh' })[type] ?? type;
const logTypeTag = (type: string): 'success' | 'danger' | 'warning' => ({ import: 'success' as const, sale: 'danger' as const, adjust: 'warning' as const })[type] ?? 'info' as any;
</script>

<template>
  <div class="product-detail-page">
    <!-- Header -->
    <AppDetailHeader
      :title="product?.name || t('products.productDetail')"
      :subtitle="product?.category || product?.barcode || t('products.productInfo')"
      @back="router.push('/products')"
    >
      <template #actions>
        <el-button :icon="Plus" type="success" @click="openImport">{{ t('products.importStock') || 'Nhập hàng' }}</el-button>
        <el-button :icon="Edit" @click="openEdit">{{ t('common.edit') }}</el-button>
      </template>
    </AppDetailHeader>

    <div v-loading="loading">
      <template v-if="product">
        <!-- Top info cards -->
        <el-row :gutter="16" class="mb-16">
          <el-col :span="16">
            <el-card shadow="never" class="info-card">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-meta">
                <el-tag v-if="product.category" size="small" type="info">{{ product.category }}</el-tag>
                <span v-if="product.unit" class="unit-text">· {{ product.unit }}</span>
                <span v-if="product.barcode" class="barcode-text">· {{ product.barcode }}</span>
              </div>
              <el-divider style="margin: 12px 0" />
              <el-row :gutter="24">
                <el-col :span="8">
                  <div class="stat-label">Giá bán</div>
                  <div class="stat-value price-text">{{ fmt(product.price) }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-label">Giá vốn</div>
                  <div class="stat-value">{{ product.costPrice ? fmt(product.costPrice) : '—' }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-label">Lợi nhuận/sp</div>
                  <div class="stat-value profit-text">
                    {{ product.costPrice ? fmt(product.price - product.costPrice) : '—' }}
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="stock-card">
              <div class="stock-icon"><el-icon size="32"><Box /></el-icon></div>
              <div class="stock-number">{{ product.stockQuantity }}</div>
              <div class="stock-unit">{{ product.unit || 'sản phẩm' }} trong kho</div>
              <el-tag :type="stockStatus.type" class="mt-8">{{ stockStatus.label }}</el-tag>
            </el-card>
          </el-col>
        </el-row>

        <!-- Logs tabs -->
        <el-card shadow="never">
          <el-tabs v-model="tab">
            <el-tab-pane :label="t('products.inventoryHistory') || 'Lịch sử kho'" name="inventory">
              <div class="log-actions">
                <el-button link @click="fetchLogs">{{ t('common.reset') }}</el-button>
              </div>
              <el-table :data="logs" v-loading="logsLoading" size="small" style="width:100%">
                <el-table-column label="Loại" width="110">
                  <template #default="{ row }">
                    <el-tag :type="logTypeTag(row.type)" size="small">{{ logTypeLabel(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Số lượng" width="100" align="center">
                  <template #default="{ row }">
                    <span :class="row.quantity > 0 ? 'qty-in' : 'qty-out'">
                      {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="Ghi chú" min-width="160">
                  <template #default="{ row }">{{ row.note || '—' }}</template>
                </el-table-column>
                <el-table-column label="Thời gian" width="150">
                  <template #default="{ row }">
                    <span class="date-text">{{ fmtDate(row.createdAt) }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!logsLoading && logs.length === 0" description="Chưa có lịch sử" :image-size="60" />
            </el-tab-pane>
            <el-tab-pane :label="t('logs.title')" name="audit" lazy>
              <AppLogsPanel entity-type="product" :entity-id="product.id" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </template>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="editVisible" title="Chỉnh sửa sản phẩm" width="560px">
      <el-form label-position="top">
        <el-form-item label="Tên sản phẩm" required>
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Giá bán">
              <MoneyInput v-model="editForm.price" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Giá vốn">
              <MoneyInput v-model="editForm.costPrice" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Danh mục">
              <el-input v-model="editForm.category" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Đơn vị tính">
              <el-input v-model="editForm.unit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Mã vạch">
          <el-input v-model="editForm.barcode" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">Lưu</el-button>
      </template>
    </el-dialog>

    <!-- Import Dialog -->
    <el-dialog v-model="importVisible" title="Nhập hàng vào kho" width="400px">
      <el-descriptions :column="1" border size="small" class="mb-16">
        <el-descriptions-item label="Sản phẩm">{{ product?.name }}</el-descriptions-item>
        <el-descriptions-item label="Tồn kho hiện tại">{{ product?.stockQuantity }} {{ product?.unit }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-position="top">
        <el-form-item label="Số lượng nhập" required>
          <el-input-number v-model="importForm.quantity" :min="1" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="importForm.note" type="textarea" :rows="2" placeholder="Nhà cung cấp, lô hàng..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">Hủy</el-button>
        <el-button type="success" :loading="importing" @click="submitImport">Xác nhận nhập</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
export default { name: 'ProductDetail' };
</script>

<style scoped>
.product-detail-page { padding: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.page-title { font-size: 20px; font-weight: 600; }
.header-actions { display: flex; gap: 10px; }
.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }

.info-card { height: 100%; }
.product-name { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.product-meta { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-secondary); font-size: 13px; }
.unit-text, .barcode-text { font-size: 13px; }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.stat-value { font-size: 18px; font-weight: 600; }
.price-text { color: var(--el-color-primary); }
.profit-text { color: var(--el-color-success); }

.stock-card { text-align: center; padding: 8px 0; }
.stock-icon { color: var(--el-color-primary); margin-bottom: 8px; }
.stock-number { font-size: 48px; font-weight: 700; line-height: 1; color: var(--el-text-color-primary); }
.stock-unit { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; }

.log-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.qty-in { color: var(--el-color-success); font-weight: 600; }
.qty-out { color: var(--el-color-danger); font-weight: 600; }
.date-text { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
