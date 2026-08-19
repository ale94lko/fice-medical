import { permissionNames, clientPermissionNames } from 'components/constants.js'

const clinicMessagesPage = () => import(
  'pages/messages/MessagesInboxPage.vue'
)

const clinicMessagesAccess = {
  requiresAnyPermission: [
    permissionNames.viewPortalMessages,
    permissionNames.sendPortalMessages,
  ],
}

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        component: () => import('pages/dashboard/DashboardPage.vue'),
      },
      {
        path: 'account/profile',
        name: 'MyProfile',
        component: () => import('pages/account/MyProfilePage.vue'),
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
        path: 'appointment-requests',
        name: 'AppointmentRequests',
        component: () => import(
          'pages/appointments/AppointmentRequestListPage.vue'
        ),
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
        path: 'messages',
        name: 'ClinicMessages',
        component: clinicMessagesPage,
        meta: clinicMessagesAccess,
      },
      {
        path: 'messages/:conversationId',
        name: 'ClinicMessagesThread',
        component: clinicMessagesPage,
        meta: clinicMessagesAccess,
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
        path: 'clients/portal-registrations',
        name: 'PortalRegistrations',
        component: () => import(
          'pages/client/PortalRegistrationListPage.vue'
        ),
        meta: {
          requiresAnyPermission: [
            permissionNames.viewClient,
            permissionNames.addClient,
          ],
        },
      },
      {
        path: 'clients/:id',
        name: 'ClientOverview',
        component: () => import(
          'pages/client/ClientOverviewAltPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.viewClient,
        },
      },
      {
        path: 'clients/:id/overview-classic',
        name: 'ClientOverviewClassic',
        component: () => import('pages/client/ClientOverviewPage.vue'),
        meta: {
          requiresPermission: permissionNames.viewClient,
        },
      },
      {
        path: 'clients/:id/overview-alt',
        name: 'ClientOverviewAlt',
        redirect: to => ({
          name: 'ClientOverview',
          params: { id: to.params.id },
        }),
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
        path: 'encounters/:id/workspace',
        name: 'EncounterWorkspace',
        component: () => import(
          'pages/encounter/EncounterWorkspacePage.vue'
        ),
        meta: {
          requiresAnyPermission: [
            permissionNames.viewEncounter,
            permissionNames.manageEncounter,
          ],
        },
      },
      {
        path: 'billing/superbills',
        name: 'SuperbillList',
        component: () => import(
          'pages/billing/SuperbillListPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.superbillView,
        },
      },
      {
        path: 'billing/superbills/:id',
        name: 'SuperbillDetail',
        component: () => import(
          'pages/billing/SuperbillDetailPage.vue'
        ),
        meta: {
          requiresAnyPermission: [
            permissionNames.superbillView,
            permissionNames.viewEncounter,
          ],
        },
      },
      {
        path: 'claims',
        name: 'ClaimList',
        component: () => import(
          'pages/claims/ClaimListPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.claimView,
        },
      },
      {
        path: 'claims/:id',
        name: 'ClaimDetail',
        component: () => import(
          'pages/claims/ClaimDetailPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.claimView,
        },
      },
      {
        path: 'remittances',
        name: 'RemittanceList',
        component: () => import(
          'pages/remittances/RemittanceListPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.remittanceView,
        },
      },
      {
        path: 'remittances/:id',
        name: 'RemittanceDetail',
        component: () => import(
          'pages/remittances/RemittanceDetailPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.remittanceView,
        },
      },
      {
        path: 'payments',
        name: 'PaymentList',
        component: () => import(
          'pages/payments/PaymentListPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.paymentView,
        },
      },
      {
        path: 'denials',
        name: 'DenialList',
        component: () => import(
          'pages/denials/DenialListPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.denialView,
        },
      },
      {
        path: 'denials/:id',
        name: 'DenialDetail',
        component: () => import(
          'pages/denials/DenialDetailPage.vue'
        ),
        meta: {
          requiresPermission: permissionNames.denialView,
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
        path: 'administration/screening-templates/add',
        name: 'AdminScreeningTemplatesAdd',
        component: () => import('pages/admin/ScreeningTemplateList.vue'),
        meta: {
          requiresPermission: permissionNames.manageScreeningTemplates,
          screeningTemplateListAutoOpen: 'add',
        },
      },
      {
        path: 'administration/screening-templates',
        name: 'AdminScreeningTemplatesList',
        component: () => import('pages/admin/ScreeningTemplateList.vue'),
        meta: {
          requiresPermission: permissionNames.manageScreeningTemplates,
        },
      },
      {
        path: 'administration/clinical-note-templates/add',
        name: 'AdminClinicalNoteTemplatesAdd',
        component: () => import(
          'pages/admin/ClinicalNoteTemplateList.vue'
        ),
        meta: {
          requiresPermission:
            permissionNames.clinicalNoteTemplateCreate,
          clinicalNoteTemplateListAutoOpen: 'add',
        },
      },
      {
        path: 'administration/clinical-note-templates',
        name: 'AdminClinicalNoteTemplatesList',
        component: () => import(
          'pages/admin/ClinicalNoteTemplateList.vue'
        ),
        meta: {
          requiresPermission:
            permissionNames.clinicalNoteTemplateView,
        },
      },
      {
        path: 'administration/consent-templates',
        name: 'AdminConsentTemplatesList',
        component: () => import('pages/admin/ConsentTemplateListPage.vue'),
        meta: {
          requiresPermission: permissionNames.consentView,
        },
      },
      {
        path: 'administration/clinical-audit',
        name: 'AdminClinicalAuditList',
        component: () => import('pages/admin/ClinicalAuditListPage.vue'),
        meta: {
          requiresPermission: permissionNames.viewClinicalAudit,
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
        path: 'resources',
        name: 'ClinicalResourcesList',
        component: () => import('pages/clinical/ClinicalResourceListPage.vue'),
        meta: {
          requiresPermission: permissionNames.viewClinicalResources,
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
    path: '/telehealth/sessions/:sessionId',
    name: 'TelehealthSession',
    component: () => import('pages/telehealth/TelehealthSessionPage.vue'),
    meta: {
      requiresAuth: true,
      requiresAnyPermission: [
        clientPermissionNames.viewTelehealth,
        clientPermissionNames.joinTelehealth,
        clientPermissionNames.createTelehealth,
        clientPermissionNames.manageTelehealth,
      ],
    },
  },
  {
    path: '/meet',
    name: 'TelehealthMeet',
    component: () => import('pages/telehealth/TelehealthMeetPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/consent-sign',
    name: 'ConsentSign',
    component: () => import('pages/consent/ConsentSignPage.vue'),
    meta: { requiresAuth: false },
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
