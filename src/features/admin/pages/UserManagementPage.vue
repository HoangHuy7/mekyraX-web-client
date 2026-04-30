<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { RefreshRight, Search, ArrowDown, Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { adminService } from '@/features/admin/services/adminService';
import type { AppUser, AppGroup } from '@/features/admin/types/admin.types';

defineOptions({ name: 'UserManagementPage' });

const { t } = useI18n();
const users = ref<AppUser[]>([]);
const groups = ref<AppGroup[]>([]);
const total = ref(0);
const loading = ref(false);
const syncing = ref(false);
const page = ref(1);
const keyword = ref('');

// Assign group dialog
const assignDialog = ref(false);
const selectedUser = ref<AppUser | null>(null);
const selectedGroupId = ref('');
const assigning = ref(false);

// Add user dialog
const addUserDialog = ref(false);
const addUserForm = ref({ username: '', password: '', displayName: '', email: '', groupId: '' });
const addingUser = ref(false);

// Reset password dialog
const resetPwdDialog = ref(false);
const resetPwdUser = ref<AppUser | null>(null);
const resetPwdForm = ref({ newPassword: '', confirmPassword: '' });
const resettingPwd = ref(false);

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchGroups()]);
});

async function fetchUsers() {
  loading.value = true;
  try {
    const result = await adminService.getUsers({ keyword: keyword.value || undefined }, page.value);
    users.value = result.data;
    total.value = result.total;
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.users.loadFailed'));
  } finally {
    loading.value = false;
  }
}

async function fetchGroups() {
  try {
    groups.value = await adminService.getGroups();
  } catch { /* ignore */ }
}

async function syncUsers() {
  syncing.value = true;
  try {
    const count = await adminService.syncUsers();
    ElMessage.success(t('admin.users.syncSuccess', { count }));
    await fetchUsers();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.users.syncFailed'));
  } finally {
    syncing.value = false;
  }
}

function openAssign(user: AppUser) {
  selectedUser.value = user;
  selectedGroupId.value = user.groupIds[0] ?? '';
  assignDialog.value = true;
}

async function confirmAssign() {
  if (!selectedUser.value || !selectedGroupId.value) return;
  assigning.value = true;
  try {
    for (const gid of selectedUser.value.groupIds) {
      await adminService.removeUserGroup(selectedUser.value.id, gid);
    }
    await adminService.assignUserGroup(selectedUser.value.id, selectedGroupId.value);
    ElMessage.success(t('admin.users.assignSuccess'));
    assignDialog.value = false;
    await fetchUsers();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.users.assignFailed'));
  } finally {
    assigning.value = false;
  }
}

async function toggleActive(user: AppUser) {
  if (user.isSystem) return;
  try {
    if (user.isActive) {
      await adminService.deactivateUser(user.id);
      ElMessage.success(t('admin.users.deactivateSuccess'));
    } else {
      await adminService.activateUser(user.id);
      ElMessage.success(t('admin.users.activateSuccess'));
    }
    await fetchUsers();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : (user.isActive ? t('admin.users.deactivateFailed') : t('admin.users.activateFailed')));
  }
}

async function addUser() {
  if (!addUserForm.value.username.trim()) {
    ElMessage.warning(t('admin.users.usernameLabel'));
    return;
  }
  if (!addUserForm.value.password.trim()) {
    ElMessage.warning(t('admin.users.passwordRequired'));
    return;
  }
  addingUser.value = true;
  try {
    await adminService.createLocalUser(
      addUserForm.value.username.trim(),
      addUserForm.value.password.trim(),
      addUserForm.value.displayName || undefined,
      addUserForm.value.email || undefined,
      addUserForm.value.groupId || undefined,
    );
    ElMessage.success(t('admin.users.createSuccess'));
    addUserDialog.value = false;
    addUserForm.value = { username: '', password: '', displayName: '', email: '', groupId: '' };
    await fetchUsers();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.users.createFailed'));
  } finally {
    addingUser.value = false;
  }
}

function getGroupName(groupId: string): string {
  return groups.value.find((g) => g.id === groupId)?.name ?? groupId;
}

function handleSearch() {
  page.value = 1;
  fetchUsers();
}

function handleCommand(cmd: string, row: AppUser) {
  if (cmd === 'assign') openAssign(row);
  else if (cmd === 'toggle') toggleActive(row);
  else if (cmd === 'reset_pwd') openResetPwd(row);
}

function openResetPwd(user: AppUser) {
  resetPwdUser.value = user;
  resetPwdForm.value = { newPassword: '', confirmPassword: '' };
  resetPwdDialog.value = true;
}

async function confirmResetPwd() {
  if (!resetPwdUser.value) return;
  if (!resetPwdForm.value.newPassword.trim()) {
    ElMessage.warning(t('admin.users.passwordRequired'));
    return;
  }
  if (resetPwdForm.value.newPassword !== resetPwdForm.value.confirmPassword) {
    ElMessage.warning(t('admin.changePassword.mismatch'));
    return;
  }
  resettingPwd.value = true;
  try {
    await adminService.resetUserPassword(resetPwdUser.value.id, resetPwdForm.value.newPassword.trim());
    ElMessage.success(t('admin.users.resetPwdSuccess'));
    resetPwdDialog.value = false;
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.users.resetPwdFailed'));
  } finally {
    resettingPwd.value = false;
  }
}
</script>

<template>
  <div class="user-mgmt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('admin.users.title') }}</h1>
        <p class="page-subtitle">{{ t('admin.users.subtitle') }}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <el-button :icon="Plus" @click="addUserDialog = true">
          {{ t('admin.users.addUser') }}
        </el-button>
        <el-button type="primary" :icon="RefreshRight" :loading="syncing" @click="syncUsers">
          {{ t('admin.users.syncCasdoor') }}
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-input
        v-model="keyword"
        :placeholder="t('admin.users.searchPlaceholder')"
        :prefix-icon="Search"
        clearable
        style="width: 320px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-button type="primary" plain @click="handleSearch" style="margin-left: 8px">
        {{ t('admin.users.search') }}
      </el-button>
    </el-card>

    <el-card shadow="hover" v-loading="loading">
      <el-table :data="users" stripe style="width:100%">
        <el-table-column :label="t('admin.users.username')" prop="username" min-width="120" show-overflow-tooltip />
        <el-table-column :label="t('admin.users.displayName')" prop="displayName" min-width="130" show-overflow-tooltip />
        <el-table-column :label="t('admin.users.email')" prop="email" min-width="160" show-overflow-tooltip />
        <el-table-column :label="t('admin.users.group')" min-width="120">
          <template #default="{ row }">
            <el-tag v-for="gid in row.groupIds" :key="gid" size="small" style="margin-right:4px">
              {{ getGroupName(gid) }}
            </el-tag>
            <span v-if="!row.groupIds.length" class="text-secondary">{{ t('admin.users.noGroup') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.users.status')" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem" size="small" type="warning">{{ t('admin.users.systemUser') }}</el-tag>
            <el-tag v-else :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? t('admin.users.active') : t('admin.users.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.users.lastSync')" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.syncedAt ? new Date(row.syncedAt).toLocaleString('vi-VN') : '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('admin.users.actions')" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
              <el-button size="small" type="primary" plain>
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="assign">{{ t('admin.users.assignGroup') }}</el-dropdown-item>
                  <el-dropdown-item v-if="!row.isSystem" command="reset_pwd">{{ t('admin.users.resetPwd') }}</el-dropdown-item>
                  <el-dropdown-item v-if="!row.isSystem" command="toggle" :divided="true">
                    {{ row.isActive ? t('admin.users.deactivate') : t('admin.users.activate') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        :page-size="20"
        :total="total"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="fetchUsers"
      />
    </el-card>

    <!-- Assign group dialog -->
    <el-dialog v-model="assignDialog" :title="t('admin.users.assignGroupTitle')" width="380px">
      <div v-if="selectedUser">
        <p style="margin-bottom:12px">
          User: <strong>{{ selectedUser.displayName || selectedUser.username }}</strong>
        </p>
        <el-select v-model="selectedGroupId" :placeholder="t('admin.users.selectGroup')" style="width:100%">
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="assignDialog = false">{{ t('admin.users.cancel') }}</el-button>
        <el-button type="primary" :loading="assigning" :disabled="!selectedGroupId" @click="confirmAssign">
          {{ t('admin.users.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Add user dialog -->
    <el-dialog v-model="addUserDialog" :title="t('admin.users.addUserTitle')" width="420px">
      <el-form :model="addUserForm" label-width="120px">
        <el-form-item :label="t('admin.users.usernameLabel')" required>
          <el-input v-model="addUserForm.username" :placeholder="t('admin.users.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.users.passwordLabel')" required>
          <el-input v-model="addUserForm.password" type="password" show-password :placeholder="t('admin.users.passwordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.users.displayName')">
          <el-input v-model="addUserForm.displayName" />
        </el-form-item>
        <el-form-item :label="t('admin.users.email')">
          <el-input v-model="addUserForm.email" type="email" />
        </el-form-item>
        <el-form-item :label="t('admin.users.group')">
          <el-select v-model="addUserForm.groupId" :placeholder="t('admin.users.selectGroup')" style="width:100%" clearable>
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addUserDialog = false">{{ t('admin.users.cancel') }}</el-button>
        <el-button type="primary" :loading="addingUser" @click="addUser">
          {{ t('admin.groups.create') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Reset password dialog -->
    <el-dialog v-model="resetPwdDialog" :title="t('admin.users.resetPwdTitle')" width="400px">
      <div v-if="resetPwdUser" style="margin-bottom:12px">
        User: <strong>{{ resetPwdUser.displayName || resetPwdUser.username }}</strong>
      </div>
      <el-form :model="resetPwdForm" label-width="130px">
        <el-form-item :label="t('admin.users.passwordLabel')" required>
          <el-input v-model="resetPwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('admin.changePassword.confirmPassword')" required>
          <el-input v-model="resetPwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialog = false">{{ t('admin.users.cancel') }}</el-button>
        <el-button type="warning" :loading="resettingPwd" @click="confirmResetPwd">
          {{ t('admin.users.resetPwd') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-mgmt-page { padding: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.page-title { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.filter-card { margin-bottom: 14px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.text-secondary { color: var(--el-text-color-secondary); font-size: 12px; }
</style>
