<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Edit, Delete } from '@element-plus/icons-vue';
import { productService } from '@/features/product/services/productService';
import type { Product } from '@/features/product/types/product.types';

const route = useRoute();
const router = useRouter();

const product = ref<Product | null>(null);
const loading = ref(true);

const productId = ref<number>(0);

onMounted(async () => {
  const id = Number(route.params.id);
  productId.value = id;
  
  if (isNaN(id)) {
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusType = (status: string): string => {
  return status === 'active' ? 'success' : 'info';
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
          <h1 class="page-title">Product Detail</h1>
          <p class="page-subtitle">View product information</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Edit">
          Edit
        </el-button>
        <el-button type="danger" :icon="Delete" plain>
          Delete
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" shadow="hover">
      <template v-if="product">
        <div class="product-header">
          <div class="product-id">ID: {{ product.id }}</div>
          <el-tag :type="getStatusType(product.status)" size="large">
            {{ product.status }}
          </el-tag>
        </div>

        <h2 class="product-name">{{ product.name }}</h2>
        <p v-if="product.description" class="product-description">
          {{ product.description }}
        </p>

        <el-divider />

        <el-descriptions :column="2" border>
          <el-descriptions-item label="Price">
            <span class="price">{{ formatPrice(product.price) }}</span>
          </el-descriptions-item>
          
          <el-descriptions-item label="Status">
            <el-tag :type="getStatusType(product.status)">
              {{ product.status }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Created At">
            {{ formatDate(product.createdAt) }}
          </el-descriptions-item>

          <el-descriptions-item label="Product ID">
            #{{ product.id }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div class="product-stats">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-statistic title="Sales" :value="1234" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="Views" :value="5678" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="Stock" :value="89" />
            </el-col>
          </el-row>
        </div>
      </template>

      <el-empty v-else description="Product not found" />
    </el-card>
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

.product-id {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.product-name {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.product-description {
  margin: 0 0 20px;
  font-size: 16px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.product-stats {
  margin-top: 20px;
}
</style>
