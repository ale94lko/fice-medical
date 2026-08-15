import { toTestId, withTestIdPrefix } from 'src/utils/base.js'

export const appLoadingTestIds = {
  root: 'app-brand-loading',
  title: 'app-brand-loading-title',
  message: 'app-brand-loading-message',
}

export const authTestIds = {
  emailInput: 'auth-input-email',
  passwordInput: 'auth-input-password',
  signInButton: 'auth-btn-sign-in',
  forgotPasswordLink: 'auth-link-forgot-password',
}

export const layoutTestIds = {
  menuToggle: 'layout-btn-menu-toggle',
  headerOverflow: 'layout-btn-header-overflow',
  headerOverflowMenu: 'layout-header-overflow-menu',
  headerOverflowSubtenant: 'layout-header-overflow-subtenant',
  headerOverflowClinical: 'layout-header-overflow-clinical',
  headerOverflowNotifications:
    'layout-header-overflow-notifications',
  notifications: 'layout-btn-notifications',
  notificationsMenu: 'layout-notifications-menu',
  notificationsLoading: 'layout-notifications-loading',
  notificationsMarkAll: 'layout-notifications-mark-all',
  notificationItem: id => toTestId('layout-notification-item', id),
  notificationMarkRead: id => toTestId(
    'layout-notification-mark-read',
    id,
  ),
  notificationDelete: id => toTestId('layout-notification-delete', id),
  userMenu: 'layout-btn-user-menu',
  userMenuMyProfile: 'layout-menu-user-my-profile',
  userMenuSettings: 'layout-menu-user-settings',
  userMenuHelp: 'layout-menu-user-help',
  headerStaffProfile: 'layout-header-staff-profile',
  changePassword: 'layout-menu-change-password',
  signOut: 'layout-menu-sign-out',
  navDashboard: 'layout-nav-dashboard',
  navCalendar: 'layout-nav-calendar',
  navClientMenu: 'layout-nav-client-menu',
  navClientList: 'layout-nav-client-list',
  navClientAdd: 'layout-nav-client-add',
  navPriorAuth: 'layout-nav-prior-authorization',
  navClientAssignment: 'layout-nav-client-assignment',
  navStaffClinicianMenu: 'layout-nav-staff-clinician-menu',
  navStaffList: 'layout-nav-staff-list',
  navStaffAddClinician: 'layout-nav-staff-add-clinician',
  navStaffAddStaff: 'layout-nav-staff-add-staff',
  navUsersMenu: 'layout-nav-users-menu',
  navUsersList: 'layout-nav-users-list',
  navUsersAdd: 'layout-nav-users-add',
  navAdminUsers: 'layout-nav-admin-users',
  navAdminSubtenants: 'layout-nav-admin-subtenants',
  navAdminServices: 'layout-nav-admin-services',
  navAdminScreeningTemplates: 'layout-nav-admin-screening-templates',
  navAdminClinicalNoteTemplates:
    'layout-nav-admin-clinical-note-templates',
  navAdminConsentTemplates: 'layout-nav-admin-consent-templates',
  navAdminClinicalAudit: 'layout-nav-admin-clinical-audit',
  navClinicalResources: 'layout-nav-clinical-resources',
  navBilling: 'layout-nav-billing',
}

export const superbillListTestIds = {
  page: 'superbill-list-page',
  search: 'superbill-list-search',
  statusFilter: 'superbill-list-status-filter',
  queueTab: name => toTestId('billing-queue-tab', name),
  dosFilter: 'billing-queue-dos-filter',
  providerFilter: 'billing-queue-provider-filter',
  payerFilter: 'billing-queue-payer-filter',
  locationFilter: 'billing-queue-location-filter',
  serviceFilter: 'billing-queue-service-filter',
  sortFilter: 'billing-queue-sort-filter',
  includeVoided: 'billing-queue-include-voided',
  issueBadge: id => toTestId('billing-queue-issues', id),
  rowView: id => toTestId('superbill-list-row-view', id),
}

export const superbillDetailTestIds = {
  page: 'superbill-detail-page',
  print: 'superbill-detail-print',
  actions: 'superbill-detail-actions',
  markReviewed: 'superbill-detail-mark-reviewed',
  void: 'superbill-detail-void',
  reopen: 'superbill-detail-reopen',
  tab: name => toTestId('superbill-detail-tab', name),
  addNote: 'superbill-detail-add-note',
  viewEncounter: 'superbill-detail-view-encounter',
  viewClient: 'superbill-detail-view-client',
  viewNote: 'superbill-detail-view-note',
  requirementRow: (code, id) => toTestId(
    'superbill-req-row',
    code,
    id,
  ),
  requirementAction: (code, id) => toTestId(
    'superbill-req-action',
    code,
    id,
  ),
}

export const myProfileTestIds = {
  page: 'my-profile-page',
  summary: 'my-profile-summary',
  changePassword: 'my-profile-quick-change-password',
  tab: name => toTestId('my-profile-tab', name),
}

export const documentGenerationTestIds = {
  dialog: 'generate-document-dialog',
  format: 'generate-document-field-format',
  locale: 'generate-document-field-locale',
  submit: 'generate-document-btn-submit',
  generatedList: 'generated-documents-list',
  trigger: type => toTestId('generate-document-btn', type),
  menuItem: type => toTestId('generate-document-menu', type),
  download: id => toTestId('generated-document-btn-download', id),
}

export const sessionInactivityTestIds = {
  dialog: 'session-inactivity-dialog',
  countdown: 'session-inactivity-countdown',
  closeSection: 'session-inactivity-btn-close-section',
  keepOpen: 'session-inactivity-btn-keep-open',
}

export const forcedChangePasswordTestIds = {
  dialog: 'forced-change-password-dialog',
  currentPassword: 'forced-change-password-input-current',
  newPassword: 'forced-change-password-input-new',
  repeatPassword: 'forced-change-password-input-repeat',
  submit: 'forced-change-password-btn-submit',
}

export const changePasswordTestIds = {
  dialog: 'change-password-dialog',
  currentPassword: 'change-password-input-current',
  newPassword: 'change-password-input-new',
  repeatPassword: 'change-password-input-repeat',
  submit: 'change-password-btn-submit',
}

export const adminTableTestIds = {
  columnSettings: 'admin-table-btn-column-settings',
  pageActionsMenu: 'admin-list-page-btn-actions-menu',
}

export const userListTestIds = {
  page: 'user-list-page',
  search: 'user-list-input-search',
  addUser: 'user-list-btn-add',
  filters: 'user-list-btn-filters',
  filtersDrawer: 'user-list-filters-drawer',
  filtersClear: 'user-list-filters-btn-clear',
  filtersApply: 'user-list-filters-btn-apply',
  rowView: id => toTestId('user-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('user-list-row', id, 'btn-edit'),
  rowPassword: id => toTestId('user-list-row', id, 'btn-password'),
  roleFilter: 'user-list-filter-role',
  statusFilter: 'user-list-filter-status',
  rowDelete: id => toTestId('user-list-row', id, 'btn-delete'),
}

export const userDialogTestIds = {
  field: name => toTestId('user-dialog-field', name),
  btn: name => toTestId('user-dialog-btn', name),
  photoMenu: 'user-dialog-photo-menu',
  photoTake: 'user-dialog-photo-take',
  photoUpload: 'user-dialog-photo-upload',
}

export const subtenantListTestIds = {
  page: 'subtenant-list-page',
  add: 'subtenant-list-btn-add',
  rowView: id => toTestId('subtenant-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('subtenant-list-row', id, 'btn-edit'),
  rowMore: id => toTestId('subtenant-list-row', id, 'btn-more'),
  rowDelete: id => toTestId('subtenant-list-row', id, 'btn-delete'),
}

export const subtenantDialogTestIds = {
  dialog: 'subtenant-dialog',
  field: name => toTestId('subtenant-dialog-field', name),
  btn: name => toTestId('subtenant-dialog-btn', name),
}

export const clinicalResourceTestIds = {
  listPage: 'clinical-resource-list-page',
  listSearch: 'clinical-resource-list-input-search',
  listCategoryFilter: 'clinical-resource-list-select-category',
  listTypeFilter: 'clinical-resource-list-select-type',
  listStatusFilter: 'clinical-resource-list-select-status',
  listAdd: 'clinical-resource-list-btn-add',
  tabAll: 'clinical-resource-list-tab-all',
  tabPinned: 'clinical-resource-list-tab-pinned',
  tabFavorites: 'clinical-resource-list-tab-favorites',
  rowOpen: id => toTestId('clinical-resource-list-row', id, 'btn-open'),
  rowView: id => toTestId('clinical-resource-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('clinical-resource-list-row', id, 'btn-edit'),
  rowActivate: id => toTestId(
    'clinical-resource-list-row',
    id,
    'btn-activate',
  ),
  rowDeactivate: id => toTestId(
    'clinical-resource-list-row',
    id,
    'btn-deactivate',
  ),
  rowArchive: id => toTestId('clinical-resource-list-row', id, 'btn-archive'),
  rowMore: id => toTestId('clinical-resource-list-row', id, 'btn-more'),
  rowFavorite: id => toTestId('clinical-resource-list-row', id, 'btn-favorite'),
  rowPin: id => toTestId('clinical-resource-list-row', id, 'btn-pin'),
  detailDialog: 'clinical-resource-detail-dialog',
  formField: name => toTestId('clinical-resource-form-field', name),
  breadcrumbResources: 'clinical-resource-breadcrumb-resources',
  quickPanelTrigger: 'clinical-resource-quick-panel-trigger',
  quickPanelMenu: 'clinical-resource-quick-panel-menu',
  quickPanelSearch: 'clinical-resource-quick-panel-input-search',
  quickPanelBrowseAll: 'clinical-resource-quick-panel-btn-browse-all',
  quickPanelItem: id => toTestId('clinical-resource-quick-panel-item', id),
}

export const clinicalResourceDialogTestIds = {
  dialog: 'clinical-resource-dialog',
  field: name => toTestId('clinical-resource-dialog-field', name),
  btn: name => toTestId('clinical-resource-dialog-btn', name),
}

export const serviceProcedureListTestIds = {
  page: 'service-procedure-list-page',
  search: 'service-procedure-list-input-search',
  categoryFilter: 'service-procedure-list-select-category',
  add: 'service-procedure-list-btn-add',
  rowView: id => toTestId('service-procedure-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('service-procedure-list-row', id, 'btn-edit'),
  rowMore: id => toTestId('service-procedure-list-row', id, 'btn-more'),
  rowToggle: id => toTestId('service-procedure-list-row', id, 'btn-toggle'),
}

export const serviceProcedureDialogTestIds = {
  dialog: 'service-procedure-dialog',
  field: name => toTestId('service-procedure-dialog-field', name),
  btn: name => toTestId('service-procedure-dialog-btn', name),
  requirementRowEdit: id => toTestId(
    'service-procedure-dialog-req',
    id,
    'btn-edit',
  ),
  requirementRowDelete: id => toTestId(
    'service-procedure-dialog-req',
    id,
    'btn-delete',
  ),
}

export const clinicalNoteTemplateListTestIds = {
  page: 'clinical-note-template-list-page',
  search: 'clinical-note-template-list-input-search',
  add: 'clinical-note-template-list-btn-add',
}

export const clinicalNoteTemplateDialogTestIds = {
  dialog: 'clinical-note-template-dialog',
  field: name => toTestId('clinical-note-template-dialog-field', name),
  addSection: 'clinical-note-template-dialog-btn-add-section',
  moveUp: index => toTestId(
    'clinical-note-template-dialog-section',
    index,
    'move-up',
  ),
  moveDown: index => toTestId(
    'clinical-note-template-dialog-section',
    index,
    'move-down',
  ),
  btn: name => toTestId('clinical-note-template-dialog-btn', name),
}

export const screeningTemplateListTestIds = {
  page: 'screening-template-list-page',
  search: 'screening-template-list-input-search',
  add: 'screening-template-list-btn-add',
  rowView: id => toTestId('screening-tpl-row', id, 'btn-view'),
  rowEdit: id => toTestId('screening-tpl-row', id, 'btn-edit'),
  rowMore: id => toTestId('screening-tpl-row', id, 'btn-more'),
  rowPreview: id => toTestId('screening-tpl-row', id, 'preview'),
  rowActivate: id => toTestId('screening-tpl-row', id, 'activate'),
  rowDeactivate: id => toTestId('screening-tpl-row', id, 'deactivate'),
  rowDelete: id => toTestId('screening-tpl-row', id, 'delete'),
}

export const screeningTemplateDialogTestIds = {
  dialog: 'screening-template-dialog',
  previewDialog: 'screening-template-preview-dialog',
  field: name => toTestId('screening-template-dialog-field', name),
  btn: name => toTestId('screening-template-dialog-btn', name),
  addSection: 'screening-template-dialog-btn-add-section',
  removeSection: index =>
    toTestId('screening-template-dialog-section', index, 'remove'),
  moveSectionUp: index =>
    toTestId('screening-template-dialog-section', index, 'move-up'),
  moveSectionDown: index =>
    toTestId('screening-template-dialog-section', index, 'move-down'),
  sectionField: (index, name) =>
    toTestId('screening-template-dialog-section', index, name),
  addQuestion: index =>
    toTestId('screening-template-dialog-section', index, 'add-question'),
  removeQuestion: (sIndex, qIndex) =>
    toTestId('screening-template-dialog-question', `${sIndex}-${qIndex}`,
      'remove'),
  moveQuestionUp: (sIndex, qIndex) =>
    toTestId('screening-template-dialog-question', `${sIndex}-${qIndex}`,
      'move-up'),
  moveQuestionDown: (sIndex, qIndex) =>
    toTestId('screening-template-dialog-question', `${sIndex}-${qIndex}`,
      'move-down'),
  copyConfirm: 'screening-template-copy-confirm',
  copyConfirmBtn: name =>
    toTestId('screening-template-copy-confirm-btn', name),
}

export const dashboardTestIds = {
  page: 'dashboard-page',
  noAccess: 'dashboard-no-access',
  empty: 'dashboard-empty',
  grid: 'dashboard-grid',
  refresh: 'dashboard-btn-refresh',
  customize: 'dashboard-btn-customize',
  customizeSave: 'dashboard-customize-btn-save',
  customizeCancel: 'dashboard-customize-btn-cancel',
  customizeToggle: id => toTestId('dashboard-customize-toggle', id),
  customizeSize: id => toTestId('dashboard-customize-size', id),
  cardDrag: id => toTestId('dashboard-card-drag', id),
  cardSize: id => toTestId('dashboard-card-size', id),
  cardVisible: id => toTestId('dashboard-card-visible', id),
  widget: id => toTestId('dashboard-widget', id),
}

export const clientListTestIds = {
  page: 'client-list-page',
  search: 'client-list-input-search',
  addClient: 'client-list-btn-add',
  assignClinicians: 'client-list-btn-assign-clinicians',
  changeStatus: 'client-list-btn-change-status',
  filters: 'client-list-btn-filters',
  columnSettings: 'client-list-btn-column-settings',
  summaryAll: 'client-list-summary-all',
  summaryUpcoming: 'client-list-summary-upcoming',
  summaryMissing: 'client-list-summary-missing',
  summaryBilling: 'client-list-summary-billing',
  summaryAuthorizations: 'client-list-summary-authorizations',
  rowView: id => toTestId('client-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('client-list-row', id, 'btn-edit'),
  rowAssign: id => toTestId('client-list-row', id, 'btn-assign'),
  rowStatus: id => toTestId('client-list-row', id, 'btn-status'),
  rowMore: id => toTestId('client-list-row', id, 'btn-more'),
  rowOverviewAlt: id => toTestId('client-list-row', id, 'btn-overview-alt'),
  rowOverviewClassic: id => toTestId(
    'client-list-row',
    id,
    'btn-overview-classic',
  ),
}

export const staffListTestIds = {
  page: 'staff-list-page',
  search: 'staff-list-input-search',
  addStaff: 'staff-list-btn-add-staff',
  addClinician: 'staff-list-btn-add-clinician',
  changeStatus: 'staff-list-btn-change-status',
  filters: 'staff-list-btn-filters',
  filtersDrawer: 'staff-list-filters-drawer',
  filtersClear: 'staff-list-filters-btn-clear',
  filtersApply: 'staff-list-filters-btn-apply',
  changeStatusDialog: 'staff-list-change-status-dialog',
  changeStatusConfirm: 'staff-list-change-status-btn-confirm',
  summaryTotal: 'staff-list-summary-total',
  summaryClinicians: 'staff-list-summary-clinicians',
  summaryActive: 'staff-list-summary-active',
  summaryOnLeave: 'staff-list-summary-on-leave',
  summaryExpiring: 'staff-list-summary-expiring',
  rowView: id => toTestId('staff-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('staff-list-row', id, 'btn-edit'),
  rowDeactivate: id => toTestId('staff-list-row', id, 'btn-deactivate'),
}

export const clientOverviewTestIds = {
  page: 'client-overview-page',
  header: 'client-overview-header',
  sidebar: 'client-overview-sidebar',
  modules: 'client-overview-modules',
  alertBar: 'client-overview-alert-bar',
  edit: 'client-overview-btn-edit',
  close: 'client-overview-btn-close',
  reviewMissing: 'client-overview-btn-review-missing',
  moduleCard: id => toTestId('client-overview-module', id),
  moduleDialog: 'client-overview-module-dialog',
  allergiesDialogList: 'client-overview-allergies-dialog-list',
}

export const clientOverviewAltTestIds = {
  page: 'client-overview-alt-page',
  header: 'client-overview-alt-header',
  openClassic: 'client-overview-alt-btn-classic',
  edit: 'client-overview-alt-btn-edit',
  actionsMenu: 'client-overview-alt-btn-actions-menu',
  actionsMenuPanel: 'client-overview-alt-actions-menu',
  copyName: 'client-overview-alt-btn-copy-name',
  copyDob: 'client-overview-alt-btn-copy-dob',
  copyPhone: 'client-overview-alt-btn-copy-phone',
  copyAddress: 'client-overview-alt-btn-copy-address',
  reviewMissing: 'client-overview-alt-btn-review-missing',
  tabs: 'client-overview-alt-tabs',
  tab: key => toTestId('client-overview-alt-tab', key),
  basicInfo: 'client-overview-alt-basic-info',
  contact: 'client-overview-alt-contact',
  allergies: 'client-overview-alt-allergies',
  insurance: 'client-overview-alt-insurance',
  appointments: 'client-overview-alt-appointments',
  encounters: 'client-overview-alt-encounters',
  billing: 'client-overview-alt-billing',
  modulesTab: key => toTestId('client-overview-alt-modules', key),
  sidebar: 'client-overview-alt-sidebar',
  viewAllActivity: 'client-overview-alt-btn-view-all-activity',
}

export const clientBillingTestIds = {
  root: 'client-billing-tab',
  rowView: id => toTestId('client-billing-row-view', id),
}

export const assignCliniciansTestIds = {
  dialog: 'assign-clinicians-dialog',
  search: 'assign-clinicians-search',
  assign: 'assign-clinicians-btn-assign',
  unassign: 'assign-clinicians-btn-unassign',
  clearAll: 'assign-clinicians-btn-clear-all',
  save: 'assign-clinicians-btn-save',
  cancel: 'assign-clinicians-btn-cancel',
  availableItem: id => toTestId('assign-clinicians-available', id),
  assignedItem: id => toTestId('assign-clinicians-assigned', id),
  remove: id => toTestId('assign-clinicians-remove', id),
}

export const encounterTestIds = {
  banner: 'active-encounter-banner',
  toolbarPill: 'active-encounter-toolbar-pill',
  toolbarClientName: 'active-encounter-toolbar-client-name',
  complete: 'active-encounter-btn-complete',
  cancel: 'active-encounter-btn-cancel',
  startButton: 'start-encounter-btn',
  openActive: 'open-active-encounter-btn',
  startMenu: 'start-encounter-menu',
  startDialog: 'start-encounter',
  startSubmit: 'start-encounter-btn-submit',
  field: name => toTestId('start-encounter-field', name),
  cancelDialog: 'encounter-cancel-dialog',
  cancelReason: 'encounter-cancel-reason',
  cancelNotes: 'encounter-cancel-notes',
  cancelSubmit: 'encounter-cancel-submit',
}

export const clientPageTestIds = {
  save: 'client-page-btn-save',
  overview: 'client-page-btn-overview',
  close: 'client-page-btn-close',
  breadcrumbClients: 'client-page-breadcrumb-clients',
  profilePhotoCamera: 'client-page-profile-photo-camera',
  profilePhotoPreview: 'client-page-profile-photo-preview',
  profilePhotoCameraSelect: 'client-page-profile-photo-camera-select',
  profilePhotoCropDialog: 'client-page-profile-photo-crop-dialog',
  profilePhotoCropViewport: 'client-page-profile-photo-crop-viewport',
  profilePhotoCropZoom: 'client-page-profile-photo-crop-zoom',
  profilePhotoCropSave: 'client-page-profile-photo-crop-save',
  profilePhotoCropCancel: 'client-page-profile-photo-crop-cancel',
}

export const addClientTestIds = {
  form: 'add-client-form',
  formFields: 'add-client-form-fields',
  tab: key => toTestId('add-client-tab', key),
  subTab: key => toTestId('add-client-subtab', key),
  field: name => toTestId('add-client-field', name),
  genderOption: token => toTestId('add-client-field-gender', token),
  preferredLanguageOption: token => toTestId(
    'add-client-field-preferred-language',
    token,
  ),
  accordionToggle: section => toTestId(
    'add-client-accordion',
    section,
    'toggle',
  ),
  btn: name => toTestId('add-client-btn', name),
  preferredComm: token => toTestId('add-client-pref-comm', token),
  preferredCommAuth: 'add-client-pref-comm-auth',
  preferredPointOfContact: 'add-client-pref-point-of-contact',
  otherContactTab: id => toTestId('add-client-other-contact-tab', id),
  otherContactAdd: 'add-client-other-contact-btn-add',
  otherContactRemove: 'add-client-other-contact-btn-remove',
  phoneAdd: index => toTestId('add-client-phone', index, 'btn-add'),
  phoneRemove: index => toTestId('add-client-phone', index, 'btn-remove'),
  emailAdd: index => toTestId('add-client-email', index, 'btn-add'),
  emailRemove: index => toTestId('add-client-email', index, 'btn-remove'),
  modalCancelDiscard: 'add-client-modal-btn-discard',
  modalKeepEditing: 'add-client-modal-btn-keep-editing',
  fmhField: name => toTestId('add-client-fmh-field', name),
  fmhBtnAdd: 'add-client-fmh-btn-add',
  fmhRowEdit: id => toTestId('add-client-fmh-row', id, 'btn-edit'),
  fmhRowDelete: id => toTestId('add-client-fmh-row', id, 'btn-delete'),
  assignedClinicianRowRemove: id => toTestId(
    'add-client-assigned-clinician-row',
    id,
    'btn-remove',
  ),
  assignedClinicianRowSetPrimary: id => toTestId(
    'add-client-assigned-clinician-row',
    id,
    'btn-set-primary',
  ),
  allergyField: name => toTestId('add-client-allergy-field', name),
  allergySeverity: token => toTestId('add-client-allergy-severity', token),
  allergyBtnAdd: 'add-client-allergy-btn-add',
  allergyRowEdit: id => toTestId('add-client-allergy-row', id, 'btn-edit'),
  allergyRowDelete: id => toTestId('add-client-allergy-row', id, 'btn-delete'),
  vitalsField: name => toTestId('add-client-vitals-field', name),
  vitalsPainLevel: token => toTestId('add-client-vitals-pain', token),
  vitalsBtnSave: 'add-client-vitals-btn-save',
  vitalsBtnAdd: 'add-client-vitals-btn-add',
  vitalsBtnCancelEdit: 'add-client-vitals-btn-cancel-edit',
  vitalsRowEdit: id => toTestId('add-client-vitals-row', id, 'btn-edit'),
  vitalsRowDelete: id => toTestId('add-client-vitals-row', id, 'btn-delete'),
  insuranceField: name => toTestId('add-client-insurance-field', name),
  insuranceBtnAdd: 'add-client-insurance-btn-add',
  insuranceActionsMenu: 'add-client-insurance-actions-menu',
  insuranceShowInactive: 'add-client-insurance-show-inactive',
  insuranceShowInactiveToggle:
    'add-client-insurance-show-inactive-toggle',
  insuranceRowView: id => toTestId('add-client-insurance-row', id, 'btn-view'),
  insuranceRowEdit: id => toTestId('add-client-insurance-row', id, 'btn-edit'),
  insuranceRowDeactivate: id => toTestId(
    'add-client-insurance-row',
    id,
    'btn-deactivate',
  ),
  insuranceRowReactivate: id => toTestId(
    'add-client-insurance-row',
    id,
    'btn-reactivate',
  ),
  insuranceModal: name => toTestId('add-client-insurance-modal', name),
  insuranceModalBtn: name => toTestId(
    'add-client-insurance-modal',
    name,
    'btn',
  ),
  duplicateMatch: {
    banner: 'add-client-duplicate-match-banner',
    row: id => toTestId('add-client-duplicate-match', id, 'row'),
    btnViewMatches: 'add-client-duplicate-match-btn-view-matches',
    btnViewAll: 'add-client-duplicate-match-btn-view-all',
    btnIgnore: 'add-client-duplicate-match-btn-ignore',
    btnNotMatch: 'add-client-duplicate-match-review-btn-not-match',
    btnOpenExisting: 'add-client-duplicate-match-review-btn-open-existing',
    btnReviewMore: 'add-client-duplicate-match-review-btn-more',
    btnSaveConfirmCreate: 'add-client-duplicate-save-confirm-btn-create',
    btnSaveConfirmCancel: 'add-client-duplicate-save-confirm-btn-cancel',
    btnNavigateConfirm: 'add-client-duplicate-navigate-confirm-btn-confirm',
    btnNavigateCancel: 'add-client-duplicate-navigate-confirm-btn-cancel',
  },
}

export const screeningTestIds = {
  btn: name => toTestId('screening-btn', name),
  field: name => toTestId('screening-field', name),
  section: id => toTestId('screening-section', id),
  rowView: id => toTestId('screening-row', id, 'btn-view'),
  rowEdit: id => toTestId('screening-row', id, 'btn-edit'),
}

export const labTestIds = {
  btn: name => toTestId('lab-btn', name),
  field: name => toTestId('lab-field', name),
  rowView: id => toTestId('lab-row', id, 'btn-view'),
  rowEdit: id => toTestId('lab-row', id, 'btn-edit'),
  rowDownload: id => toTestId('lab-row', id, 'btn-download'),
}

export const pharmacyTestIds = {
  dialog: mode => toTestId('pharmacy-dialog', mode),
  btn: name => toTestId('pharmacy-dialog-btn', name),
  field: name => toTestId('pharmacy-dialog-field', name),
}

export const medicationTestIds = {
  dialog: mode => toTestId('medication-dialog', mode),
  btn: name => toTestId('medication-dialog-btn', name),
  field: name => toTestId('medication-dialog-field', name),
  rowView: id => toTestId('medication-row', id, 'btn-view'),
  rowEdit: id => toTestId('medication-row', id, 'btn-edit'),
  rowMore: id => toTestId('medication-row', id, 'btn-more'),
  rowStatus: id => toTestId('medication-row', id, 'btn-status'),
  rowDelete: id => toTestId('medication-row', id, 'btn-delete'),
}

export const carePlanTestIds = {
  btn: name => toTestId('care-plan-btn', name),
  field: name => toTestId('care-plan-field', name),
  rowView: id => toTestId('care-plan-row', id, 'btn-view'),
  rowEdit: id => toTestId('care-plan-row', id, 'btn-edit'),
  rowSign: id => toTestId('care-plan-row', id, 'btn-sign'),
  rowComplete: id => toTestId('care-plan-row', id, 'btn-complete'),
  rowArchive: id => toTestId('care-plan-row', id, 'btn-archive'),
}

export const clinicalNoteTestIds = {
  btn: name => toTestId('clinical-note-btn', name),
  field: name => toTestId('clinical-note-field', name),
  accordion: section => toTestId('clinical-note-accordion', section),
  accordionToggle: section => toTestId(
    'clinical-note-accordion',
    section,
    'toggle',
  ),
  rowView: id => toTestId('clinical-note-row', id, 'btn-view'),
  rowEdit: id => toTestId('clinical-note-row', id, 'btn-edit'),
  rowDelete: id => toTestId('clinical-note-row', id, 'btn-delete'),
  rowDownload: id => toTestId('clinical-note-row', id, 'btn-download'),
}

export const followUpTestIds = {
  btn: name => toTestId('follow-up-btn', name),
  field: name => toTestId('follow-up-field', name),
  accordionToggle: section => toTestId(
    'follow-up-accordion',
    section,
    'toggle',
  ),
  rowMenu: id => toTestId('follow-up-row', id, 'btn-menu'),
  rowEdit: id => toTestId('follow-up-row', id, 'btn-edit'),
  rowView: id => toTestId('follow-up-row', id, 'btn-view'),
  rowComplete: id => toTestId('follow-up-row', id, 'btn-complete'),
  rowCancel: id => toTestId('follow-up-row', id, 'btn-cancel'),
}

export const appointmentTestIds = {
  btn: name => toTestId('appointment-btn', name),
  field: name => toTestId('appointment-field', name),
  rowView: id => toTestId('appointment-row', id, 'btn-view'),
  rowEdit: id => toTestId('appointment-row', id, 'btn-edit'),
  rowCancel: id => toTestId('appointment-row', id, 'btn-cancel'),
  rowDelete: id => toTestId('appointment-row', id, 'btn-delete'),
  rowReschedule: id => toTestId('appointment-row', id, 'btn-reschedule'),
  rowCheckIn: id => toTestId('appointment-row', id, 'btn-check-in'),
  rowComplete: id => toTestId('appointment-row', id, 'btn-complete'),
  rowNoShow: id => toTestId('appointment-row', id, 'btn-no-show'),
}

export const referralTestIds = {
  btn: name => toTestId('referral-btn', name),
  field: name => toTestId('referral-field', name),
  rowView: id => toTestId('referral-row', id, 'btn-view'),
  rowEdit: id => toTestId('referral-row', id, 'btn-edit'),
  rowMore: id => toTestId('referral-row', id, 'btn-more'),
  rowSchedule: id => toTestId('referral-row', id, 'btn-schedule'),
  rowDelete: id => toTestId('referral-row', id, 'btn-delete'),
}

export const authorizationTestIds = {
  btn: name => toTestId('authorization-btn', name),
  field: name => toTestId('authorization-field', name),
  rowView: id => toTestId('authorization-row', id, 'btn-view'),
  rowEdit: id => toTestId('authorization-row', id, 'btn-edit'),
  rowCancel: id => toTestId('authorization-row', id, 'btn-cancel'),
}

export const calendarTestIds = {
  page: 'calendar-page',
  btnToday: 'calendar-btn-today',
  btnAddAppointment: 'calendar-btn-add-appointment',
  btnPrev: 'calendar-btn-prev',
  btnNext: 'calendar-btn-next',
  viewToggle: 'calendar-view-toggle',
  sidebarToggle: 'calendar-btn-sidebar-toggle',
  miniMonthPrev: 'calendar-mini-month-btn-prev',
  miniMonthNext: 'calendar-mini-month-btn-next',
  clinicianSelect: 'calendar-clinician-select',
  clinicianToggle: id => toTestId('calendar-clinician', id, 'toggle'),
  sourceToggle: id => toTestId('calendar-source', id, 'toggle'),
  event: id => toTestId('calendar-event', id),
}

export const photoPreviewTestIds = {
  dialog: 'photo-preview',
  trigger: 'photo-preview-trigger',
  image: 'photo-preview-image',
}

export const modalTestIds = {
  dialog: name => toTestId('modal', name),
  confirm: name => toTestId('modal', name, 'btn-confirm'),
  cancel: name => toTestId('modal', name, 'btn-cancel'),
}

export function contactFieldTestId(name) {
  return withTestIdPrefix('contact', 'field', name)
}

export function otherContactFieldTestId(name) {
  return withTestIdPrefix('other-contact', 'field', name)
}

export function otherContactPhoneAddTestId(contactId, index) {
  return toTestId('other-contact', contactId, 'phone', index, 'btn-add')
}

export function otherContactPhoneRemoveTestId(contactId, index) {
  return toTestId('other-contact', contactId, 'phone', index, 'btn-remove')
}

export function otherContactEmailAddTestId(contactId, index) {
  return toTestId('other-contact', contactId, 'email', index, 'btn-add')
}

export function otherContactEmailRemoveTestId(contactId, index) {
  return toTestId('other-contact', contactId, 'email', index, 'btn-remove')
}

export { clientAttachmentsTestIds } from
  'src/test-ids/client-attachments.js'

export { aiTestIds, chartChatTestIds } from 'src/test-ids/ai.js'

export { encounterWorkspaceTestIds } from
  'src/test-ids/encounter-workspace.js'

export {
  consentTemplateListTestIds,
  consentTemplateDialogTestIds,
  consentVersionDialogTestIds,
  clientConsentsTestIds,
} from 'src/test-ids/consents.js'
