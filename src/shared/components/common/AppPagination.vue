<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizes?: number[];
  hideOnSinglePage?: boolean;
  pagerCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  pageSizes: () => [10, 20, 50, 100],
  hideOnSinglePage: false,
  pagerCount: 7,
});

const emit = defineEmits<{
  'update:currentPage': [value: number];
  'update:pageSize': [value: number];
}>();

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (value: number) => emit('update:currentPage', value),
});

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (value: number) => emit('update:pageSize', value),
});
</script>

<template>
  <div class="app-pagination">
    <el-pagination
      v-model:current-page="currentPageModel"
      v-model:page-size="pageSizeModel"
      :total="total"
      :page-sizes="pageSizes"
      :hide-on-single-page="hideOnSinglePage"
      :pager-count="pagerCount"
      layout="total, sizes, prev, pager, next, jumper"
      background
    />
  </div>
</template>

<script lang="ts">
export default {
  name: 'AppPagination',
};
</script>

<style scoped>
.app-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .app-pagination {
    justify-content: center;
  }
}
</style>
