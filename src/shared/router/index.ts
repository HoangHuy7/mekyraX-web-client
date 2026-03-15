import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import AdminLayout from '@/shared/components/layouts/AdminLayout.vue';
import { useAuthStore } from '@/features/auth/store/auth.store';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/pages/LoginPage.vue'),
    meta: {
      public: true,
      title: 'Login',
    },
  },
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/features/auth/pages/CallbackPage.vue'),
    meta: {
      public: true,
      title: 'Callback',
    },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/features/dashboard/pages/DashboardPage.vue'),
        meta: {
          title: 'Dashboard',
          icon: 'HomeFilled',
          keepAlive: true,
        },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/features/product/pages/ProductListPage.vue'),
        meta: {
          title: 'Products',
          icon: 'GoodsFilled',
          keepAlive: true,
        },
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('@/features/product/pages/ProductDetailPage.vue'),
        meta: {
          title: 'Product Detail',
          icon: 'GoodsFilled',
          keepAlive: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    authStore.restoreSession();
  }

  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth === true;

  if (requiresAuth && !isAuthenticated) {
    localStorage.setItem('auth_redirect', to.fullPath);
    next('/login');
    return;
  }

  if (isAuthenticated && (to.path === '/login')) {
    next('/dashboard');
    return;
  }

  next();
});

export default router;
