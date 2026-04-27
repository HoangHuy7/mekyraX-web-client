import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { orderService } from '@/features/order/services/orderService';
import type {
  CreateOrderInput,
  Order,
  OrderFilter,
  UpdateOrderInput,
} from '@/features/order/types/order.types';

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<OrderFilter>({});

  const filteredOrders = computed(() => {
    let result = orders.value;

    if (filter.value.status) {
      result = result.filter((order) => order.status === filter.value.status);
    }

    if (filter.value.customerId) {
      result = result.filter((order) => order.customerId === filter.value.customerId);
    }

    return result;
  });

  const fetchOrders = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await orderService.fetchOrders(filter.value);
      orders.value = result.items;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch orders';
    } finally {
      loading.value = false;
    }
  };

  const setFilter = (newFilter: OrderFilter): void => {
    filter.value = { ...filter.value, ...newFilter };
  };

  const resetFilter = (): void => {
    filter.value = {};
  };

  const createOrder = async (input: CreateOrderInput): Promise<Order> => {
    const order = await orderService.createOrder(input);
    orders.value = [order, ...orders.value];
    return order;
  };

  const updateOrder = async (id: string, input: UpdateOrderInput): Promise<Order> => {
    const order = await orderService.updateOrder(id, input);
    const index = orders.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      orders.value[index] = order;
    }
    return order;
  };

  const deleteOrder = async (id: string): Promise<void> => {
    await orderService.deleteOrder(id);
    orders.value = orders.value.filter((order) => order.id !== id);
  };

  return {
    orders,
    loading,
    error,
    filter,
    filteredOrders,
    fetchOrders,
    setFilter,
    resetFilter,
    createOrder,
    updateOrder,
    deleteOrder,
  };
});
