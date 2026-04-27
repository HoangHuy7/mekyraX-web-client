import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { customerService } from '@/features/customer/services/customerService';
import type {
  Customer,
  CustomerFilter,
  CustomerMutationInput,
} from '@/features/customer/types/customer.types';

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref<Customer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<CustomerFilter>({});

  const filteredCustomers = computed(() => {
    let result = customers.value;

    if (filter.value.search) {
      const searchValue = filter.value.search.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchValue) ||
          customer.phone?.toLowerCase().includes(searchValue) ||
          customer.address?.toLowerCase().includes(searchValue)
      );
    }

    if (filter.value.phone) {
      const phoneValue = filter.value.phone.toLowerCase();
      result = result.filter((customer) => customer.phone?.toLowerCase().includes(phoneValue));
    }

    return result;
  });

  const fetchCustomers = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await customerService.fetchCustomers(filter.value);
      customers.value = result.items;
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
    filteredCustomers,
    fetchCustomers,
    setFilter,
    resetFilter,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
});
