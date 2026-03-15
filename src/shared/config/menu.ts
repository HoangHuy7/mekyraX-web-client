import { HomeFilled, GoodsFilled, List, InfoFilled } from '@element-plus/icons-vue';
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
];

export const fetchMenuFromApi = async (): Promise<MenuItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(menuConfig);
    }, 100);
  });
};
