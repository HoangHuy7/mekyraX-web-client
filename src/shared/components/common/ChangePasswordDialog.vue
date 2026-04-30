<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { adminService } from '@/features/admin/services/adminService';

interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'changed'): void }>();

const { t } = useI18n();
const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const submitting = ref(false);

watch(() => props.modelValue, (v) => {
  if (v) form.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
});

async function submit() {
  if (form.value.newPassword.length < 6) {
    ElMessage.warning(t('admin.changePassword.tooShort'));
    return;
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    ElMessage.warning(t('admin.changePassword.mismatch'));
    return;
  }
  submitting.value = true;
  try {
    await adminService.changePassword(form.value.oldPassword, form.value.newPassword);
    ElMessage.success(t('admin.changePassword.success'));
    emit('changed');
    emit('update:modelValue', false);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : t('admin.changePassword.failed'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('admin.changePassword.title')"
    width="420px"
    :close-on-click-modal="false"
    :show-close="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p style="margin:0 0 16px;color:var(--el-text-color-secondary);font-size:13px">
      {{ t('admin.changePassword.subtitle') }}
    </p>
    <el-form :model="form" label-width="130px" @submit.prevent="submit">
      <el-form-item :label="t('admin.changePassword.oldPassword')">
        <el-input v-model="form.oldPassword" type="password" show-password autocomplete="current-password" />
      </el-form-item>
      <el-form-item :label="t('admin.changePassword.newPassword')">
        <el-input v-model="form.newPassword" type="password" show-password autocomplete="new-password" />
      </el-form-item>
      <el-form-item :label="t('admin.changePassword.confirmPassword')">
        <el-input v-model="form.confirmPassword" type="password" show-password autocomplete="new-password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :loading="submitting" @click="submit">
        {{ t('admin.changePassword.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
