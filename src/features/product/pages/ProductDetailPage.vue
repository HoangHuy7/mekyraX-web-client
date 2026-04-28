<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Delete } from '@element-plus/icons-vue';
import { productService } from '@/features/product/services/productService';
import type { Product, ProductMutationInput } from '@/features/product/types/product.types';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const product = ref<Product | null>(null);
const loading = ref(true);
const editDialogVisible = ref(false);
const saving = ref(false);

const editForm = reactive({
  name: '',
  price: 0,
  category: '',
  unit: '',
  costPrice: 0,
  stockQuantity: 0,
  barcode: '',
});

onMounted(async () => {
  const id = String(route.params.id || '');

  if (!id) {
    router.push('/products');
    return;
  }

  loading.value = true;
  const data = await productService.getProductById(id);
  
  if (data) {
    product.value = data;
  } else {
    router.push('/products');
  }
  loading.value = false;
});

const goBack = (): void => {
  router.push('/products');
};

const formatPrice = (price: number): string => {
  return formatCurrencyVnd(price);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return t('common.notAvailable');
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusType = (status: string): string => {
  return status === 'active' ? 'success' : 'info';
};

const handleDelete = async (): Promise<void> => {
  if (!product.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      t('products.deleteConfirm', { name: product.value.name }),
      t('common.confirmDelete'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );

    await productService.deleteProduct(product.value.id);
    ElMessage.success(t('products.productDeleted'));
    router.push('/products');
  } catch {
    // User cancelled dialog.
  }
};

const openEditDialog = (): void => {
  if (!product.value) {
    return;
  }
  editForm.name = product.value.name;
  editForm.price = product.value.price;
  editForm.category = product.value.category || '';
  editForm.unit = product.value.unit || '';
  editForm.costPrice = product.value.costPrice || 0;
  editForm.stockQuantity = product.value.stockQuantity;
  editForm.barcode = product.value.barcode || '';
  editDialogVisible.value = true;
};

const submitEdit = async (): Promise<void> => {
  if (!product.value) {
    return;
  }
  if (!editForm.name.trim()) {
    ElMessage.error(t('products.productNameRequired'));
    return;
  }
  if (editForm.price < 0 || editForm.stockQuantity < 0) {
    ElMessage.error(t('products.nonNegativePriceStock'));
    return;
  }

  const input: ProductMutationInput = {
    name: editForm.name.trim(),
    price: editForm.price,
    category: editForm.category.trim() || undefined,
    unit: editForm.unit.trim() || undefined,
    costPrice: editForm.costPrice,
    stockQuantity: editForm.stockQuantity,
    barcode: editForm.barcode.trim() || undefined,
  };

  saving.value = true;
  try {
    const updated = await productService.updateProduct(product.value.id, input);
    product.value = updated;
    editDialogVisible.value = false;
    ElMessage.success(t('products.productUpdated'));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('orders.updateFailed'));
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="product-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button 
          :icon="ArrowLeft" 
          circle
          @click="goBack"
          class="back-btn"
        />
        <div>
          <h1 class="page-title">{{ t('products.productDetail') }}</h1>
          <p class="page-subtitle">{{ t('products.productInfo') }}</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Edit" @click="openEditDialog">
          {{ t('common.edit') }}
        </el-button>
        <el-button type="danger" :icon="Delete" plain @click="handleDelete">
          {{ t('common.delete') }}
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" shadow="hover">
      <template v-if="product">
        <div class="product-header">
          <div class="product-meta">{{ product.category || t('products.general') }} · {{ product.unit || t('products.unitFallback') }}</div>
          <el-tag :type="getStatusType(product.status)" size="large">
            {{ product.status }}
          </el-tag>
        </div>

        <h2 class="product-name">{{ product.name }}</h2>

        <el-divider />

        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('products.price')">
            <span class="price">{{ formatPrice(product.price) }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.costPrice')">
            {{ product.costPrice !== undefined ? formatPrice(product.costPrice) : t('common.notAvailable') }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.stockQuantity')">
            {{ product.stockQuantity }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('common.status')">
            <el-tag :type="getStatusType(product.status)">
              {{ product.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.barcode')">
            {{ product.barcode || t('common.notAvailable') }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.imageUrl')">
            {{ product.imgUrl || t('common.notAvailable') }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.updatedAt')">
            {{ formatDate(product.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.createdAt')">
            {{ formatDate(product.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('products.productId')">
            {{ product.id }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <el-empty v-else :description="t('products.productNotFound')" />
    </el-card>

    <el-dialog v-model="editDialogVisible" :title="t('products.editProduct')" width="640px">
      <el-form label-position="top">
        <el-form-item :label="t('products.productName')" required>
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('products.price')" required>
              <el-input-number v-model="editForm.price" :min="0" :step="0.01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('products.costPrice')">
              <el-input-number v-model="editForm.costPrice" :min="0" :step="0.01" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('products.category')">
              <el-input v-model="editForm.category" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('products.unit')">
              <el-input v-model="editForm.unit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('products.stockQuantity')" required>
              <el-input-number v-model="editForm.stockQuantity" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('products.barcode')">
              <el-input v-model="editForm.barcode" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ProductDetail',
};
</script>

<style scoped>
.product-detail-page {
  padding: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  flex-shrink: 0;
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

.header-actions {
  display: flex;
  gap: 12px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.product-meta {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.product-name {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
}
</style>
