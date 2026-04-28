import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { productService } from '@/features/product/services/productService';
import type { PaginationInfo } from '@/shared/graphql/mappers';
import type {
  Product,
  ProductFilter,
  ProductMutationInput,
  ProductStatus,
} from '@/features/product/types/product.types';

interface FetchProductsOptions {
  page?: number;
  pageSize?: number;
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<ProductFilter>({});
  const pageInfo = ref<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
  });

  const filteredProducts = computed(() => {
    let result = products.value;

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

  const fetchProducts = async (options: FetchProductsOptions = {}): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await productService.fetchProducts(filter.value, options);
      products.value = result.items;
      pageInfo.value = result.pageInfo;
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
      await updateProduct(id, { stockQuantity: targetStockQuantity });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update product status';
    }
  };

  const createProduct = async (input: ProductMutationInput): Promise<Product> => {
    const product = await productService.createProduct(input);
    products.value = [product, ...products.value];
    return product;
  };

  const updateProduct = async (
    id: string,
    input: Partial<ProductMutationInput>
  ): Promise<Product> => {
    const updated = await productService.updateProduct(id, input);
    const index = products.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      products.value[index] = updated;
    }
    return updated;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await productService.deleteProduct(id);
    products.value = products.value.filter((item) => item.id !== id);
  };

  return {
    products,
    loading,
    error,
    filter,
    pageInfo,
    filteredProducts,
    activeProductsCount,
    inactiveProductsCount,
    fetchProducts,
    setFilter,
    resetFilter,
    updateProductStatus,
    createProduct,
    updateProduct,
    deleteProduct,
  };
});
