<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue: number;
  min?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const focused = ref(false);

// Strip all non-digit characters and parse
const parseRaw = (s: string): number => {
  const stripped = s.replace(/[^0-9]/g, '');
  return stripped === '' ? 0 : parseInt(stripped, 10);
};

// Format with dot-separated thousands e.g. 100000 → "100.000"
const formatMoney = (n: number): string => {
  if (!n && n !== 0) return '';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const displayValue = computed(() =>
  focused.value ? formatMoney(props.modelValue) : formatMoney(props.modelValue)
);

const onInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value;
  const parsed = parseRaw(raw);
  const min = props.min ?? 0;
  emit('update:modelValue', Math.max(min, parsed));
};

const onFocus = (event: FocusEvent) => {
  focused.value = true;
  // Select all text on focus for easy replacement
  setTimeout(() => (event.target as HTMLInputElement).select(), 0);
};

const onBlur = () => {
  focused.value = false;
};
</script>

<template>
  <el-input
    :model-value="displayValue"
    :placeholder="placeholder ?? '0'"
    :disabled="disabled"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
  >
    <template #suffix>
      <span style="color: var(--el-text-color-secondary); font-size: 12px">₫</span>
    </template>
  </el-input>
</template>
