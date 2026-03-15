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

const casdoorConfig: CasdoorConfig = {
  serverUrl: import.meta.env.VITE_CASDOOR_SERVER_URL,
  clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID,
  organizationName: import.meta.env.VITE_CASDOOR_ORG_NAME,
  appName: import.meta.env.VITE_CASDOOR_APP_NAME,
  redirectPath: import.meta.env.VITE_CASDOOR_REDIRECT_PATH,
};

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.use(Casdoor, casdoorConfig);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
