import {createRouter, createWebHistory} from 'vue-router';
import type {RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized} from 'vue-router';
import AdminLayout from '@/shared/components/layouts/AdminLayout.vue';
import {useAuthStore} from '@/features/auth/store/auth.store';
import {hasSetupInfo} from '@/shared/config/runtimeConfig';

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
        path: '/local/setup',
        name: 'LocalSetup',
        component: () => import('@/features/setup/pages/LocalSetupPage.vue'),
        meta: {
            public: true,
            title: 'Setup',
        },
    },
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('@/shared/pages/ForbiddenPage.vue'),
        meta: {public: true, title: '403 Forbidden'},
    },
    {
        path: '/',
        component: AdminLayout,
        meta: {
            requiresAuth: true,
        },
        children: [
            {
                path: '',
                name: 'Welcome',
                component: () => import('@/features/welcome/pages/WelcomePage.vue'),
                meta: {
                    title: 'Home',
                    keepAlive: false,
                    componentName: 'WelcomePage',
                },
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/features/dashboard/pages/DashboardPage.vue'),
                meta: {
                    title: 'Dashboard',
                    icon: 'HomeFilled',
                    keepAlive: true,
                    componentName: 'Dashboard',
                },
            },
            {
                path: 'order-workspace',
                name: 'OrderWorkspace',
                component: () => import('@/features/order/pages/OrderWorkspacePage.vue'),
                meta: {
                    title: 'Order Workspace',
                    icon: 'Tickets',
                    keepAlive: true,
                    componentName: 'OrderWorkspacePage',
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
                    componentName: 'ProductListPage',
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
                    componentName: 'ProductDetail',
                },
            },
            {
                path: 'customers',
                name: 'Customers',
                component: () => import('@/features/customer/pages/CustomerListPage.vue'),
                meta: {
                    title: 'Customers',
                    icon: 'UserFilled',
                    keepAlive: true,
                    componentName: 'CustomerListPage',
                },
            },
            {
                path: 'customers/:id',
                name: 'CustomerDetail',
                component: () => import('@/features/customer/pages/CustomerDetailPage.vue'),
                meta: {
                    title: 'Customer Detail',
                    icon: 'UserFilled',
                    keepAlive: true,
                    componentName: 'CustomerDetailPage',
                },
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('@/features/order/pages/OrderListPage.vue'),
                meta: {
                    title: 'Orders',
                    icon: 'Tickets',
                    keepAlive: true,
                    componentName: 'OrderListPage',
                },
            },
            {
                path: 'orders/:id',
                name: 'OrderDetail',
                component: () => import('@/features/order/pages/OrderDetailPage.vue'),
                meta: {
                    title: 'Order Detail',
                    icon: 'Tickets',
                    keepAlive: true,
                    componentName: 'OrderDetailPage',
                },
            },
            {
                path: 'admin/users',
                name: 'AdminUsers',
                component: () => import('@/features/admin/pages/UserManagementPage.vue'),
                meta: {
                    title: 'Quản lý Users',
                    icon: 'Avatar',
                    keepAlive: true,
                    componentName: 'UserManagementPage',
                },
            },
            {
                path: 'admin/groups',
                name: 'AdminGroups',
                component: () => import('@/features/admin/pages/GroupManagementPage.vue'),
                meta: {
                    title: 'Quản lý Groups',
                    icon: 'Files',
                    keepAlive: true,
                    componentName: 'GroupManagementPage',
                },
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext
) => {
    const authStore = useAuthStore();
    const setupDone = hasSetupInfo();

    if (!setupDone && to.path !== '/local/setup') {
        next('/local/setup');
        return;
    }

    if (setupDone && to.path === '/local/setup') {
        next('/login');
        return;
    }

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

    if (isAuthenticated && to.path === '/login') {
        next('/');
        return;
    }

    // Check menu-based access control for authenticated protected routes
    if (isAuthenticated && requiresAuth) {
        const {useMenuStore} = await import('@/shared/store/menuStore');
        const menuStore = useMenuStore();

        // Always allow welcome page
        if (to.path === '/') {
            next();
            return;
        }

        // Ensure menus are loaded before checking permissions
        if (!menuStore.menusLoaded) {
            await menuStore.loadMenus(true); // load from API to get user's actual permissions
        }

        // After load: enforce permission
        // menuPaths can contain both static (/products) and template paths (/products/:id)
        // Match actual path against each menuPath template
        const isPathAllowed = (actualPath: string, allowedPaths: string[]): boolean => {
            return allowedPaths.some((menuPath) => {
                if (!menuPath.includes(':')) {
                    return menuPath === actualPath;
                }
                // Convert template like /products/:id to regex
                const pattern = menuPath.replace(/:[^/]+/g, '[^/]+');
                return new RegExp(`^${pattern}$`).test(actualPath);
            });
        };
        if (!isPathAllowed(to.path, menuStore.menuPaths)) {
            const { ElMessageBox } = await import('element-plus');

            try {
                await ElMessageBox.confirm(
                    'Bạn không có quyền truy cập trang này. Vui lòng liên hệ admin để xin quyền.',
                    'Không có quyền truy cập',
                    {
                        confirmButtonText: 'Đã hiểu',
                        cancelButtonText: 'Về trang chính',
                        type: 'warning',
                        showClose: false,
                        distinguishCancelAndClose: true,
                    },
                );

                // Đã hiểu -> ở lại trang cũ
                next(false);
            } catch (action) {
                if (action === 'cancel') {
                    // Về trang chính
                    next('/');
                } else {
                    next(false);
                }
            }

            return;
        }
    }

    next();
});

export default router;
