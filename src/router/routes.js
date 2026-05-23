import { appModuleNames } from 'components/constants.js'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('pages/dashboard/DashboardPage.vue'),
      },
      {
        path: 'clients',
        component: () => import('pages/client/ClientList.vue'),
        meta: { requiresModule: appModuleNames.client },
      },
    ],
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'LoginPage',
        component: () => import('pages/account/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/reset-password',
    component: () => import('layouts/LoginLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'ResetPasswordPage',
        component: () => import('pages/account/ResetPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  }
]

export default routes
