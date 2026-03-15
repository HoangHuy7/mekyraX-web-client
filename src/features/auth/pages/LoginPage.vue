<script setup lang="ts">
import { User, Plus } from '@element-plus/icons-vue';
import SDK from 'casdoor-js-sdk';
import { useAuthStore } from '@/features/auth/store/auth.store';

const authStore = useAuthStore();

const sdk = new SDK({
  serverUrl: import.meta.env.VITE_CASDOOR_SERVER_URL,
  clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID,
  appName: import.meta.env.VITE_CASDOOR_APP_NAME,
  organizationName: import.meta.env.VITE_CASDOOR_ORG_NAME,
  redirectPath: import.meta.env.VITE_CASDOOR_REDIRECT_PATH,
  storage: localStorage,
});

const handleLogin = (): void => {
  authStore.login();
//   window.location.href = sdk.getSigninUrl();
  sdk.signin_redirect()
};

const handleSignup = (): void => {
  sdk.signin_redirect();
};


</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <div class="login-header">
        <h1 class="login-title">Welcome Back</h1>
        <p class="login-subtitle">Sign in to your account to continue</p>
      </div>

      <div class="login-actions">
        <el-button
          type="primary"
          size="large"
          :icon="User"
          class="login-btn"
          @click="handleLogin"
        >
          Sign In with Casdoor
        </el-button>

        <el-divider>
          <span class="divider-text">or</span>
        </el-divider>

        <el-button
          size="large"
          :icon="Plus"
          class="signup-btn"
          @click="handleSignup"
        >
          Create Account
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
