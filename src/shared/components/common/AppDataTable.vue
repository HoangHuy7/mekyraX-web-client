<script setup lang="ts">
import { computed } from 'vue';
import AppPagination from '@/shared/components/common/AppPagination.vue';

export interface AppDataTableColumn {
  prop: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean | 'custom';
  fixed?: 'left' | 'right' | boolean;
  formatter?: (row: any, index: number) => string;
  slot?: string;
}

interface Props {
  data: any[];
  columns: AppDataTableColumn[];
  loading?: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizes?: number[];
  rowKey?: string;
  defaultSort?: { prop: string; order: 'ascending' | 'descending' };
  emptyText?: string;
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pageSizes: () => [10, 20, 50, 100],
  rowKey: 'id',
  hoverable: true,
});

const emit = defineEmits<{
  'update:currentPage': [value: number];
  'update:pageSize': [value: number];
  'sort-change': [value: { prop: string; order: 'ascending' | 'descending' | null }];
  'row-click': [row: any];
}>();

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (value: number) => emit('update:currentPage', value),
});

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (value: number) => emit('update:pageSize', value),
});

const onSortChange = (e: { prop: string; order: 'ascending' | 'descending' | null }): void => {
  emit('sort-change', e);
};

const onRowClick = (row: any): void => {
  emit('row-click', row);
};

// Generic slots: any cell slot receives { row, $index }.
defineSlots<{ [name: string]: (props: any) => any }>();
</script>

<template>
  <div class="app-data-table" :class="{ 'is-hoverable': hoverable }">
    <el-table
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      :default-sort="defaultSort"
      :empty-text="emptyText"
      stripe
      class="adt-table"
      @sort-change="onSortChange"
      @row-click="onRowClick"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        :sortable="col.sortable"
        :fixed="col.fixed"
        :formatter="col.formatter ? (row: any, _c: any, _v: any, index: number) => col.formatter!(row, index) : undefined"
      >
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="(scope as any).row" :$index="(scope as any).$index" />
        </template>
      </el-table-column>

      <slot name="actions" />
    </el-table>

    <AppPagination
      v-model:current-page="currentPageModel"
      v-model:page-size="pageSizeModel"
      :total="total"
      :page-sizes="pageSizes"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'AppDataTable' };
</script>

<style scoped>
.app-data-table { width: 100%; }
.adt-table { width: 100%; }
.is-hoverable :deep(.el-table__body tr) { cursor: pointer; }
</style>
