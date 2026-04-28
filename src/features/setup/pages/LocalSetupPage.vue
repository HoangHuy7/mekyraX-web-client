<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
  loadRuntimeConfig,
  saveSetupInfo,
  type RuntimeConfig,
} from '@/shared/config/runtimeConfig';

const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const submitting = ref(false);
const runtimeConfig = ref<RuntimeConfig | null>(null);

const form = reactive({
  agencyName: '',
  phone: '',
  licenseId: '',
  merchantId: '',
});

const loadConfig = async (): Promise<void> => {
  loading.value = true;
  try {
    const config = await loadRuntimeConfig();
    runtimeConfig.value = config;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('setup.configLoadFailed'));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadConfig();
});

const submitSetup = (): void => {
  if (!form.agencyName.trim() || !form.phone.trim() || !form.licenseId.trim() || !form.merchantId.trim()) {
    ElMessage.error(t('setup.requiredFields'));
    return;
  }

  const merchantId = form.merchantId.trim();
  const merchantIds = Object.keys(runtimeConfig.value?.merchants || {});
  if (!merchantIds.includes(merchantId)) {
    ElMessage.error(
      t('setup.invalidMerchantId')
    );
    return;
  }

  submitting.value = true;
  saveSetupInfo({
    agencyName: form.agencyName.trim(),
    phone: form.phone.trim(),
    licenseId: form.licenseId.trim(),
    merchantId,
  });
  submitting.value = false;
  ElMessage.success(t('setup.saved'));
  router.replace('/login');
};
</script>

<template>
  <div class="setup-page">
    <el-card class="setup-card" shadow="hover" v-loading="loading">
      <div class="setup-header">
        <h1 class="setup-title">{{ t('setup.title') }}</h1>
        <p class="setup-subtitle">{{ t('setup.subtitle') }}</p>
      </div>

      <el-form label-position="top">
        <el-form-item :label="t('setup.agencyName')" required>
          <el-input v-model="form.agencyName" :placeholder="t('setup.agencyNamePlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('setup.phone')" required>
          <el-input v-model="form.phone" :placeholder="t('setup.phonePlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('setup.licenseId')" required>
          <el-input v-model="form.licenseId" :placeholder="t('setup.licenseIdPlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('setup.merchantId')" required>
          <el-input v-model="form.merchantId" :placeholder="t('setup.merchantIdPlaceholder')" />
        </el-form-item>
      </el-form>

      <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="submitSetup">
        {{ t('setup.continue') }}
      </el-button>
    </el-card>
  </div>
</template>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-bg-color-page);
  padding: 20px;
}

.setup-card {
  width: 100%;
  max-width: 560px;
}

.setup-header {
  margin-bottom: 20px;
}

.setup-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.setup-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.submit-btn {
  width: 100%;
}

.merchant-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
