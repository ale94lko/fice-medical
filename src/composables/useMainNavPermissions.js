import { computed } from 'vue'
import { permissionNames, clientPermissionNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  hasAnyPermission,
  hasAssignedPermissions,
  hasPermission,
} from 'src/utils/auth-permissions.js'

const administrationPermissions = [
  permissionNames.viewCatalog,
  permissionNames.viewClinicalAudit,
  permissionNames.viewSubtenants,
  permissionNames.manageScreeningTemplates,
  permissionNames.clinicalNoteTemplateView,
  permissionNames.clinicalNoteTemplateCreate,
  permissionNames.clinicalNoteTemplateEdit,
  permissionNames.consentView,
  permissionNames.consentCreate,
  permissionNames.consentEdit,
]

const calendarPermissions = [
  clientPermissionNames.viewAppointmentSlot,
  clientPermissionNames.bookAppointment,
  clientPermissionNames.cancelAppointment,
  clientPermissionNames.rescheduleAppointment,
  clientPermissionNames.manageAppointmentSlots,
]

export function useMainNavPermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.permissions)

  const showDashboard = computed(() =>
    hasAssignedPermissions(permissions.value),
  )

  const showCalendarMenu = computed(() =>
    hasAnyPermission(permissions.value, calendarPermissions),
  )

  const showPortalMessages = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewPortalMessages,
      permissionNames.sendPortalMessages,
    ]),
  )

  const showClientMenu = computed(() =>
    hasAnyPermission(
      permissions.value,
      [permissionNames.viewClient, permissionNames.addClient],
    ),
  )

  const showClientList = computed(() =>
    hasPermission(permissions.value, permissionNames.viewClient),
  )

  const showClientAdd = computed(() =>
    hasPermission(permissions.value, permissionNames.addClient),
  )

  const showPortalRegistrationsNav = computed(
    () => showClientList.value || showClientAdd.value,
  )

  const showPortalMenu = computed(
    () => showPortalMessages.value
      || showPortalRegistrationsNav.value
      || showCalendarMenu.value,
  )

  const showStaffMenu = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewStaffMembers,
      permissionNames.editStaffMembers,
    ]),
  )

  const showStaffAddClinician = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.editStaffMembers,
      permissionNames.addTenantsUser,
    ]),
  )

  const showStaffAddStaff = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.editStaffMembers,
      permissionNames.addTenantsUser,
    ]),
  )

  const showUsersMenu = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.viewTenantsUser,
      permissionNames.addTenantsUser,
    ]),
  )

  const showUsersAdd = computed(() =>
    hasPermission(permissions.value, permissionNames.addTenantsUser),
  )

  const showAdminStaffList = computed(() =>
    hasPermission(permissions.value, permissionNames.viewStaffMembers),
  )

  const showBilling = computed(() =>
    hasPermission(permissions.value, permissionNames.superbillView),
  )

  const showClaims = computed(() =>
    hasPermission(permissions.value, permissionNames.claimView),
  )

  const showRemittances = computed(() =>
    hasPermission(permissions.value, permissionNames.remittanceView),
  )

  const showPayments = computed(() =>
    hasAnyPermission(permissions.value, [
      permissionNames.paymentView,
      permissionNames.clientPaymentView,
    ]),
  )

  const showDenials = computed(() =>
    hasPermission(permissions.value, permissionNames.denialView),
  )

  const showBillingMenu = computed(() =>
    showBilling.value
      || showClaims.value
      || showRemittances.value
      || showPayments.value
      || showDenials.value,
  )

  const showAdministrationMenu = computed(() =>
    hasAnyPermission(permissions.value, administrationPermissions),
  )

  const showAdminUsers = computed(() =>
    hasPermission(permissions.value, permissionNames.viewTenantsUser),
  )

  const showAdminSubtenants = computed(() =>
    hasPermission(permissions.value, permissionNames.viewSubtenants),
  )

  const showServicesProcedures = computed(() =>
    hasPermission(permissions.value, permissionNames.viewCatalog),
  )

  const showScreeningTemplates = computed(() =>
    hasPermission(permissions.value, permissionNames.manageScreeningTemplates),
  )

  const showClinicalNoteTemplates = computed(() =>
    hasPermission(
      permissions.value,
      permissionNames.clinicalNoteTemplateView,
    ),
  )

  const showConsentTemplates = computed(() =>
    hasPermission(permissions.value, permissionNames.consentView)
    || hasPermission(permissions.value, permissionNames.consentCreate)
    || hasPermission(permissions.value, permissionNames.consentEdit),
  )

  const showClinicalAudit = computed(() =>
    hasPermission(permissions.value, permissionNames.viewClinicalAudit),
  )

  const showClinicalResourcesMenu = computed(() =>
    hasPermission(permissions.value, permissionNames.viewClinicalResources),
  )

  return {
    showDashboard,
    showCalendarMenu,
    showPortalMenu,
    showPortalMessages,
    showPortalRegistrationsNav,
    showClientMenu,
    showClientList,
    showClientAdd,
    showStaffMenu,
    showStaffAddClinician,
    showStaffAddStaff,
    showUsersMenu,
    showUsersAdd,
    showAdminStaffList,
    showBillingMenu,
    showBilling,
    showClaims,
    showRemittances,
    showPayments,
    showDenials,
    showAdministrationMenu,
    showAdminSubtenants,
    showAdminUsers,
    showServicesProcedures,
    showScreeningTemplates,
    showClinicalNoteTemplates,
    showConsentTemplates,
    showClinicalAudit,
    showClinicalResourcesMenu,
  }
}

export function canAccessRoute(permissions, meta = {}) {
  if (meta.requiresPermission) {
    return hasPermission(permissions, meta.requiresPermission)
  }
  if (Array.isArray(meta.requiresAnyPermission)
    && meta.requiresAnyPermission.length) {
    return hasAnyPermission(permissions, meta.requiresAnyPermission)
  }

  return true
}
