<script setup lang="ts">
import { User, Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import SDK from 'casdoor-js-sdk';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getStoredSetupInfo, loadRuntimeConfig, resolveCasdoorConfig } from '@/shared/config/runtimeConfig';

const authStore = useAuthStore();
const { t } = useI18n();

const createSdk = async (): Promise<SDK> => {
  const runtimeConfig = await loadRuntimeConfig();
  const setupInfo = getStoredSetupInfo();
  const casdoorConfig = resolveCasdoorConfig(runtimeConfig, setupInfo);
  return new SDK({
    serverUrl: casdoorConfig.serverUrl,
    clientId: casdoorConfig.clientId,
    appName: casdoorConfig.appName,
    organizationName: casdoorConfig.organizationName,
    redirectPath: casdoorConfig.redirectPath,
    storage: localStorage,
  });
};

const handleLogin = async (): Promise<void> => {
  authStore.login();
  try {
    const sdk = await createSdk();
    sdk.signin_redirect();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('callback.authFailed'));
  }
};

const handleSignup = async (): Promise<void> => {
  try {
    const sdk = await createSdk();
    sdk.signin_redirect();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('callback.authFailed'));
  }
};


</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <div class="login-header">
        <h1 class="login-title">{{ t('login.welcomeBack') }}</h1>
        <p class="login-subtitle">{{ t('login.subtitle') }}</p>
      </div>

      <div class="login-actions">
        <el-button
          type="primary"
          size="large"
          :icon="User"
          class="login-btn"
          @click="handleLogin"
        >
          {{ t('login.signInWithCasdoor') }}
        </el-button>

        <el-divider>
          <span class="divider-text">{{ t('login.or') }}</span>
        </el-divider>

        <el-button
          size="large"
          :icon="Plus"
          class="signup-btn"
          @click="handleSignup"
        >
          {{ t('login.createAccount') }}
        </el-button>
      </div>

      <el-alert
        v-if="authStore.error"
        :title="authStore.error"
        type="error"
        show-icon
        closable
        class="error-alert"
        @close="authStore.setError(null)"
      />
    </el-card>
  </div>
</template>

<script lang="ts">
export default {
  name: 'LoginPage',
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color-page) 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.login-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.signup-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.divider-text {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.error-alert {
  margin-top: 20px;
}
</style>
