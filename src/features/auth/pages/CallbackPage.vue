<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Loading } from '@element-plus/icons-vue';
import SDK from 'casdoor-js-sdk';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { User } from '@/features/auth/types/auth.types';
import { getStoredSetupInfo, loadRuntimeConfig, resolveCasdoorConfig } from '@/shared/config/runtimeConfig';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

const parseUserFromToken = (token: string): User => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as Record<string, string>;
    return {
      id: payload.sub || payload.id || payload.name || '',
      name: payload.name || payload.preferred_username || '',
      displayName: payload.displayName || payload.name || '',
      email: payload.email || '',
      avatar: payload.avatar || '',
    };
  } catch {
      return {
        id: 'unknown',
        name: t('callback.unknownUser'),
      };
  }
};

onMounted(async () => {
  try {
    authStore.setLoading(true);
    const code = route.query.code as string;

      if (!code) {
        authStore.setError(t('callback.noAuthCode'));
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

    const runtimeConfig = await loadRuntimeConfig();
    const setupInfo = getStoredSetupInfo();
    const casdoorConfig = resolveCasdoorConfig(runtimeConfig, setupInfo);
    const sdk = new SDK({
      serverUrl: casdoorConfig.serverUrl,
      clientId: casdoorConfig.clientId,
      appName: casdoorConfig.appName,
      organizationName: casdoorConfig.organizationName,
      redirectPath: casdoorConfig.redirectPath,
      storage: localStorage,
    });

    const response = await sdk.exchangeForAccessToken();
    const accessToken = response.access_token;

      if (!accessToken) {
        authStore.setError(t('callback.noAccessToken'));
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

    localStorage.setItem('casdoor_access_token', accessToken);

    const userInfo = parseUserFromToken(accessToken);

    authStore.setUser(userInfo);
    authStore.setLoading(false);

    const redirectPath = localStorage.getItem('auth_redirect') || '/dashboard';
    localStorage.removeItem('auth_redirect');
    router.push(redirectPath);
  } catch (err) {
    authStore.setLoading(false);
    authStore.setError(err instanceof Error ? err.message : t('callback.authFailed'));
    setTimeout(() => router.push('/login'), 2000);
  }
});
</script>

<template>
  <div class="callback-page">
    <div class="callback-content">
      <el-icon class="loading-icon" :size="48">
        <Loading />
      </el-icon>
      <h2 class="callback-title">{{ t('callback.processing') }}</h2>
      <p class="callback-text">{{ t('callback.verifyCredentials') }}</p>

      <el-alert
        v-if="authStore.error"
        :title="authStore.error"
        type="error"
        show-icon
        class="error-alert"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'CallbackPage',
};
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-bg-color-page);
}

.callback-content {
  text-align: center;
  padding: 40px;
}

.loading-icon {
  color: var(--el-color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.callback-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.callback-text {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.error-alert {
  margin-top: 24px;
  max-width: 400px;
}
</style>
