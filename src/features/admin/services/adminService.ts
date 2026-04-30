import { gql } from '@apollo/client/core';
import { runMutation, runQuery } from '@/shared/graphql/request';
import type { AppUser, AppGroup, MenuDef, MyProfile } from '@/features/admin/types/admin.types';

// ─── Fragments ────────────────────────────────────────────────────────────────

const MENU_DEF_FRAGMENT = gql`
  fragment MenuDefFields on MenuDef {
    id label path icon parent_id sort_order
    meta { keep_alive hidden component_name }
  }
`;

const GROUP_FRAGMENT = gql`
  fragment GroupFields on AppGroup {
    id name description is_default menu_ids created_at
  }
`;

const USER_FRAGMENT = gql`
  fragment UserFields on AppUser {
    id username display_name email avatar
    is_active is_system must_change_password
    group_ids synced_at created_at
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

const MY_PROFILE_QUERY = gql`
  query MyProfile {
    myProfile { id username display_name must_change_password is_system }
  }
`;

const MY_MENUS_QUERY = gql`
  ${MENU_DEF_FRAGMENT}
  query MyMenus { myMenus { ...MenuDefFields } }
`;

const ADMIN_MENUS_QUERY = gql`
  ${MENU_DEF_FRAGMENT}
  query AdminMenus { adminMenus { ...MenuDefFields } }
`;

const ADMIN_GROUPS_QUERY = gql`
  ${GROUP_FRAGMENT}
  query AdminGroups { adminGroups { ...GroupFields } }
`;

const ADMIN_USERS_QUERY = gql`
  ${USER_FRAGMENT}
  query AdminUsers($filter: UserFilter, $pagination: PaginationInput) {
    adminUsers(filter: $filter, pagination: $pagination) {
      data { ...UserFields }
      pagination { total page page_size has_next }
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

const SYNC_USERS_MUTATION = gql`mutation SyncUsers { syncUsers }`;

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($old_password: String!, $new_password: String!) {
    changePassword(old_password: $old_password, new_password: $new_password)
  }
`;

const CREATE_LOCAL_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation CreateLocalUser($input: CreateLocalUserInput!) {
    createLocalUser(input: $input) { ...UserFields }
  }
`;

const ACTIVATE_USER_MUTATION = gql`
  mutation ActivateUser($user_id: String!) { activateUser(user_id: $user_id) }
`;

const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($user_id: String!) { deactivateUser(user_id: $user_id) }
`;

const RESET_USER_PASSWORD_MUTATION = gql`
  mutation ResetUserPassword($user_id: String!, $new_password: String!) {
    resetUserPassword(user_id: $user_id, new_password: $new_password)
  }
`;

const CREATE_GROUP_MUTATION = gql`
  ${GROUP_FRAGMENT}
  mutation CreateGroup($input: CreateGroupInput!) { createGroup(input: $input) { ...GroupFields } }
`;

const UPDATE_GROUP_MUTATION = gql`
  ${GROUP_FRAGMENT}
  mutation UpdateGroup($group_id: String!, $input: UpdateGroupInput!) {
    updateGroup(group_id: $group_id, input: $input) { ...GroupFields }
  }
`;

const DELETE_GROUP_MUTATION = gql`
  mutation DeleteGroup($group_id: String!) { deleteGroup(group_id: $group_id) }
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
  avatar?: string; is_active: boolean; is_system: boolean;
  must_change_password: boolean; group_ids: string[];
  synced_at?: string; created_at: string;
}
interface RawProfile {
  id: string; username: string; display_name?: string;
  must_change_password: boolean; is_system: boolean;
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
  return {
    id: r.id, username: r.username, displayName: r.display_name, email: r.email,
    avatar: r.avatar, isActive: r.is_active, isSystem: r.is_system,
    mustChangePassword: r.must_change_password,
    groupIds: r.group_ids, syncedAt: r.synced_at, createdAt: r.created_at,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const adminService = {
  async getMyProfile(): Promise<MyProfile> {
    const r = await runQuery<{ myProfile: RawProfile }>(MY_PROFILE_QUERY);
    const p = r!.myProfile;
    return { id: p.id, username: p.username, displayName: p.display_name, mustChangePassword: p.must_change_password, isSystem: p.is_system };
  },

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

  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const r = await runMutation<{ changePassword: boolean }>(CHANGE_PASSWORD_MUTATION, {
      old_password: oldPassword, new_password: newPassword,
    });
    return r?.changePassword ?? false;
  },

  async createLocalUser(username: string, password: string, displayName?: string, email?: string, groupId?: string): Promise<AppUser> {
    const r = await runMutation<{ createLocalUser: RawUser }>(CREATE_LOCAL_USER_MUTATION, {
      input: { username, password, display_name: displayName, email, group_id: groupId },
    });
    return mapUser(r!.createLocalUser);
  },

  async activateUser(userId: string): Promise<boolean> {
    const r = await runMutation<{ activateUser: boolean }>(ACTIVATE_USER_MUTATION, { user_id: userId });
    return r?.activateUser ?? false;
  },

  async deactivateUser(userId: string): Promise<boolean> {
    const r = await runMutation<{ deactivateUser: boolean }>(DEACTIVATE_USER_MUTATION, { user_id: userId });
    return r?.deactivateUser ?? false;
  },

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const r = await runMutation<{ resetUserPassword: boolean }>(RESET_USER_PASSWORD_MUTATION, {
      user_id: userId,
      new_password: newPassword,
    });
    return r?.resetUserPassword ?? false;
  },

  async createGroup(name: string, description?: string, isDefault = false): Promise<AppGroup> {
    const r = await runMutation<{ createGroup: RawGroup }>(CREATE_GROUP_MUTATION, {
      input: { name, description, is_default: isDefault },
    });
    return mapGroup(r!.createGroup);
  },

  async updateGroup(groupId: string, input: { name?: string; description?: string; isDefault?: boolean }): Promise<AppGroup> {
    const r = await runMutation<{ updateGroup: RawGroup }>(UPDATE_GROUP_MUTATION, {
      group_id: groupId,
      input: { name: input.name, description: input.description, is_default: input.isDefault },
    });
    return mapGroup(r!.updateGroup);
  },

  async deleteGroup(groupId: string): Promise<boolean> {
    const r = await runMutation<{ deleteGroup: boolean }>(DELETE_GROUP_MUTATION, { group_id: groupId });
    return r?.deleteGroup ?? false;
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
