import type { Component } from 'vue';

export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: Component;
  children?: MenuItem[];
  meta?: {
    title?: string;
    keepAlive?: boolean;
    hidden?: boolean;
    permissions?: string[];
    componentName?: string;
  };
}

export interface FlatMenuItem extends MenuItem {
  parentId?: string;
  level: number;
}
