import { permissionNames, clientPermissionNames } from 'components/constants.js'

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
        path: 'calendar',
        name: 'Calendar',
        component: () => import('pages/calendar/CalendarPage.vue'),
        meta: {
          requiresAnyPermission: [
            clientPermissionNames.viewAppointmentSlot,
            clientPermissionNames.bookAppointment,
            clientPermissionNames.cancelAppointment,
            clientPermissionNames.rescheduleAppointment,
            clientPermissionNames.manageAppointmentSlots,
          ],
        },
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
        path: 'administration/subtenants/add',
        name: 'AdminSubtenantsAdd',
        component: () => import('pages/admin/SubtenantList.vue'),
        meta: {
          requiresPermission: permissionNames.editSubtenants,
          subtenantListAutoOpen: 'add',
        },
      },
      {
        path: 'administration/subtenants',
        name: 'AdminSubtenantsList',
        component: () => import('pages/admin/SubtenantList.vue'),
        meta: {
          requiresPermission: permissionNames.viewSubtenants,
        },
      },
      {
        path: 'administration/services/add',
        name: 'AdminServiceProceduresAdd',
        component: () => import('pages/admin/ServiceProcedureList.vue'),
        meta: {
          requiresPermission: permissionNames.editCatalog,
          serviceProcedureListAutoOpen: 'add',
        },
      },
      {
        path: 'administration/services',
        name: 'AdminServiceProceduresList',
        component: () => import('pages/admin/ServiceProcedureList.vue'),
        meta: {
          requiresPermission: permissionNames.viewCatalog,
        },
      },
      {
        path: 'administration/users/add',
        name: 'AdminUsersAdd',
        component: () => import('pages/admin/UserList.vue'),
        meta: {
          requiresPermission: permissionNames.addTenantsUser,
          userListAutoOpen: 'add',
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
      {
        path: 'staff',
        component: () => import('pages/staff/StaffList.vue'),
        meta: {
          requiresPermission: permissionNames.viewStaffMembers,
        },
      },
      {
        path: 'staff/add',
        name: 'AddStaff',
        component: () => import('pages/staff/StaffFormPage.vue'),
        meta: {
          requiresPermission: permissionNames.editStaffMembers,
          staffEntryPoint: 'ADD_STAFF',
        },
      },
      {
        path: 'staff/add-clinician',
        name: 'AddClinician',
        component: () => import('pages/staff/StaffFormPage.vue'),
        meta: {
          requiresPermission: permissionNames.editStaffMembers,
          staffEntryPoint: 'ADD_CLINICIAN',
        },
      },
      {
        path: 'staff/:id',
        name: 'StaffProfile',
        component: () => import('pages/staff/StaffProfilePage.vue'),
        meta: {
          requiresPermission: permissionNames.viewStaffMembers,
        },
      },
      {
        path: 'staff/:id/edit',
        name: 'EditStaff',
        component: () => import('pages/staff/StaffFormPage.vue'),
        meta: {
          requiresAnyPermission: [
            permissionNames.viewStaffMembers,
            permissionNames.editStaffMembers,
          ],
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
