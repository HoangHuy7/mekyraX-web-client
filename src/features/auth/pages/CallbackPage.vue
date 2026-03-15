<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';
import SDK from 'casdoor-js-sdk';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { User } from '@/features/auth/types/auth.types';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sdk = new SDK({
  serverUrl: import.meta.env.VITE_CASDOOR_SERVER_URL,
  clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID,
  appName: import.meta.env.VITE_CASDOOR_APP_NAME,
  organizationName: import.meta.env.VITE_CASDOOR_ORG_NAME,
  redirectPath: import.meta.env.VITE_CASDOOR_REDIRECT_PATH,
  storage: localStorage,
});

const parseUserFromToken = (token: string): User => {
  try {
    const result = sdk.parseAccessToken(token);
    const payload = result.payload as unknown as Record<string, string>;
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
      name: 'Unknown User',
    };
  }
};

onMounted(async () => {
  try {
    authStore.setLoading(true);
    const code = route.query.code as string;

    if (!code) {
      authStore.setError('Authentication failed: No authorization code received');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    const response = await sdk.exchangeForAccessToken();
    const accessToken = response.access_token;

    if (!accessToken) {
      authStore.setError('Authentication failed: Unable to get access token');
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
    authStore.setError(err instanceof Error ? err.message : 'Authentication failed');
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
      <h2 class="callback-title">Processing Authentication</h2>
      <p class="callback-text">Please wait while we verify your credentials...</p>

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
