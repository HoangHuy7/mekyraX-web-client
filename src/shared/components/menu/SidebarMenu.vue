<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMenuStore } from '@/shared/store/menuStore';
import MenuItem from '@/shared/components/menu/MenuItem.vue';

interface Props {
  collapse?: boolean;
}

defineProps<Props>();
const route = useRoute();
const menuStore = useMenuStore();

const defaultOpeneds = ref<string[]>([]);

const activeMenu = computed<string>(() => {
  const current = menuStore.flatMenus.find((item) => item.path === route.path);
  return current?.id || '';
});

const openedMenus = computed<string[]>(() => {
  const parents = menuStore.getParentMenus(route.path);
  return parents.map((p) => p.id);
});

onMounted(async () => {
  // Always load from API if user has a token so F5 re-fetches the correct menus.
  const hasToken = !!localStorage.getItem('casdoor_access_token');
  await menuStore.loadMenus(hasToken);
  defaultOpeneds.value = openedMenus.value;
});
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    :default-openeds="defaultOpeneds"
    :collapse="collapse"
    :collapse-transition="false"
    class="sidebar-menu"
  >
    <MenuItem
      v-for="item in menuStore.visibleMenus"
      :key="item.id"
      :item="item"
      :collapse="collapse"
    />
  </el-menu>
</template>

<style scoped>
.sidebar-menu {
  border-right: none;
}
</style>

<script lang="ts">
export default {
  name: 'SidebarMenu',
};
</script>
