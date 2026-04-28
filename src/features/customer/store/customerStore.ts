import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { customerService } from '@/features/customer/services/customerService';
import type { PaginationInfo } from '@/shared/graphql/mappers';
import type {
  Customer,
  CustomerFilter,
  CustomerMutationInput,
} from '@/features/customer/types/customer.types';

interface FetchCustomersOptions {
  page?: number;
  pageSize?: number;
}

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref<Customer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<CustomerFilter>({});
  const pageInfo = ref<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
  });

  const filteredCustomers = computed(() => customers.value);

  const fetchCustomers = async (options: FetchCustomersOptions = {}): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await customerService.fetchCustomers(filter.value, options);
      customers.value = result.items;
      pageInfo.value = result.pageInfo;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch customers';
    } finally {
      loading.value = false;
    }
  };

  const setFilter = (newFilter: CustomerFilter): void => {
    filter.value = { ...filter.value, ...newFilter };
  };

  const resetFilter = (): void => {
    filter.value = {};
  };

  const createCustomer = async (input: CustomerMutationInput): Promise<Customer> => {
    const customer = await customerService.createCustomer(input);
    customers.value = [customer, ...customers.value];
    return customer;
  };

  const updateCustomer = async (
    id: string,
    input: Partial<CustomerMutationInput>
  ): Promise<Customer> => {
    const customer = await customerService.updateCustomer(id, input);
    const index = customers.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      customers.value[index] = customer;
    }
    return customer;
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    await customerService.deleteCustomer(id);
    customers.value = customers.value.filter((customer) => customer.id !== id);
  };

  return {
    customers,
    loading,
    error,
    filter,
    pageInfo,
    filteredCustomers,
    fetchCustomers,
    setFilter,
    resetFilter,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
});
