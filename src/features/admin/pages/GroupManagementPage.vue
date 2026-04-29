<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { adminService } from '@/features/admin/services/adminService';
import type { AppGroup, MenuDef } from '@/features/admin/types/admin.types';

defineOptions({ name: 'GroupManagementPage' });

const groups = ref<AppGroup[]>([]);
const allMenus = ref<MenuDef[]>([]);
const loading = ref(false);

// Create group dialog
const createDialog = ref(false);
const creating = ref(false);
const createForm = ref({ name: '', description: '', isDefault: false });

// Edit menus dialog
const menuDialog = ref(false);
const editingGroup = ref<AppGroup | null>(null);
const selectedMenuIds = ref<string[]>([]);
const savingMenus = ref(false);

onMounted(async () => {
  await fetchAll();
});

async function fetchAll() {
  loading.value = true;
  try {
    const [g, m] = await Promise.all([adminService.getGroups(), adminService.getAllMenus()]);
    groups.value = g;
    allMenus.value = m;
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
  } finally {
    loading.value = false;
  }
}

async function createGroup() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('Nhập tên group');
    return;
  }
  creating.value = true;
  try {
    await adminService.createGroup(createForm.value.name.trim(), createForm.value.description, createForm.value.isDefault);
    ElMessage.success('Tạo group thành công');
    createDialog.value = false;
    createForm.value = { name: '', description: '', isDefault: false };
    await fetchAll();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Tạo group thất bại');
  } finally {
    creating.value = false;
  }
}

function openMenuDialog(group: AppGroup) {
  editingGroup.value = group;
  selectedMenuIds.value = [...group.menuIds];
  menuDialog.value = true;
}

async function saveMenus() {
  if (!editingGroup.value) return;
  savingMenus.value = true;
  try {
    await adminService.updateGroupMenus(editingGroup.value.id, selectedMenuIds.value);
    ElMessage.success('Đã cập nhật menus');
    menuDialog.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : 'Lỗi cập nhật menus');
  } finally {
    savingMenus.value = false;
  }
}

// Group menus into tree for display in dialog
const menuTree = computed(() => {
  const roots = allMenus.value.filter((m) => !m.parentId);
  return roots.map((root) => ({
    ...root,
    children: allMenus.value.filter((m) => m.parentId === root.id),
  }));
});

function getMenuLabel(id: string): string {
  return allMenus.value.find((m) => m.id === id)?.label ?? id;
}

function toggleAll(group: AppGroup) {
  const allIds = allMenus.value.map((m) => m.id);
  if (selectedMenuIds.value.length === allIds.length) {
    selectedMenuIds.value = [];
  } else {
    selectedMenuIds.value = [...allIds];
  }
}
</script>

<template>
  <div class="group-mgmt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý Groups</h1>
        <p class="page-subtitle">Tạo group, phân quyền menu theo group</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="createDialog = true">Tạo group</el-button>
    </div>

    <el-row :gutter="14" v-loading="loading">
      <el-col :xs="24" :sm="12" :lg="8" v-for="group in groups" :key="group.id">
        <el-card shadow="hover" class="group-card">
          <div class="group-header">
            <div>
              <span class="group-name">{{ group.name }}</span>
              <el-tag v-if="group.isDefault" size="small" type="success" style="margin-left:8px">Mặc định</el-tag>
            </div>
            <el-button size="small" type="primary" plain @click="openMenuDialog(group)">
              Phân quyền menu
            </el-button>
          </div>
          <p class="group-desc">{{ group.description || '—' }}</p>
          <div class="menu-tags">
            <el-tag
              v-for="mid in group.menuIds.slice(0, 6)"
              :key="mid"
              size="small"
              type="info"
              style="margin: 2px"
            >
              {{ getMenuLabel(mid) }}
            </el-tag>
            <el-tag v-if="group.menuIds.length > 6" size="small" type="info">
              +{{ group.menuIds.length - 6 }} menus
            </el-tag>
            <span v-if="!group.menuIds.length" class="text-secondary">Chưa có menu nào</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Create group dialog -->
    <el-dialog v-model="createDialog" title="Tạo group mới" width="420px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="Tên group" required>
          <el-input v-model="createForm.name" placeholder="Ví dụ: Kế toán" />
        </el-form-item>
        <el-form-item label="Mô tả">
          <el-input v-model="createForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Mặc định">
          <el-switch v-model="createForm.isDefault" />
          <span style="margin-left:8px;font-size:12px;color:var(--el-text-color-secondary)">
            Tự động gán cho user mới
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog = false">Hủy</el-button>
        <el-button type="primary" :loading="creating" @click="createGroup">Tạo</el-button>
      </template>
    </el-dialog>

    <!-- Assign menus dialog -->
    <el-dialog
      v-model="menuDialog"
      :title="`Phân quyền menu — ${editingGroup?.name}`"
      width="520px"
    >
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--el-text-color-secondary)">
          Đã chọn {{ selectedMenuIds.length }}/{{ allMenus.length }} menus
        </span>
        <el-button size="small" plain @click="toggleAll(editingGroup!)">
          {{ selectedMenuIds.length === allMenus.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}
        </el-button>
      </div>

      <div class="menu-tree">
        <div v-for="root in menuTree" :key="root.id" class="menu-group">
          <!-- Parent menu -->
          <el-checkbox
            :model-value="selectedMenuIds.includes(root.id)"
            class="menu-parent"
            @change="(v: boolean) => { if(v) selectedMenuIds.push(root.id); else selectedMenuIds = selectedMenuIds.filter(id => id !== root.id) }"
          >
            <span class="menu-label-parent">{{ root.label }}</span>
            <span v-if="!root.path" class="menu-badge">(nhóm)</span>
          </el-checkbox>

          <!-- Children -->
          <div v-if="root.children?.length" class="menu-children">
            <el-checkbox
              v-for="child in root.children"
              :key="child.id"
              :model-value="selectedMenuIds.includes(child.id)"
              class="menu-child"
              @change="(v: boolean) => { if(v) selectedMenuIds.push(child.id); else selectedMenuIds = selectedMenuIds.filter(id => id !== child.id) }"
            >
              {{ child.label }}
              <el-tag v-if="child.meta?.hidden" size="small" type="warning" style="margin-left:4px">ẩn</el-tag>
            </el-checkbox>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="menuDialog = false">Hủy</el-button>
        <el-button type="primary" :loading="savingMenus" @click="saveMenus">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.group-mgmt-page { padding: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.page-title { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }

.group-card { margin-bottom: 14px; }
.group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.group-name { font-weight: 600; font-size: 15px; }
.group-desc { margin: 0 0 10px; font-size: 13px; color: var(--el-text-color-secondary); }
.menu-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.text-secondary { color: var(--el-text-color-secondary); font-size: 12px; }

/* menu tree in dialog */
.menu-tree { max-height: 400px; overflow-y: auto; padding: 4px 0; }
.menu-group { margin-bottom: 12px; }
.menu-parent { font-weight: 600; display: block; margin-bottom: 4px; }
.menu-label-parent { font-weight: 600; }
.menu-badge { font-size: 11px; color: var(--el-text-color-secondary); margin-left: 4px; }
.menu-children { padding-left: 24px; display: flex; flex-direction: column; gap: 4px; }
.menu-child { display: block; }
</style>
