<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Goods, View } from '@element-plus/icons-vue';
import { useProductStore } from '@/features/product/store/productStore';
import type { ProductStatus } from '@/features/product/types/product.types';

const productStore = useProductStore();
const router = useRouter();
const searchQuery = ref('');

onMounted(() => {
  productStore.fetchProducts();
});

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
  productStore.setFilter({ search: searchQuery.value });
  productStore.fetchProducts();
};

const handleReset = (): void => {
  searchQuery.value = '';
  productStore.resetFilter();
  productStore.fetchProducts();
};

const getStatusType = (status: ProductStatus): string => {
  return status === 'active' ? 'success' : 'info';
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const viewProduct = (id: string): void => {
  router.push(`/products/${id}`);
};

const toggleProductStatus = async (id: string, status: ProductStatus): Promise<void> => {
  const nextStatus: ProductStatus = status === 'active' ? 'inactive' : 'active';
  await productStore.updateProductStatus(id, nextStatus);
};
</script>

<template>
  <div class="product-list-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">Manage your product inventory</p>
      </div>
      <el-button type="primary" :icon="Goods">
        Add Product
      </el-button>
    </div>

    <el-card shadow="hover" class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="searchQuery"
          placeholder="Search products..."
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          Search
        </el-button>
        <el-button @click="handleReset" :icon="Refresh">
          Reset
        </el-button>
      </div>
    </el-card>

    <el-card shadow="hover" v-loading="productStore.loading">
      <el-table
        :data="productStore.filteredProducts"
        stripe
        style="width: 100%"
        empty-text="No products found"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        
        <el-table-column prop="name" label="Product Name" min-width="200">
          <template #default="{ row }">
            <div class="product-name">
              <span class="name">{{ row.name }}</span>
              <span v-if="row.category || row.unit" class="description">
                {{ row.category || 'General' }} · {{ row.unit || 'unit' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="Price" width="120" sortable>
          <template #default="{ row }">
            <span class="price">{{ formatPrice(row.price) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="stockQuantity" label="Stock" width="100" sortable />

        <el-table-column prop="status" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewProduct(row.id)">
              <el-icon><View /></el-icon>
              View
            </el-button>
            <el-button link type="warning" size="small">
              Edit
            </el-button>
            <el-button 
              link 
              :type="row.status === 'active' ? 'danger' : 'success'" 
              size="small"
              @click="toggleProductStatus(row.id, row.status)"
            >
              {{ row.status === 'active' ? 'Deactivate' : 'Activate' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-info">
          Total: {{ productStore.filteredProducts.length }} products
          ({{ productStore.activeProductsCount }} active, {{ productStore.inactiveProductsCount }} inactive)
        </span>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Products',
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
  width: 300px;
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
</style>
