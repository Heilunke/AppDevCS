import { createRouter, createWebHashHistory } from '@ionic/vue-router'
import { currentUser } from '../services/auth'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import TabsPage from '../views/TabsPage.vue'

const routes = [
  { path: '/', redirect: '/tabs/home' },
  { path: '/login', component: LoginPage, meta: { guest: true } },
  { path: '/register', component: RegisterPage, meta: { guest: true } },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/home' },
      { path: 'home', component: () => import('../views/HomePage.vue') },
      { path: 'expenses', component: () => import('../views/ExpensesPage.vue') },
      { path: 'reports', component: () => import('../views/ReportsPage.vue') },
      { path: 'settings', component: () => import('../views/SettingsPage.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Logged-out users can only see Login / Register
router.beforeEach((to) => {
  const loggedIn = !!currentUser.value
  if (to.matched.some((r) => r.meta.requiresAuth) && !loggedIn) return '/login'
  if (to.meta.guest && loggedIn) return '/tabs/home'
})

export default router
