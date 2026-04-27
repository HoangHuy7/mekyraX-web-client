export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  name: string;
  price: number;
  status: ProductStatus;
  stockQuantity: number;
  category?: string;
  unit?: string;
  barcode?: string;
  costPrice?: number;
  imgUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilter {
  search?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

export interface ProductMutationInput {
  name: string;
  price: number;
  category?: string;
  unit?: string;
  costPrice?: number;
  stockQuantity?: number;
  barcode?: string;
}
