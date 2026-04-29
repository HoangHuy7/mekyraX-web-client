import { gql } from '@apollo/client/core';
import { runMutation, runQuery } from '@/shared/graphql/request';
import type { AppUser, AppGroup, MenuDef } from '@/features/admin/types/admin.types';

// ─── Fragments ────────────────────────────────────────────────────────────────

const MENU_DEF_FRAGMENT = gql`
  fragment MenuDefFields on MenuDef {
    id
    label
    path
    icon
    parent_id
    sort_order
    meta {
      keep_alive
      hidden
      component_name
    }
  }
`;

const GROUP_FRAGMENT = gql`
  fragment GroupFields on AppGroup {
    id
    name
    description
    is_default
    menu_ids
    created_at
  }
`;

const USER_FRAGMENT = gql`
  fragment UserFields on AppUser {
    id
    username
    display_name
    email
    avatar
    is_active
    group_ids
    synced_at
    created_at
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

const MY_MENUS_QUERY = gql`
  ${MENU_DEF_FRAGMENT}
  query MyMenus {
    myMenus {
      ...MenuDefFields
    }
  }
`;

const ADMIN_MENUS_QUERY = gql`
  ${MENU_DEF_FRAGMENT}
  query AdminMenus {
    adminMenus {
      ...MenuDefFields
    }
  }
`;

const ADMIN_GROUPS_QUERY = gql`
  ${GROUP_FRAGMENT}
  query AdminGroups {
    adminGroups {
      ...GroupFields
    }
  }
`;

const ADMIN_USERS_QUERY = gql`
  ${USER_FRAGMENT}
  query AdminUsers($filter: UserFilter, $pagination: PaginationInput) {
    adminUsers(filter: $filter, pagination: $pagination) {
      data {
        ...UserFields
      }
      pagination {
        total
        page
        page_size
        has_next
      }
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

const SYNC_USERS_MUTATION = gql`
  mutation SyncUsers {
    syncUsers
  }
`;

const CREATE_GROUP_MUTATION = gql`
  ${GROUP_FRAGMENT}
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      ...GroupFields
    }
  }
`;

const UPDATE_GROUP_MENUS_MUTATION = gql`
  mutation UpdateGroupMenus($group_id: String!, $menu_ids: [String!]!) {
    updateGroupMenus(group_id: $group_id, menu_ids: $menu_ids)
  }
`;

const ASSIGN_USER_GROUP_MUTATION = gql`
  mutation AssignUserGroup($user_id: String!, $group_id: String!) {
    assignUserGroup(user_id: $user_id, group_id: $group_id)
  }
`;

const REMOVE_USER_GROUP_MUTATION = gql`
  mutation RemoveUserGroup($user_id: String!, $group_id: String!) {
    removeUserGroup(user_id: $user_id, group_id: $group_id)
  }
`;

// ─── Mappers ──────────────────────────────────────────────────────────────────

interface RawMenuDef {
  id: string; label: string; path?: string; icon?: string;
  parent_id?: string; sort_order: number;
  meta: { keep_alive: boolean; hidden: boolean; component_name?: string };
}
interface RawGroup {
  id: string; name: string; description?: string; is_default: boolean;
  menu_ids: string[]; created_at: string;
}
interface RawUser {
  id: string; username: string; display_name?: string; email?: string;
  avatar?: string; is_active: boolean; group_ids: string[];
  synced_at?: string; created_at: string;
}

function mapMenu(r: RawMenuDef): MenuDef {
  return {
    id: r.id, label: r.label, path: r.path, icon: r.icon,
    parentId: r.parent_id, sortOrder: r.sort_order,
    meta: { keepAlive: r.meta.keep_alive, hidden: r.meta.hidden, componentName: r.meta.component_name },
  };
}
function mapGroup(r: RawGroup): AppGroup {
  return { id: r.id, name: r.name, description: r.description, isDefault: r.is_default, menuIds: r.menu_ids, createdAt: r.created_at };
}
function mapUser(r: RawUser): AppUser {
  return { id: r.id, username: r.username, displayName: r.display_name, email: r.email, avatar: r.avatar, isActive: r.is_active, groupIds: r.group_ids, syncedAt: r.synced_at, createdAt: r.created_at };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  async getMyMenus(): Promise<MenuDef[]> {
    const r = await runQuery<{ myMenus: RawMenuDef[] }>(MY_MENUS_QUERY);
    return (r?.myMenus ?? []).map(mapMenu);
  },

  async getAllMenus(): Promise<MenuDef[]> {
    const r = await runQuery<{ adminMenus: RawMenuDef[] }>(ADMIN_MENUS_QUERY);
    return (r?.adminMenus ?? []).map(mapMenu);
  },

  async getGroups(): Promise<AppGroup[]> {
    const r = await runQuery<{ adminGroups: RawGroup[] }>(ADMIN_GROUPS_QUERY);
    return (r?.adminGroups ?? []).map(mapGroup);
  },

  async getUsers(filter?: { keyword?: string; isActive?: boolean }, page = 1, limit = 20): Promise<{ data: AppUser[]; total: number }> {
    const offset = (page - 1) * limit;
    const r = await runQuery<{ adminUsers: { data: RawUser[]; pagination: { total: number } } }>(
      ADMIN_USERS_QUERY,
      { filter: filter ? { keyword: filter.keyword, is_active: filter.isActive } : undefined, pagination: { offset, limit } },
    );
    return { data: (r?.adminUsers?.data ?? []).map(mapUser), total: r?.adminUsers?.pagination?.total ?? 0 };
  },

  async syncUsers(): Promise<number> {
    const r = await runMutation<{ syncUsers: number }>(SYNC_USERS_MUTATION);
    return r?.syncUsers ?? 0;
  },

  async createGroup(name: string, description?: string, isDefault = false): Promise<AppGroup> {
    const r = await runMutation<{ createGroup: RawGroup }>(CREATE_GROUP_MUTATION, {
      input: { name, description, is_default: isDefault },
    });
    return mapGroup(r.createGroup);
  },

  async updateGroupMenus(groupId: string, menuIds: string[]): Promise<boolean> {
    const r = await runMutation<{ updateGroupMenus: boolean }>(UPDATE_GROUP_MENUS_MUTATION, {
      group_id: groupId, menu_ids: menuIds,
    });
    return r?.updateGroupMenus ?? false;
  },

  async assignUserGroup(userId: string, groupId: string): Promise<boolean> {
    const r = await runMutation<{ assignUserGroup: boolean }>(ASSIGN_USER_GROUP_MUTATION, {
      user_id: userId, group_id: groupId,
    });
    return r?.assignUserGroup ?? false;
  },

  async removeUserGroup(userId: string, groupId: string): Promise<boolean> {
    const r = await runMutation<{ removeUserGroup: boolean }>(REMOVE_USER_GROUP_MUTATION, {
      user_id: userId, group_id: groupId,
    });
    return r?.removeUserGroup ?? false;
  },
};
