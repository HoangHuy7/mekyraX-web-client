<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { MenuItem as MenuItemType } from '@/shared/types/menu.types';

interface Props {
  item: MenuItemType;
  collapse?: boolean;
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const hasChildren = computed<boolean>(() => {
  return !!props.item.children && props.item.children.length > 0;
});

const isActive = computed<boolean>(() => {
  if (!props.item.path) return false;
  return route.path === props.item.path || route.path.startsWith(props.item.path + '/');
});

const handleClick = (): void => {
  if (props.item.path) {
    router.push(props.item.path);
  }
};
</script>

<template>
  <template v-if="hasChildren">
    <el-sub-menu :index="item.id">
      <template #title>
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ t(item.label) }}</span>
      </template>
      <MenuItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :collapse="collapse"
      />
    </el-sub-menu>
  </template>
  <template v-else>
    <el-menu-item
      :index="item.id"
      :class="{ 'is-active': isActive }"
      @click="handleClick"
    >
      <el-icon v-if="item.icon">
        <component :is="item.icon" />
      </el-icon>
      <template #title>
        <span>{{ t(item.label) }}</span>
      </template>
    </el-menu-item>
  </template>
</template>

<script lang="ts">
export default {
  name: 'MenuItem',
};
</script>
