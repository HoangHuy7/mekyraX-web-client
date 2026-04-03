<script setup lang="ts">
import { User, Plus, Lock, ArrowRight } from '@element-plus/icons-vue';
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
  sdk.signin_redirect()
};

const handleSignup = (): void => {
  sdk.signin_redirect();
};


</script>

<template>
  <div class="login-page">
    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <div class="login-container">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-logo">
            <el-icon :size="48"><Lock /></el-icon>
          </div>
          <h1 class="brand-title">Mekyra UI</h1>
          <p class="brand-subtitle">Modern Admin Dashboard</p>
        </div>
        
        <div class="features-section">
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="feature-text">
              <h3>Secure Authentication</h3>
              <p>Powered by Casdoor SSO</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="feature-text">
              <h3>Fast & Responsive</h3>
              <p>Built with Vue 3 & Tauri</p>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <el-card class="login-card" shadow="never">
          <div class="login-header">
            <h2 class="login-title">Welcome Back</h2>
            <p class="login-subtitle">Sign in to access your dashboard</p>
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
              <el-icon class="btn-icon"><ArrowRight /></el-icon>
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
              Create New Account
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

          <div class="footer-note">
            <p>By continuing, you agree to our Terms of Service</p>
          </div>
        </el-card>
      </div>
    </div>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Background decoration */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -50px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1100px;
  width: 100%;
  position: relative;
  z-index: 1;
}

@media (max-width: 900px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
  
  .login-left {
    display: none;
  }
}

/* Left section */
.login-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  padding: 20px;
}

.brand-section {
  text-align: left;
}

.brand-logo {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -1px;
}

.brand-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s, background 0.3s;
}

.feature-item:hover {
  transform: translateX(8px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-text h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}

.feature-text p {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

/* Right section */
.login-right {
  display: flex;
  align-items: center;
}

.login-card {
  width: 100%;
  border-radius: 24px;
  border: none;
  background: white;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
}

.login-subtitle {
  margin: 0;
  font-size: 15px;
  color: #666;
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  transition: transform 0.2s;
}

.login-btn:hover .btn-icon {
  transform: translateX(4px);
}

.signup-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  color: #333;
  transition: all 0.2s;
}

.signup-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.divider-text {
  color: #999;
  font-size: 13px;
  font-weight: 500;
}

.error-alert {
  margin-top: 24px;
  border-radius: 12px;
}

.footer-note {
  margin-top: 32px;
  text-align: center;
}

.footer-note p {
  font-size: 13px;
  color: #999;
  margin: 0;
}
</style>
