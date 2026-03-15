export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: number;
  name: string;
  price: number;
  status: ProductStatus;
  description?: string;
  createdAt?: string;
}

export interface ProductFilter {
  search?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
}
