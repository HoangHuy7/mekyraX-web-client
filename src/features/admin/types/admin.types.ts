export interface AppUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
  isSystem: boolean;
  mustChangePassword: boolean;
  groupIds: string[];
  syncedAt?: string;
  createdAt: string;
}

export interface AppGroup {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  menuIds: string[];
  createdAt: string;
}

export interface MenuDef {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  meta: {
    keepAlive: boolean;
    hidden: boolean;
    componentName?: string;
  };
}

export interface MyProfile {
  id: string;
  username: string;
  displayName?: string;
  mustChangePassword: boolean;
  isSystem: boolean;
}
