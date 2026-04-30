import type { Customer } from '@/features/customer/types/customer.types';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  code?: string;
  customerId?: string;
  customer?: Customer;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  note?: string;
  items: OrderItem[];
  createdAt?: string;
}

export interface OrderFilter {
  status?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  customerId?: string;
  items: CreateOrderItemInput[];
  paidAmount: number;
  note?: string;
}

export interface UpdateOrderInput {
  status?: string;
  note?: string;
}
