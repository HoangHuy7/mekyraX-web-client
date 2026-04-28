<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Refresh, MoreFilled } from '@element-plus/icons-vue';
import { useProductStore } from '@/features/product/store/productStore';
import type {
  Product,
  ProductMutationInput,
  ProductStatus,
} from '@/features/product/types/product.types';
import AppPagination from '@/shared/components/common/AppPagination.vue';
import { formatCurrencyVnd } from '@/shared/utils/formatters';

const productStore = useProductStore();
const router = useRouter();
const { t } = useI18n();
const searchQuery = ref('');
const statusFilter = ref<ProductStatus | ''>('');

const dialogVisible = ref(false);
const editingProductId = ref<string | null>(null);
const submitting = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

const productForm = reactive({
  name: '',
  price: 0,
  category: '',
  unit: '',
  costPrice: 0,
  stockQuantity: 0,
  barcode: '',
});

onMounted(() => {
  fetchProductsPage();
});

const fetchProductsPage = async (): Promise<void> => {
  await productStore.fetchProducts({
    page: currentPage.value,
    pageSize: pageSize.value,
  });
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => searchQuery.value,
  (newValue) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      productStore.setFilter({ search: newValue });
    }, 300);
  }
);

const handleSearch = (): void => {
  productStore.setFilter({
    search: searchQuery.value,
    status: statusFilter.value || undefined,
  });

  if (currentPage.value === 1) {
    fetchProductsPage();
    return;
  }
  currentPage.value = 1;
};

const handleReset = (): void => {
  searchQuery.value = '';
  statusFilter.value = '';
  productStore.resetFilter();

  if (currentPage.value === 1) {
    fetchProductsPage();
    return;
  }
  currentPage.value = 1;
};

watch([currentPage, pageSize], () => {
  fetchProductsPage();
});

const openCreateDialog = (): void => {
  editingProductId.value = null;
  productForm.name = '';
  productForm.price = 0;
  productForm.category = '';
  productForm.unit = '';
  productForm.costPrice = 0;
  productForm.stockQuantity = 0;
  productForm.barcode = '';
  dialogVisible.value = true;
};

const openEditDialog = (product: Product): void => {
  editingProductId.value = product.id;
  productForm.name = product.name;
  productForm.price = product.price;
  productForm.category = product.category || '';
  productForm.unit = product.unit || '';
  productForm.costPrice = product.costPrice || 0;
  productForm.stockQuantity = product.stockQuantity;
  productForm.barcode = product.barcode || '';
  dialogVisible.value = true;
};

const submitProduct = async (): Promise<void> => {
  if (!productForm.name.trim()) {
    ElMessage.error(t('products.productNameRequired'));
    return;
  }

  if (productForm.price < 0 || productForm.stockQuantity < 0) {
    ElMessage.error(t('products.nonNegativePriceStock'));
    return;
  }

  const input: ProductMutationInput = {
    name: productForm.name.trim(),
    price: productForm.price,
    category: productForm.category.trim() || undefined,
    unit: productForm.unit.trim() || undefined,
    costPrice: productForm.costPrice,
    stockQuantity: productForm.stockQuantity,
    barcode: productForm.barcode.trim() || undefined,
  };

  submitting.value = true;
  try {
    if (editingProductId.value) {
      await productStore.updateProduct(editingProductId.value, input);
      ElMessage.success(t('products.productUpdated'));
    } else {
      await productStore.createProduct(input);
      ElMessage.success(t('products.productCreated'));
    }
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Action failed');
  } finally {
    submitting.value = false;
  }
};

const removeProduct = async (product: Product): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      t('products.deleteConfirm', { name: product.name }),
      t('common.confirmDelete'),
      {
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    await productStore.deleteProduct(product.id);
    ElMessage.success(t('products.productDeleted'));
  } catch {
    // User cancelled dialog.
  }
};

const getStatusType = (status: ProductStatus): string => {
  return status === 'active' ? 'success' : 'info';
};

const formatPrice = (price: number): string => {
  return formatCurrencyVnd(price);
};

const viewProduct = (id: string): void => {
  router.push(`/products/${id}`);
};

const toggleProductStatus = async (id: string, status: ProductStatus): Promise<void> => {
  const nextStatus: ProductStatus = status === 'active' ? 'inactive' : 'active';
  await productStore.updateProductStatus(id, nextStatus);
  ElMessage.success(nextStatus === 'active' ? t('products.productActivated') : t('products.productDeactivated'));
};
</script>

<template>
  <div class="product-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('products.title') }}</h1>
        <p class="page-subtitle">{{ t('products.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        {{ t('products.addProduct') }}
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchQuery"
          :placeholder="t('products.searchPlaceholder')"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" :placeholder="t('products.filterByStatus')" clearable class="status-filter">
          <el-option :label="t('common.active')" value="active" />
          <el-option :label="t('common.inactive')" value="inactive" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          {{ t('common.search') }}
        </el-button>
        <el-button @click="handleReset" :icon="Refresh">
          {{ t('common.reset') }}
        </el-button>
      </div>
    </el-card>

    <el-card shadow="hover" v-loading="productStore.loading">
      <el-table
        :data="productStore.filteredProducts"
        stripe
        style="width: 100%"
        :empty-text="t('products.noProductsFound')"
      >
        <el-table-column prop="name" :label="t('products.productName')" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-name">
              <span class="name">{{ row.name }}</span>
              <span v-if="row.category || row.unit" class="description">
                {{ row.category || t('products.general') }} · {{ row.unit || t('products.unitFallback') }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="price" :label="t('products.price')" width="120" sortable>
          <template #default="{ row }">
            <span class="price">{{ formatPrice(row.price) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="stockQuantity" :label="t('products.stock')" width="100" sortable />

        <el-table-column prop="status" :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.actions')" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click">
              <el-button circle text class="action-menu-btn">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="viewProduct(row.id)">{{ t('products.viewDetail') }}</el-dropdown-item>
                  <el-dropdown-item @click="openEditDialog(row)">{{ t('common.edit') }}</el-dropdown-item>
                  <el-dropdown-item @click="toggleProductStatus(row.id, row.status)">
                    {{ row.status === 'active' ? t('products.deactivate') : t('products.activate') }}
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="removeProduct(row)">
                    {{ t('common.delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">
          {{ t('products.totalProducts', { total: productStore.pageInfo.total }) }}
          {{ t('products.activeInactiveSummary', { active: productStore.activeProductsCount, inactive: productStore.inactiveProductsCount }) }}
        </span>
      </div>

      <AppPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="productStore.pageInfo.total"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingProductId ? t('products.editProduct') : t('products.createProduct')"
      width="640px"
    >
      <el-form label-position="top">
        <el-form-item :label="t('products.productName')" required>
          <el-input v-model="productForm.name" :placeholder="t('products.productName')" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('products.price')" required>
              <el-input-number v-model="productForm.price" :min="0" :step="0.01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('products.costPrice')">
              <el-input-number v-model="productForm.costPrice" :min="0" :step="0.01" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('products.category')">
              <el-input v-model="productForm.category" :placeholder="t('products.category')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('products.unit')">
              <el-input v-model="productForm.unit" :placeholder="t('products.unit')" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('products.stockQuantity')" required>
              <el-input-number v-model="productForm.stockQuantity" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('products.barcode')">
              <el-input v-model="productForm.barcode" :placeholder="t('products.barcode')" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProduct">
          {{ t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ProductListPage',
};
</script>

<style scoped>
.product-list-page {
  padding: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 100%;
  max-width: 360px;
}

.status-filter {
  width: 180px;
  min-width: 160px;
}

.product-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name .name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.product-name .description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.price {
  font-weight: 600;
  color: var(--el-color-primary);
}

.table-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.total-info {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .filter-row {
    flex-wrap: wrap;
  }

  .search-input,
  .status-filter {
    max-width: none;
    width: 100%;
  }
}
</style>
