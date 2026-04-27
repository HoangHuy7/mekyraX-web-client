export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface GraphQLPageInfo {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface GraphQLProduct {
  id: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  price: string | number;
  cost_price?: string | number | null;
  stock_quantity: number;
  barcode?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  img_url?: string | null;
}

export interface GraphQLCustomer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  total_debt: string | number;
  created_at?: string | null;
}

export interface GraphQLOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: string | number;
  total: string | number;
}

export interface GraphQLOrder {
  id: string;
  code?: string | null;
  customer_id?: string | null;
  customer?: GraphQLCustomer | null;
  total_amount: string | number;
  paid_amount: string | number;
  debt_amount: string | number;
  status: string;
  note?: string | null;
  items?: GraphQLOrderItem[] | null;
  created_at?: string | null;
}

export interface ProductDTO {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  barcode?: string;
  createdAt?: string;
  updatedAt?: string;
  imgUrl?: string;
  status: 'active' | 'inactive';
}

export interface CustomerDTO {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  totalDebt: number;
  createdAt?: string;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderDTO {
  id: string;
  code?: string;
  customerId?: string;
  customer?: CustomerDTO;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  note?: string;
  items: OrderItemDTO[];
  createdAt?: string;
}

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return 0;
};

const toStringOrUndefined = (value: string | null | undefined): string | undefined => {
  if (!value || value.trim() === '') {
    return undefined;
  }
  return value;
};

export const mapPageInfo = (pageInfo?: GraphQLPageInfo | null): PaginationInfo => ({
  total: pageInfo?.total ?? 0,
  page: pageInfo?.page ?? 1,
  pageSize: pageInfo?.page_size ?? 20,
  hasNext: pageInfo?.has_next ?? false,
});

export const mapProduct = (product: GraphQLProduct): ProductDTO => ({
  id: product.id,
  name: product.name,
  category: toStringOrUndefined(product.category ?? undefined),
  unit: toStringOrUndefined(product.unit ?? undefined),
  price: toNumber(product.price),
  costPrice: product.cost_price != null ? toNumber(product.cost_price) : undefined,
  stockQuantity: product.stock_quantity,
  barcode: toStringOrUndefined(product.barcode ?? undefined),
  createdAt: toStringOrUndefined(product.created_at ?? undefined),
  updatedAt: toStringOrUndefined(product.updated_at ?? undefined),
  imgUrl: toStringOrUndefined(product.img_url ?? undefined),
  status: product.stock_quantity > 0 ? 'active' : 'inactive',
});

export const mapCustomer = (customer: GraphQLCustomer): CustomerDTO => ({
  id: customer.id,
  name: customer.name,
  phone: toStringOrUndefined(customer.phone ?? undefined),
  address: toStringOrUndefined(customer.address ?? undefined),
  totalDebt: toNumber(customer.total_debt),
  createdAt: toStringOrUndefined(customer.created_at ?? undefined),
});

export const mapOrderItem = (item: GraphQLOrderItem): OrderItemDTO => ({
  id: item.id,
  orderId: item.order_id,
  productId: item.product_id,
  productName: item.product_name,
  quantity: item.quantity,
  price: toNumber(item.price),
  total: toNumber(item.total),
});

export const mapOrder = (order: GraphQLOrder): OrderDTO => ({
  id: order.id,
  code: toStringOrUndefined(order.code ?? undefined),
  customerId: toStringOrUndefined(order.customer_id ?? undefined),
  customer: order.customer ? mapCustomer(order.customer) : undefined,
  totalAmount: toNumber(order.total_amount),
  paidAmount: toNumber(order.paid_amount),
  debtAmount: toNumber(order.debt_amount),
  status: order.status,
  note: toStringOrUndefined(order.note ?? undefined),
  items: (order.items ?? []).map(mapOrderItem),
  createdAt: toStringOrUndefined(order.created_at ?? undefined),
});
