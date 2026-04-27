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
    label: 'Dashboard',
    path: '/dashboard',
    icon: HomeFilled,
    meta: {
      title: 'Dashboard',
      keepAlive: true,
    },
  },
  {
    id: 'products',
    label: 'Products',
    icon: GoodsFilled,
    meta: {
      title: 'Products',
    },
    children: [
      {
        id: 'product-list',
        label: 'Product List',
        path: '/products',
        icon: List,
        meta: {
          title: 'Product List',
          keepAlive: true,
        },
      },
      {
        id: 'product-detail',
        label: 'Product Detail',
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
    label: 'Customers',
    icon: UserFilled,
    meta: {
      title: 'Customers',
    },
    children: [
      {
        id: 'customer-list',
        label: 'Customer List',
        path: '/customers',
        icon: List,
        meta: {
          title: 'Customer List',
          keepAlive: true,
        },
      },
      {
        id: 'customer-detail',
        label: 'Customer Detail',
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
    label: 'Orders',
    icon: Tickets,
    meta: {
      title: 'Orders',
    },
    children: [
      {
        id: 'order-list',
        label: 'Order List',
        path: '/orders',
        icon: List,
        meta: {
          title: 'Order List',
          keepAlive: true,
        },
      },
      {
        id: 'order-detail',
        label: 'Order Detail',
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
