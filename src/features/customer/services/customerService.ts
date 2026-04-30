import { gql } from '@apollo/client/core';
import { mapCustomer, type GraphQLCustomer, type PaginationInfo } from '@/shared/graphql/mappers';
import { runMutation, runQuery } from '@/shared/graphql/request';
import type {
  Customer,
  CustomerFilter,
  CustomerMutationInput,
} from '@/features/customer/types/customer.types';

const CUSTOMER_FRAGMENT = gql`
  fragment CustomerFields on Customer {
    id
    name
    phone
    address
    id_card
    email
    img_url
    note
    total_debt
    created_at
    updated_at
  }
`;

const CUSTOMERS_QUERY = gql`
  query Customers($filter: CustomerFilter, $pagination: PaginationInput) {
    customers(filter: $filter, pagination: $pagination) {
      data {
        ...CustomerFields
      }
      pagination {
        total
        page
        page_size
        has_next
      }
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

const CUSTOMER_QUERY = gql`
  query Customer($id: ID!) {
    customer(id: $id) {
      ...CustomerFields
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

const CREATE_CUSTOMER_MUTATION = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ...CustomerFields
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

const UPDATE_CUSTOMER_MUTATION = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      ...CustomerFields
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

const DELETE_CUSTOMER_MUTATION = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

interface CustomersQueryResponse {
  customers: {
    data: GraphQLCustomer[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
      has_next: boolean;
    };
  };
}

interface CustomerQueryResponse {
  customer: GraphQLCustomer | null;
}

interface CustomerMutationResponse {
  createCustomer?: GraphQLCustomer;
  updateCustomer?: GraphQLCustomer;
  deleteCustomer?: boolean;
}

interface FetchCustomersResult {
  items: Customer[];
  pageInfo: PaginationInfo;
}

interface FetchCustomersOptions {
  page?: number;
  pageSize?: number;
}

const toCustomerInput = (input: CustomerMutationInput) => ({
  name: input.name,
  phone: input.phone || null,
  address: input.address || null,
  id_card: input.idCard || null,
  email: input.email || null,
  img_url: input.imgUrl || null,
  note: input.note || null,
});

export const customerService = {
  async fetchCustomers(
    filter?: CustomerFilter,
    options: FetchCustomersOptions = {}
  ): Promise<FetchCustomersResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 10;
    const offset = Math.max(0, (page - 1) * pageSize);

    const data = await runQuery<CustomersQueryResponse>(CUSTOMERS_QUERY, {
      filter: {
        search: filter?.search || null,
        phone: filter?.phone || null,
        email: filter?.email || null,
        id_card: filter?.idCard || null,
        has_debt: filter?.hasDebt ?? null,
      },
      pagination: {
        offset,
        limit: pageSize,
      },
    });

    const items = (data.customers?.data || []).map(mapCustomer);

    return {
      items,
      pageInfo: {
        total: data.customers?.pagination?.total ?? 0,
        page: data.customers?.pagination?.page ?? 1,
        pageSize: data.customers?.pagination?.page_size ?? items.length,
        hasNext: data.customers?.pagination?.has_next ?? false,
      },
    };
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const data = await runQuery<CustomerQueryResponse>(CUSTOMER_QUERY, { id });
    if (!data.customer) {
      return null;
    }
    return mapCustomer(data.customer);
  },

  async createCustomer(input: CustomerMutationInput): Promise<Customer> {
    const data = await runMutation<CustomerMutationResponse>(CREATE_CUSTOMER_MUTATION, {
      input: toCustomerInput(input),
    });
    if (!data.createCustomer) {
      throw new Error('Create customer failed');
    }
    return mapCustomer(data.createCustomer);
  },

  async updateCustomer(id: string, input: Partial<CustomerMutationInput>): Promise<Customer> {
    const data = await runMutation<CustomerMutationResponse>(UPDATE_CUSTOMER_MUTATION, {
      id,
      input: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.address !== undefined ? { address: input.address || null } : {}),
        ...(input.idCard !== undefined ? { id_card: input.idCard || null } : {}),
        ...(input.email !== undefined ? { email: input.email || null } : {}),
        ...(input.imgUrl !== undefined ? { img_url: input.imgUrl || null } : {}),
        ...(input.note !== undefined ? { note: input.note || null } : {}),
      },
    });
    if (!data.updateCustomer) {
      throw new Error('Update customer failed');
    }
    return mapCustomer(data.updateCustomer);
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const data = await runMutation<CustomerMutationResponse>(DELETE_CUSTOMER_MUTATION, { id });
    return Boolean(data.deleteCustomer);
  },
};
