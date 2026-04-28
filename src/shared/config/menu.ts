import {
  HomeFilled,
  GoodsFilled,
  List,
  InfoFilled,
  UserFilled,
  Tickets,
} from '@element-plus/icons-vue';
import type { MenuItem } from '@/shared/types/menu.types';

export const menuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'menu.dashboard',
    path: '/dashboard',
    icon: HomeFilled,
    meta: {
      title: 'Dashboard',
      keepAlive: true,
    },
  },
  {
    id: 'order-workspace',
    label: 'menu.orderWorkspace',
    path: '/order-workspace',
    icon: Tickets,
    meta: {
      title: 'Order Workspace',
      keepAlive: true,
    },
  },
  {
    id: 'products',
    label: 'menu.products',
    icon: GoodsFilled,
    meta: {
      title: 'Products',
    },
    children: [
      {
        id: 'product-list',
        label: 'menu.productList',
        path: '/products',
        icon: List,
        meta: {
          title: 'Product List',
          keepAlive: true,
        },
      },
      {
        id: 'product-detail',
        label: 'menu.productDetail',
        path: '/products/:id',
        icon: InfoFilled,
        meta: {
          title: 'Product Detail',
          keepAlive: true,
          hidden: true,
        },
      },
    ],
  },
  {
    id: 'customers',
    label: 'menu.customers',
    icon: UserFilled,
    meta: {
      title: 'Customers',
    },
    children: [
      {
        id: 'customer-list',
        label: 'menu.customerList',
        path: '/customers',
        icon: List,
        meta: {
          title: 'Customer List',
          keepAlive: true,
        },
      },
      {
        id: 'customer-detail',
        label: 'menu.customerDetail',
        path: '/customers/:id',
        icon: InfoFilled,
        meta: {
          title: 'Customer Detail',
          keepAlive: true,
          hidden: true,
        },
      },
    ],
  },
  {
    id: 'orders',
    label: 'menu.orders',
    icon: Tickets,
    meta: {
      title: 'Orders',
    },
    children: [
      {
        id: 'order-list',
        label: 'menu.orderList',
        path: '/orders',
        icon: List,
        meta: {
          title: 'Order List',
          keepAlive: true,
        },
      },
      {
        id: 'order-detail',
        label: 'menu.orderDetail',
        path: '/orders/:id',
        icon: InfoFilled,
        meta: {
          title: 'Order Detail',
          keepAlive: true,
          hidden: true,
        },
      },
    ],
  },
];

export const fetchMenuFromApi = async (): Promise<MenuItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(menuConfig);
    }, 100);
  });
};
