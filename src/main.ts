import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import Casdoor from 'casdoor-vue-sdk';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';

import App from './App.vue';
import router from './shared/router';
import type { CasdoorConfig } from './features/auth/types/auth.types';
import { apolloClient } from './shared/graphql/client';
import { i18n } from './shared/i18n';
import {
  getStoredSetupInfo,
  loadRuntimeConfig,
  resolveCasdoorConfig,
} from './shared/config/runtimeConfig';

const fallbackCasdoorConfig: CasdoorConfig = {
  serverUrl: 'http://localhost:8000',
  clientId: '',
  organizationName: '',
  appName: '',
  redirectPath: '/callback',
};

const bootstrap = async (): Promise<void> => {
  let casdoorConfig: CasdoorConfig = fallbackCasdoorConfig;
  try {
    const runtimeConfig = await loadRuntimeConfig();
    const setupInfo = getStoredSetupInfo();
    casdoorConfig = resolveCasdoorConfig(runtimeConfig, setupInfo);
    localStorage.setItem('app_graphql_endpoint', runtimeConfig.graphqlEndpoint);
  } catch {
    // keep fallback config and default graphql endpoint
  }

  const app = createApp(App);

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);

  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);
  app.use(i18n);
  app.use(Casdoor, casdoorConfig);
  app.provide('apolloClient', apolloClient);

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  app.mount('#app');
};

bootstrap();
