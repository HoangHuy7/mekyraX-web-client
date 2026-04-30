import {
  HomeFilled,
  GoodsFilled,
  List,
  InfoFilled,
  UserFilled,
  Tickets,
  Setting,
  Avatar,
  Files,
} from '@element-plus/icons-vue';
import type { Component } from 'vue';
import type { MenuItem } from '@/shared/types/menu.types';
import { adminService } from '@/features/admin/services/adminService';
import type { MenuDef } from '@/features/admin/types/admin.types';
import { i18n } from '@/shared/i18n';

// Map icon name string → Element Plus component
const ICON_MAP: Record<string, Component> = {
  HomeFilled, GoodsFilled, List, InfoFilled, UserFilled,
  Tickets, Setting, Avatar, Files,
};

export function resolveIcon(name?: string): Component | undefined {
  if (!name) return undefined;
  return ICON_MAP[name];
}

export const menuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'menu.dashboard',
    path: '/dashboard',
    icon: HomeFilled,
    meta: { title: 'Dashboard', keepAlive: true },
  },
  {
    id: 'order-workspace',
    label: 'menu.orderWorkspace',
    path: '/order-workspace',
    icon: Tickets,
    meta: { title: 'Order Workspace', keepAlive: true },
  },
  {
    id: 'products',
    label: 'menu.products',
    icon: GoodsFilled,
    meta: { title: 'Products' },
    children: [
      { id: 'product-list', label: 'menu.productList', path: '/products', icon: List, meta: { title: 'Product List', keepAlive: true } },
      { id: 'product-detail', label: 'menu.productDetail', path: '/products/:id', icon: InfoFilled, meta: { title: 'Product Detail', keepAlive: true, hidden: true } },
    ],
  },
  {
    id: 'customers',
    label: 'menu.customers',
    icon: UserFilled,
    meta: { title: 'Customers' },
    children: [
      { id: 'customer-list', label: 'menu.customerList', path: '/customers', icon: List, meta: { title: 'Customer List', keepAlive: true } },
      { id: 'customer-detail', label: 'menu.customerDetail', path: '/customers/:id', icon: InfoFilled, meta: { title: 'Customer Detail', keepAlive: true, hidden: true } },
    ],
  },
  {
    id: 'orders',
    label: 'menu.orders',
    icon: Tickets,
    meta: { title: 'Orders' },
    children: [
      { id: 'order-list', label: 'menu.orderList', path: '/orders', icon: List, meta: { title: 'Order List', keepAlive: true } },
      { id: 'order-detail', label: 'menu.orderDetail', path: '/orders/:id', icon: InfoFilled, meta: { title: 'Order Detail', keepAlive: true, hidden: true } },
    ],
  },
];

// Resolve an i18n key or plain string label
function resolveLabel(label: string): string {
  try {
    const translated = i18n.global.t(label);
    // vue-i18n returns the key itself when not found — treat that as plain text
    return translated !== label ? (translated as string) : label;
  } catch {
    return label;
  }
}

// Build tree structure from flat MenuDef list returned by API
export function buildMenuTree(flat: MenuDef[]): MenuItem[] {
  const map = new Map<string, MenuItem>();

  // First pass: create all items
  for (const d of flat) {
    const label = resolveLabel(d.label);
    map.set(d.id, {
      id: d.id,
      label,
      path: d.path,
      icon: resolveIcon(d.icon),
      meta: {
        title: label,
        keepAlive: d.meta.keepAlive,
        hidden: d.meta.hidden,
        componentName: d.meta.componentName,
      },
    });
  }

  // Second pass: build tree
  const roots: MenuItem[] = [];
  for (const d of flat) {
    const item = map.get(d.id)!;
    if (d.parentId) {
      const parent = map.get(d.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }
    } else {
      roots.push(item);
    }
  }

  // Sort children
  const sortChildren = (items: MenuItem[]) => {
    items.sort((a, b) => {
      const da = flat.find((f) => f.id === a.id);
      const db = flat.find((f) => f.id === b.id);
      return (da?.sortOrder ?? 0) - (db?.sortOrder ?? 0);
    });
    for (const item of items) {
      if (item.children) sortChildren(item.children);
    }
  };
  sortChildren(roots);

  return roots;
}

export const fetchMenuFromApi = async (): Promise<MenuItem[]> => {
  const flat = await adminService.getMyMenus();
  if (!flat.length) return menuConfig;
  return buildMenuTree(flat);
};

