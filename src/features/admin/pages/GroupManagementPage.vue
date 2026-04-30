<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { adminService } from '@/features/admin/services/adminService';
import type { AppGroup, MenuDef } from '@/features/admin/types/admin.types';

defineOptions({ name: 'GroupManagementPage' });

const { t } = useI18n();
const groups = ref<AppGroup[]>([]);
const allMenus = ref<MenuDef[]>([]);
const loading = ref(false);

// Create
const createDialog = ref(false);
const creating = ref(false);
const createForm = ref({ name: '', description: '', isDefault: false });

// Edit
const editDialog = ref(false);
const editingGroupId = ref('');
const editForm = ref({ name: '', description: '', isDefault: false });
const updating = ref(false);

// Assign menus
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
    ElMessage.error(e instanceof Error ? e.message : t('admin.groups.loadFailed'));
  } finally {
    loading.value = false;
  }
}

async function createGroup() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning(t('admin.groups.groupName'));
    return;
  }
  creating.value = true;
  try {
    await adminService.createGroup(createForm.value.name.trim(), createForm.value.description, createForm.value.isDefault);
    ElMessage.success(t('admin.groups.createSuccess'));
    createDialog.value = false;
    createForm.value = { name: '', description: '', isDefault: false };
    await fetchAll();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.groups.createFailed'));
  } finally {
    creating.value = false;
  }
}

function openEdit(group: AppGroup) {
  editingGroupId.value = group.id;
  editForm.value = { name: group.name, description: group.description ?? '', isDefault: group.isDefault };
  editDialog.value = true;
}

async function updateGroup() {
  updating.value = true;
  try {
    await adminService.updateGroup(editingGroupId.value, {
      name: editForm.value.name,
      description: editForm.value.description,
      isDefault: editForm.value.isDefault,
    });
    ElMessage.success(t('admin.groups.updateSuccess'));
    editDialog.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.groups.updateFailed'));
  } finally {
    updating.value = false;
  }
}

async function confirmDelete(group: AppGroup) {
  await ElMessageBox.confirm(
    t('admin.groups.deleteGroupConfirm', { name: group.name }),
    t('common.confirmDelete'),
    { type: 'warning', confirmButtonText: t('admin.groups.deleteGroup'), cancelButtonText: t('admin.groups.cancel') },
  );
  try {
    await adminService.deleteGroup(group.id);
    ElMessage.success(t('admin.groups.deleteSuccess'));
    await fetchAll();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.groups.deleteFailed'));
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
    ElMessage.success(t('admin.groups.saveMenusSuccess'));
    menuDialog.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.groups.saveMenusFailed'));
  } finally {
    savingMenus.value = false;
  }
}

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

function toggleMenuId(id: string, checked: boolean) {
  if (checked) {
    if (!selectedMenuIds.value.includes(id)) selectedMenuIds.value.push(id);
  } else {
    selectedMenuIds.value = selectedMenuIds.value.filter((x) => x !== id);
  }
}

function toggleAll() {
  const allIds = allMenus.value.map((m) => m.id);
  selectedMenuIds.value = selectedMenuIds.value.length === allIds.length ? [] : [...allIds];
}

// Fixed admin group id
const ADMIN_GROUP_ID = '00000000-0000-0000-0000-000000000001';
</script>

<template>
  <div class="group-mgmt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('admin.groups.title') }}</h1>
        <p class="page-subtitle">{{ t('admin.groups.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="createDialog = true">
        {{ t('admin.groups.createGroup') }}
      </el-button>
    </div>

    <el-row :gutter="14" v-loading="loading">
      <el-col :xs="24" :sm="12" :lg="8" v-for="group in groups" :key="group.id">
        <el-card shadow="hover" class="group-card">
          <div class="group-header">
            <div class="group-title">
              <span class="group-name">{{ group.name }}</span>
              <el-tag v-if="group.isDefault" size="small" type="success" style="margin-left:6px">
                {{ t('admin.groups.defaultBadge') }}
              </el-tag>
            </div>
            <div class="group-actions">
              <el-button size="small" plain @click="openMenuDialog(group)">
                {{ t('admin.groups.assignMenus') }}
              </el-button>
              <el-button size="small" plain @click="openEdit(group)">
                {{ t('admin.groups.editGroup') }}
              </el-button>
              <el-button
                v-if="group.id !== ADMIN_GROUP_ID"
                size="small"
                type="danger"
                plain
                @click="confirmDelete(group)"
              >
                {{ t('admin.groups.deleteGroup') }}
              </el-button>
            </div>
          </div>
          <p class="group-desc">{{ group.description || '—' }}</p>
          <div class="menu-tags">
            <el-tag v-for="mid in group.menuIds.slice(0, 5)" :key="mid" size="small" type="info" style="margin:2px">
              {{ getMenuLabel(mid) }}
            </el-tag>
            <el-tag v-if="group.menuIds.length > 5" size="small" type="info">+{{ group.menuIds.length - 5 }}</el-tag>
            <span v-if="!group.menuIds.length" class="text-secondary">{{ t('admin.groups.noMenus') }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Create group -->
    <el-dialog v-model="createDialog" :title="t('admin.groups.createGroupTitle')" width="420px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item :label="t('admin.groups.groupName')" required>
          <el-input v-model="createForm.name" :placeholder="t('admin.groups.groupNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('admin.groups.description')">
          <el-input v-model="createForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="t('admin.groups.isDefault')">
          <el-switch v-model="createForm.isDefault" />
          <span style="margin-left:8px;font-size:12px;color:var(--el-text-color-secondary)">
            {{ t('admin.groups.isDefaultHint') }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog = false">{{ t('admin.groups.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="createGroup">{{ t('admin.groups.create') }}</el-button>
      </template>
    </el-dialog>

    <!-- Edit group -->
    <el-dialog v-model="editDialog" :title="t('admin.groups.editGroupTitle')" width="420px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item :label="t('admin.groups.groupName')" required>
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item :label="t('admin.groups.description')">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="t('admin.groups.isDefault')">
          <el-switch v-model="editForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">{{ t('admin.groups.cancel') }}</el-button>
        <el-button type="primary" :loading="updating" @click="updateGroup">{{ t('admin.groups.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Assign menus -->
    <el-dialog
      v-model="menuDialog"
      :title="`${t('admin.groups.assignMenusTitle')} — ${editingGroup?.name}`"
      width="520px"
    >
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--el-text-color-secondary)">
          {{ t('admin.groups.selected', { count: selectedMenuIds.length, total: allMenus.length }) }}
        </span>
        <el-button size="small" plain @click="toggleAll">
          {{ selectedMenuIds.length === allMenus.length ? t('admin.groups.deselectAll') : t('admin.groups.selectAll') }}
        </el-button>
      </div>
      <div class="menu-tree">
        <div v-for="root in menuTree" :key="root.id" class="menu-group">
          <el-checkbox
            :model-value="selectedMenuIds.includes(root.id)"
            class="menu-parent"
            @change="(v: boolean) => toggleMenuId(root.id, v)"
          >
            <span class="menu-label-parent">{{ root.label }}</span>
            <span v-if="!root.path" class="menu-badge">{{ t('admin.groups.groupBadge') }}</span>
          </el-checkbox>
          <div v-if="root.children?.length" class="menu-children">
            <el-checkbox
              v-for="child in root.children"
              :key="child.id"
              :model-value="selectedMenuIds.includes(child.id)"
              class="menu-child"
              @change="(v: boolean) => toggleMenuId(child.id, v)"
            >
              {{ child.label }}
              <el-tag v-if="child.meta?.hidden" size="small" type="warning" style="margin-left:4px">
                {{ t('admin.groups.hiddenBadge') }}
              </el-tag>
            </el-checkbox>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="menuDialog = false">{{ t('admin.groups.cancel') }}</el-button>
        <el-button type="primary" :loading="savingMenus" @click="saveMenus">{{ t('admin.groups.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.group-mgmt-page { padding: 8px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.page-title { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
.page-subtitle { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.group-card { margin-bottom: 14px; }
.group-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; flex-wrap: wrap; }
.group-title { display: flex; align-items: center; flex-shrink: 0; }
.group-actions { display: flex; gap: 4px; flex-wrap: wrap; }
.group-name { font-weight: 600; font-size: 15px; }
.group-desc { margin: 0 0 10px; font-size: 13px; color: var(--el-text-color-secondary); }
.menu-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.text-secondary { color: var(--el-text-color-secondary); font-size: 12px; }
.menu-tree { max-height: 400px; overflow-y: auto; padding: 4px 0; }
.menu-group { margin-bottom: 12px; }
.menu-parent { font-weight: 600; display: block; margin-bottom: 4px; }
.menu-label-parent { font-weight: 600; }
.menu-badge { font-size: 11px; color: var(--el-text-color-secondary); margin-left: 4px; }
.menu-children { padding-left: 24px; display: flex; flex-direction: column; gap: 4px; }
.menu-child { display: block; }
</style>
