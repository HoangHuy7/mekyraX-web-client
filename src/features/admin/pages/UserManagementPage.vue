<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { RefreshRight, Search } from '@element-plus/icons-vue';
import { adminService } from '@/features/admin/services/adminService';
import type { AppUser, AppGroup } from '@/features/admin/types/admin.types';

defineOptions({ name: 'UserManagementPage' });

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
    ElMessage.error(e instanceof Error ? e.message : 'Lỗi tải danh sách user');
  } finally {
    loading.value = false;
  }
}

async function fetchGroups() {
  try {
    groups.value = await adminService.getGroups();
  } catch {
    // ignore
  }
}

async function syncUsers() {
  syncing.value = true;
  try {
    const count = await adminService.syncUsers();
    ElMessage.success(`Đã sync ${count} users từ Casdoor`);
    await fetchUsers();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Sync thất bại');
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
    // Remove all existing groups first, then assign new
    for (const gid of selectedUser.value.groupIds) {
      await adminService.removeUserGroup(selectedUser.value.id, gid);
    }
    await adminService.assignUserGroup(selectedUser.value.id, selectedGroupId.value);
    ElMessage.success('Đã cập nhật group');
    assignDialog.value = false;
    await fetchUsers();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Lỗi cập nhật group');
  } finally {
    assigning.value = false;
  }
}

function getGroupName(groupId: string): string {
  return groups.value.find((g) => g.id === groupId)?.name ?? groupId;
}

function handleSearch() {
  page.value = 1;
  fetchUsers();
}
</script>

<template>
  <div class="user-mgmt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Users</h1>
        <p class="page-subtitle">Danh sách người dùng, phân quyền group</p>
      </div>
      <el-button type="primary" :icon="RefreshRight" :loading="syncing" @click="syncUsers">
        Sync từ Casdoor
      </el-button>
    </div>

    <!-- Search -->
    <el-card shadow="never" class="filter-card">
      <el-input
        v-model="keyword"
        placeholder="Tìm theo username, tên, email..."
        :prefix-icon="Search"
        clearable
        style="width: 320px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-button type="primary" plain @click="handleSearch" style="margin-left: 8px">Tìm kiếm</el-button>
    </el-card>

    <!-- Table -->
    <el-card shadow="hover" v-loading="loading">
      <el-table :data="users" stripe style="width:100%">
        <el-table-column label="Username" prop="username" min-width="140" />
        <el-table-column label="Tên hiển thị" prop="displayName" min-width="140" />
        <el-table-column label="Email" prop="email" min-width="180" />
        <el-table-column label="Group" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="gid in row.groupIds" :key="gid" size="small" style="margin-right:4px">
              {{ getGroupName(gid) }}
            </el-tag>
            <span v-if="!row.groupIds.length" class="text-secondary">Chưa có group</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="110">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? 'Hoạt động' : 'Tắt' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Sync lần cuối" min-width="160">
          <template #default="{ row }">
            {{ row.syncedAt ? new Date(row.syncedAt).toLocaleString('vi-VN') : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="110" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openAssign(row)">Phân group</el-button>
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
    <el-dialog v-model="assignDialog" title="Phân group cho user" width="380px">
      <div v-if="selectedUser">
        <p style="margin-bottom:12px">
          User: <strong>{{ selectedUser.displayName || selectedUser.username }}</strong>
        </p>
        <el-select v-model="selectedGroupId" placeholder="Chọn group" style="width:100%">
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="assignDialog = false">Hủy</el-button>
        <el-button type="primary" :loading="assigning" :disabled="!selectedGroupId" @click="confirmAssign">
          Xác nhận
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-mgmt-page { padding: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.filter-card { margin-bottom: 14px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.text-secondary { color: var(--el-text-color-secondary); font-size: 12px; }
</style>
