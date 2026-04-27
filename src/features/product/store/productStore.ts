import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { productService } from '@/features/product/services/productService';
import type { Product, ProductFilter, ProductStatus } from '@/features/product/types/product.types';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<ProductFilter>({});

  const filteredProducts = computed(() => {
    let result = products.value;

    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower) ||
          p.barcode?.toLowerCase().includes(searchLower)
      );
    }

    if (filter.value.status) {
      result = result.filter((p) => p.status === filter.value.status);
    }

    return result;
  });

  const activeProductsCount = computed(
    () => products.value.filter((p) => p.status === 'active').length
  );

  const inactiveProductsCount = computed(
    () => products.value.filter((p) => p.status === 'inactive').length
  );

  const fetchProducts = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await productService.fetchProducts(filter.value);
      products.value = result.items;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch products';
    } finally {
      loading.value = false;
    }
  };

  const setFilter = (newFilter: ProductFilter): void => {
    filter.value = { ...filter.value, ...newFilter };
  };

  const resetFilter = (): void => {
    filter.value = {};
  };

  const updateProductStatus = async (id: string, status: ProductStatus): Promise<void> => {
    try {
      const targetStockQuantity = status === 'active' ? 1 : 0;
      const updated = await productService.updateProduct(id, { stockQuantity: targetStockQuantity });
      const index = products.value.findIndex((p) => p.id === id);
      if (index >= 0) {
        products.value[index] = updated;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update product status';
    }
  };

  return {
    products,
    loading,
    error,
    filter,
    filteredProducts,
    activeProductsCount,
    inactiveProductsCount,
    fetchProducts,
    setFilter,
    resetFilter,
    updateProductStatus,
  };
});
