import { gql } from '@apollo/client/core';
import { mapOrder, type GraphQLOrder, type PaginationInfo } from '@/shared/graphql/mappers';
import { runMutation, runQuery } from '@/shared/graphql/request';
import type {
  CreateOrderInput,
  Order,
  OrderFilter,
  UpdateOrderInput,
} from '@/features/order/types/order.types';

const ORDER_ITEM_FRAGMENT = gql`
  fragment OrderItemFields on OrderItem {
    id
    order_id
    product_id
    product_name
    quantity
    price
    total
  }
`;

const ORDER_FRAGMENT = gql`
  fragment OrderFields on Order {
    id
    code
    customer_id
    total_amount
    paid_amount
    debt_amount
    status
    note
    created_at
    customer {
      id
      name
      phone
      address
      total_debt
      created_at
    }
    items {
      ...OrderItemFields
    }
  }
  ${ORDER_ITEM_FRAGMENT}
`;

const ORDERS_QUERY = gql`
  query Orders($filter: OrderFilter, $pagination: PaginationInput) {
    orders(filter: $filter, pagination: $pagination) {
      data {
        ...OrderFields
      }
      pagination {
        total
        page
        page_size
        has_next
      }
    }
  }
  ${ORDER_FRAGMENT}
`;

const ORDER_QUERY = gql`
  query Order($id: ID!) {
    order(id: $id) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

const UPDATE_ORDER_MUTATION = gql`
  mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) {
    updateOrder(id: $id, input: $input) {
      ...OrderFields
    }
  }
  ${ORDER_FRAGMENT}
`;

const DELETE_ORDER_MUTATION = gql`
  mutation DeleteOrder($id: ID!) {
    deleteOrder(id: $id)
  }
`;

interface OrdersQueryResponse {
  orders: {
    data: GraphQLOrder[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
      has_next: boolean;
    };
  };
}

interface OrderQueryResponse {
  order: GraphQLOrder | null;
}

interface OrderMutationResponse {
  createOrder?: GraphQLOrder;
  updateOrder?: GraphQLOrder;
  deleteOrder?: boolean;
}

interface FetchOrdersResult {
  items: Order[];
  pageInfo: PaginationInfo;
}

interface FetchOrdersOptions {
  page?: number;
  pageSize?: number;
}

const toGraphQLDecimal = (value: number): string => value.toString();

const toCreateOrderInput = (input: CreateOrderInput) => ({
  customer_id: input.customerId || null,
  paid_amount: toGraphQLDecimal(input.paidAmount),
  note: input.note || null,
  items: input.items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    price: toGraphQLDecimal(item.price),
  })),
});

const toUpdateOrderInput = (input: UpdateOrderInput) => ({
  ...(input.status !== undefined ? { status: input.status } : {}),
  ...(input.note !== undefined ? { note: input.note } : {}),
});

export const orderService = {
  async fetchOrders(
    filter?: OrderFilter,
    options: FetchOrdersOptions = {}
  ): Promise<FetchOrdersResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 10;
    const offset = Math.max(0, (page - 1) * pageSize);

    const data = await runQuery<OrdersQueryResponse>(ORDERS_QUERY, {
      filter: {
        status: filter?.status || null,
        customer_id: filter?.customerId || null,
      },
      pagination: {
        offset,
        limit: pageSize,
      },
    });

    const items = (data.orders?.data || []).map(mapOrder);

    return {
      items,
      pageInfo: {
        total: data.orders?.pagination?.total ?? 0,
        page: data.orders?.pagination?.page ?? 1,
        pageSize: data.orders?.pagination?.page_size ?? items.length,
        hasNext: data.orders?.pagination?.has_next ?? false,
      },
    };
  },

  async getOrderById(id: string): Promise<Order | null> {
    const data = await runQuery<OrderQueryResponse>(ORDER_QUERY, { id });
    if (!data.order) {
      return null;
    }
    return mapOrder(data.order);
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const data = await runMutation<OrderMutationResponse>(CREATE_ORDER_MUTATION, {
      input: toCreateOrderInput(input),
    });
    if (!data.createOrder) {
      throw new Error('Create order failed');
    }
    return mapOrder(data.createOrder);
  },

  async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
    const data = await runMutation<OrderMutationResponse>(UPDATE_ORDER_MUTATION, {
      id,
      input: toUpdateOrderInput(input),
    });
    if (!data.updateOrder) {
      throw new Error('Update order failed');
    }
    return mapOrder(data.updateOrder);
  },

  async deleteOrder(id: string): Promise<boolean> {
    const data = await runMutation<OrderMutationResponse>(DELETE_ORDER_MUTATION, { id });
    return Boolean(data.deleteOrder);
  },
};
