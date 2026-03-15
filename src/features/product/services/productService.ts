import type { Product, ProductFilter } from '@/features/product/types/product.types';

const mockProducts: Product[] = [
  { id: 1, name: 'Wireless Headphones Pro', price: 299.99, status: 'active', description: 'Premium noise-canceling headphones', createdAt: '2024-01-10' },
  { id: 2, name: 'Gaming Mouse X5', price: 89.99, status: 'active', description: 'High-precision gaming mouse', createdAt: '2024-01-09' },
  { id: 3, name: 'Mechanical Keyboard RGB', price: 159.99, status: 'active', description: 'Full-size mechanical keyboard', createdAt: '2024-01-08' },
  { id: 4, name: 'USB-C Hub 7-in-1', price: 49.99, status: 'inactive', description: 'Multi-port USB-C adapter', createdAt: '2024-01-07' },
  { id: 5, name: '4K Webcam Pro', price: 129.99, status: 'active', description: 'Ultra HD webcam for streaming', createdAt: '2024-01-06' },
  { id: 6, name: 'Portable SSD 1TB', price: 119.99, status: 'active', description: 'High-speed external storage', createdAt: '2024-01-05' },
  { id: 7, name: 'Wireless Charger Pad', price: 29.99, status: 'active', description: 'Fast wireless charging pad', createdAt: '2024-01-04' },
  { id: 8, name: 'Bluetooth Speaker Mini', price: 59.99, status: 'inactive', description: 'Compact portable speaker', createdAt: '2024-01-03' },
  { id: 9, name: 'Laptop Stand Aluminum', price: 39.99, status: 'active', description: 'Ergonomic laptop riser', createdAt: '2024-01-02' },
  { id: 10, name: 'Cable Management Box', price: 19.99, status: 'active', description: 'Organize your cables', createdAt: '2024-01-01' },
  { id: 11, name: 'Monitor Light Bar', price: 79.99, status: 'active', description: 'Screenbar for eye comfort', createdAt: '2023-12-31' },
  { id: 12, name: 'Desk Mat Large', price: 24.99, status: 'inactive', description: 'Extended gaming mouse pad', createdAt: '2023-12-30' },
  { id: 13, name: 'Phone Holder Adjustable', price: 14.99, status: 'active', description: 'Flexible phone stand', createdAt: '2023-12-29' },
  { id: 14, name: 'HDMI Cable 6ft', price: 12.99, status: 'active', description: 'High-speed HDMI 2.1 cable', createdAt: '2023-12-28' },
  { id: 15, name: 'Webcam Privacy Cover', price: 7.99, status: 'active', description: 'Slide camera cover', createdAt: '2023-12-27' },
];

export const productService = {
  async fetchProducts(filter?: ProductFilter): Promise<Product[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let result = [...mockProducts];

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filter?.status) {
      result = result.filter((p) => p.status === filter.status);
    }

    if (filter?.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filter.minPrice!);
    }

    if (filter?.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filter.maxPrice!);
    }

    return result;
  },

  async getProductById(id: number): Promise<Product | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockProducts.find((p) => p.id === id);
  },
};
