import { permissionNames } from 'components/constants.js'

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
        meta: {
          requiresPermission: permissionNames.viewClient,
        },
      },
      {
        path: 'clients/add',
        component: () => import('pages/client/AddClientPage.vue'),
        meta: {
          requiresPermission: permissionNames.addClient,
        },
      },
      {
        path: 'clients/:id',
        name: 'ClientOverview',
        component: () => import('pages/client/ClientOverviewPage.vue'),
        meta: {
          requiresPermission: permissionNames.viewClient,
        },
      },
      {
        path: 'clients/:id/edit',
        name: 'EditClient',
        component: () => import('pages/client/EditClientPage.vue'),
        meta: {
          requiresAnyPermission: [
            permissionNames.viewClient,
            permissionNames.editBasicInfoClient,
          ],
        },
      },
      {
        path: 'administration/users',
        name: 'AdminUsersList',
        component: () => import('pages/admin/UserList.vue'),
        meta: {
          requiresPermission: permissionNames.viewTenantsUser,
        },
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
