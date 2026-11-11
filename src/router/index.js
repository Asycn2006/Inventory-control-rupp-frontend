import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { settingsRoutes } from './routes/settings'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      redirect: (to) => {
        const authStore = useAuthStore()
        return authStore.isAdmin ? '/users' : '/dashboard'
      },
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { roles: ['super_admin', 'owner', 'staff', 'supplier'] }
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('../views/ProductsView.vue'),
          meta: { roles: ['super_admin', 'owner', 'staff', 'supplier'] }
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/OrdersView.vue'),
          meta: { roles: ['super_admin', 'owner', 'staff', 'supplier'] }
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UsersView.vue'),
          meta: { roles: ['super_admin', 'admin', 'owner', 'staff'] }
        },
        ...settingsRoutes
      ]
    }
  ]
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return authStore.isAdmin ? '/users' : '/dashboard'
  }

  // Admin only manages Suppliers and Staff
  if (authStore.isAdmin && (to.path === '/dashboard' || to.path === '/products' || to.path === '/orders')) {
    return '/users'
  }

  // Check roles based on userRole
  const currentRole = authStore.userRole
  if (to.meta.roles && !to.meta.roles.includes(currentRole) && !to.meta.roles.includes(authStore.user?.role)) {
    return authStore.isAdmin ? '/users' : '/dashboard'
  }
})

export default router
