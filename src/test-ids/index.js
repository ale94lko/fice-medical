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
  mfaCodeInput: 'auth-input-mfa-code',
  mfaVerifyButton: 'auth-btn-mfa-verify',
  mfaBackButton: 'auth-btn-mfa-back',
}

export const layoutTestIds = {
  menuToggle: 'layout-btn-menu-toggle',
  headerOverflow: 'layout-btn-header-overflow',
  headerOverflowMenu: 'layout-header-overflow-menu',
  headerOverflowSubtenant: 'layout-header-overflow-subtenant',
  headerOverflowClinical: 'layout-header-overflow-clinical',
  headerOverflowNotifications:
    'layout-header-overflow-notifications',
  headerOverflowTimezone: 'layout-header-overflow-timezone',
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
  timezoneBanner: 'layout-timezone-banner',
  timezoneBannerMenu: 'layout-timezone-banner-menu',
  timezoneBannerUseDevice: 'layout-timezone-banner-use-device',
  timezoneBannerKeepClinic: 'layout-timezone-banner-keep-clinic',
  timezoneBannerRevert: 'layout-timezone-banner-revert',
  timezoneBannerEncounter: 'layout-timezone-banner-encounter',
  timezoneBannerEncounterMenu:
    'layout-timezone-banner-encounter-menu',
  timezoneBannerEncounterUseDevice:
    'layout-timezone-banner-encounter-use-device',
  timezoneBannerEncounterKeepClinic:
    'layout-timezone-banner-encounter-keep-clinic',
  timezoneBannerEncounterRevert:
    'layout-timezone-banner-encounter-revert',
  headerStaffProfile: 'layout-header-staff-profile',
  changePassword: 'layout-menu-change-password',
  signOut: 'layout-menu-sign-out',
  navDashboard: 'layout-nav-dashboard',
  navCalendar: 'layout-nav-calendar',
  navPortalMenu: 'layout-nav-portal-menu',
  navAppointmentRequests: 'layout-nav-appointment-requests',
  navMessages: 'layout-nav-messages',
  navClientMenu: 'layout-nav-client-menu',
  navClientList: 'layout-nav-client-list',
  navPortalRegistrations: 'layout-nav-portal-registrations',
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
  navSuperbills: 'layout-nav-superbills',
  navClaims: 'layout-nav-claims',
  navRemittances: 'layout-nav-remittances',
  navPayments: 'layout-nav-payments',
  navDenials: 'layout-nav-denials',
  collapseMenu: 'layout-btn-collapse-menu',
  expandMenu: 'layout-btn-expand-menu',
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
  refresh: 'billing-queue-refresh',
  issueBadge: id => toTestId('billing-queue-issues', id),
  rowView: id => toTestId('superbill-list-row-view', id),
}

export const superbillDetailTestIds = {
  page: 'superbill-detail-page',
  print: 'superbill-detail-print',
  actions: 'superbill-detail-actions',
  markReviewed: 'superbill-detail-mark-reviewed',
  hold: 'superbill-detail-hold',
  releaseHold: 'superbill-detail-release-hold',
  void: 'superbill-detail-void',
  reopen: 'superbill-detail-reopen',
  tab: name => toTestId('superbill-detail-tab', name),
  addNote: 'superbill-detail-add-note',
  viewEncounter: 'superbill-detail-view-encounter',
  viewClaim: 'superbill-detail-view-claim',
  generateClaim: 'superbill-detail-generate-claim',
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

export const claimListTestIds = {
  page: 'claim-list-page',
  search: 'claim-list-search',
  queueTab: name => toTestId('claim-queue-tab', name),
  dosFilter: 'claim-queue-dos-filter',
  providerFilter: 'claim-queue-provider-filter',
  payerFilter: 'claim-queue-payer-filter',
  serviceFilter: 'claim-queue-service-filter',
  sortFilter: 'claim-queue-sort-filter',
  includeVoided: 'claim-queue-include-voided',
  refresh: 'claim-queue-refresh',
  rowView: id => toTestId('claim-list-row-view', id),
}

export const claimDetailTestIds = {
  page: 'claim-detail-page',
  void: 'claim-detail-void',
  submit: 'claim-detail-submit',
  retry: 'claim-detail-retry',
  tab: name => toTestId('claim-detail-tab', name),
  viewSuperbill: 'claim-detail-view-superbill',
  requirementRow: (code, id) => toTestId(
    'claim-req-row',
    code,
    id,
  ),
  requirementAction: (code, id) => toTestId(
    'claim-req-action',
    code,
    id,
  ),
}

export const remittanceListTestIds = {
  page: 'remittance-list-page',
  search: 'remittance-list-search',
  queueTab: name => toTestId('remittance-queue-tab', name),
  refresh: 'remittance-queue-refresh',
  ingest: 'remittance-queue-ingest',
  rowView: id => toTestId('remittance-list-row-view', id),
}

export const remittanceDetailTestIds = {
  page: 'remittance-detail-page',
  post: 'remittance-detail-post',
  reviewClaim: id => toTestId('remittance-review-claim', id),
}

export const paymentListTestIds = {
  page: 'payment-list-page',
  search: 'payment-list-search',
  refresh: 'payment-list-refresh',
  ingest: 'payment-list-ingest',
  tabInsurance: 'payment-list-tab-insurance',
  tabClient: 'payment-list-tab-client',
  rowView: id => toTestId('payment-list-row-view', id),
}

export const clientPaymentTestIds = {
  applyDialog: 'client-payment-apply-dialog',
  applyAddLine: 'client-payment-apply-btn-add-line',
  applyCancel: 'client-payment-apply-btn-cancel',
  applySubmit: 'client-payment-apply-btn-submit',
  reverseCancel: 'client-payment-reverse-btn-cancel',
  reverseSubmit: 'client-payment-reverse-btn-submit',
  recordCancel: 'client-payment-record-btn-cancel',
  detailClose: 'client-payment-detail-btn-close',
}

export const remittanceIngestTestIds = {
  payload: 'remittance-ingest-payload',
  autoPost: 'remittance-ingest-auto-post',
}

export const denialListTestIds = {
  page: 'denial-list-page',
  search: 'denial-list-search',
  queueTab: name => toTestId('denial-queue-tab', name),
  refresh: 'denial-queue-refresh',
  rowView: id => toTestId('denial-list-row-view', id),
}

export const denialDetailTestIds = {
  page: 'denial-detail-page',
  startWork: 'denial-detail-start-work',
  correct: 'denial-detail-correct',
  appeal: 'denial-detail-appeal',
  resolve: 'denial-detail-resolve',
  viewClaim: 'denial-detail-view-claim',
  saveRootCause: 'denial-detail-save-root-cause',
  suggestedAction: 'denial-detail-suggested-action',
  reopenSource: 'denial-detail-reopen-source',
  dialogCancel: name => toTestId('denial-detail-dialog', name, 'btn-cancel'),
  dialogConfirm: name => toTestId(
    'denial-detail-dialog',
    name,
    'btn-confirm',
  ),
}

export const myProfileTestIds = {
  page: 'my-profile-page',
  summary: 'my-profile-summary',
  changePassword: 'my-profile-quick-change-password',
  twoFactor: 'my-profile-quick-two-factor',
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
  cancel: 'generate-document-btn-cancel',
  refresh: 'generated-documents-btn-refresh',
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
  info: 'forced-change-password-btn-info',
}

export const forcedMfaEnrollTestIds = {
  dialog: 'forced-mfa-enroll-dialog',
  code: 'forced-mfa-enroll-input-code',
  submit: 'forced-mfa-enroll-btn-submit',
  continue: 'forced-mfa-enroll-btn-continue',
  secret: 'forced-mfa-enroll-secret',
  qr: 'forced-mfa-enroll-qr',
  cancel: 'forced-mfa-enroll-btn-cancel',
}

export const changePasswordTestIds = {
  dialog: 'change-password-dialog',
  currentPassword: 'change-password-input-current',
  newPassword: 'change-password-input-new',
  repeatPassword: 'change-password-input-repeat',
  submit: 'change-password-btn-submit',
  info: 'change-password-btn-info',
}

export const adminTableTestIds = {
  columnSettings: 'admin-table-btn-column-settings',
  pageActionsMenu: 'admin-list-page-btn-actions-menu',
  pagination: 'admin-table-pagination',
  rowsPerPage: 'admin-table-pagination-rows-per-page',
  prevPage: 'admin-table-pagination-btn-prev',
  nextPage: 'admin-table-pagination-btn-next',
  pages: 'admin-table-pagination-pages',
  columnSettingsDialog: 'admin-table-column-settings-dialog',
  columnSettingsReset: 'admin-table-column-settings-btn-reset',
  columnSettingsCancel: 'admin-table-column-settings-btn-cancel',
  columnSettingsSave: 'admin-table-column-settings-btn-save',
  columnToggle: id => toTestId(
    'admin-table-column-settings-toggle',
    id,
  ),
  contactCopy: value => toTestId('admin-table-contact-copy', value),
  emptyState: 'admin-table-empty-state',
}

export const errorNotFoundTestIds = {
  page: 'error-not-found-page',
  goHome: 'error-not-found-btn-go-home',
}

export const userListTestIds = {
  page: 'user-list-page',
  search: 'user-list-input-search',
  emptyState: 'user-list-empty-state',
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
  dialog: 'user-dialog',
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
  section: name => toTestId('subtenant-dialog-section', name),
  sectionToggle: name => toTestId(
    'subtenant-dialog-section',
    name,
    'toggle',
  ),
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
  detailBtn: name => toTestId('clinical-resource-detail-btn', name),
  formField: name => toTestId('clinical-resource-form-field', name),
  breadcrumbResources: 'clinical-resource-breadcrumb-resources',
  quickPanelTrigger: 'clinical-resource-quick-panel-trigger',
  quickPanelMenu: 'clinical-resource-quick-panel-menu',
  quickPanelSearch: 'clinical-resource-quick-panel-input-search',
  quickPanelBrowseAll: 'clinical-resource-quick-panel-btn-browse-all',
  quickPanelItem: id => toTestId('clinical-resource-quick-panel-item', id),
  quickPanelClose: 'clinical-resource-quick-panel-btn-close',
  quickPanelItemAction: id => toTestId(
    'clinical-resource-quick-panel-item',
    id,
    'btn-action',
  ),
  documentRemove: 'clinical-resource-document-btn-remove',
}

export const clinicalResourceListTestIds = clinicalResourceTestIds

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
  requirementDialog: 'service-procedure-requirement-dialog',
  field: name => toTestId('service-procedure-dialog-field', name),
  requirementField: name => toTestId(
    'service-procedure-requirement-field',
    name,
  ),
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
  rowView: id => toTestId(
    'clinical-note-template-list-row',
    id,
    'btn-view',
  ),
  rowEdit: id => toTestId(
    'clinical-note-template-list-row',
    id,
    'btn-edit',
  ),
  rowDuplicate: id => toTestId(
    'clinical-note-template-list-row',
    id,
    'btn-duplicate',
  ),
  rowActivate: id => toTestId(
    'clinical-note-template-list-row',
    id,
    'btn-activate',
  ),
  rowDeactivate: id => toTestId(
    'clinical-note-template-list-row',
    id,
    'btn-deactivate',
  ),
}

export const clinicalNoteTemplateDialogTestIds = {
  dialog: 'clinical-note-template-dialog',
  previewDialog: 'clinical-note-template-preview-dialog',
  field: name => toTestId('clinical-note-template-dialog-field', name),
  addSection: 'clinical-note-template-dialog-btn-add-section',
  addAdditionalNotes:
    'clinical-note-template-dialog-btn-add-additional-notes',
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
  removeSection: index => toTestId(
    'clinical-note-template-dialog-section',
    index,
    'remove',
  ),
  addStructuredField: index => toTestId(
    'clinical-note-template-dialog-section',
    index,
    'add-structured-field',
  ),
  removeStructuredField: (index, fieldIndex) => toTestId(
    'clinical-note-template-dialog-section',
    index,
    'structured-field',
    fieldIndex,
    'remove',
  ),
  btn: name => toTestId('clinical-note-template-dialog-btn', name),
}

export const clinicalAuditTestIds = {
  emptyState: 'clinical-audit-empty-state',
  detailDialog: 'clinical-audit-detail-dialog',
  detailClose: 'clinical-audit-detail-btn-close',
  copyJsonBefore: 'clinical-audit-detail-btn-copy-before',
  copyJsonAfter: 'clinical-audit-detail-btn-copy-after',
  toggleRawJson: 'clinical-audit-detail-btn-raw-json',
  diffFilter: kind => toTestId(
    'clinical-audit-detail-filter',
    kind,
  ),
  filtersDrawer: 'clinical-audit-filters-drawer',
  filtersClear: 'clinical-audit-filters-btn-clear',
  filtersApply: 'clinical-audit-filters-btn-apply',
  filterField: name => toTestId('clinical-audit-filter-field', name),
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
  addOption: (sIndex, qIndex) => toTestId(
    'screening-template-dialog-question',
    `${sIndex}-${qIndex}`,
    'add-option',
  ),
  removeOption: (sIndex, qIndex, oIndex) => toTestId(
    'screening-template-dialog-option',
    `${sIndex}-${qIndex}-${oIndex}`,
    'remove',
  ),
  addRange: 'screening-template-dialog-btn-add-range',
  removeRange: index =>
    toTestId('screening-template-dialog-range', index, 'remove'),
  rangeField: (index, name) =>
    toTestId('screening-template-dialog-range', index, name),
  viewToggle: 'screening-template-dialog-view-toggle',
  previewClose: 'screening-template-preview-dialog-btn-close',
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
  emptyState: 'client-list-empty-state',
  addClient: 'client-list-btn-add',
  assignClinicians: 'client-list-btn-assign-clinicians',
  changeStatus: 'client-list-btn-change-status',
  changeStatusDialog: 'client-list-change-status-dialog',
  changeStatusCancel: 'client-list-change-status-btn-cancel',
  changeStatusConfirm: 'client-list-change-status-btn-confirm',
  changeStatusSelect: 'client-list-change-status-select',
  changeStatusCurrent: 'client-list-change-status-current',
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
  emptyState: 'staff-list-empty-state',
  addStaff: 'staff-list-btn-add-staff',
  addClinician: 'staff-list-btn-add-clinician',
  changeStatus: 'staff-list-btn-change-status',
  filters: 'staff-list-btn-filters',
  filtersDrawer: 'staff-list-filters-drawer',
  filtersClear: 'staff-list-filters-btn-clear',
  filtersApply: 'staff-list-filters-btn-apply',
  changeStatusDialog: 'staff-list-change-status-dialog',
  changeStatusCancel: 'staff-list-change-status-btn-cancel',
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
  screeningsDialogList: 'client-overview-screenings-dialog-list',
  copyPhone: 'client-overview-btn-copy-phone',
  copyClientNumber: 'client-overview-btn-copy-client-number',
  moduleClose: 'client-overview-module-btn-close',
  moduleOpen: 'client-overview-module-btn-open',
}

export const clientOverviewAltTestIds = {
  page: 'client-overview-alt-page',
  header: 'client-overview-alt-header',
  openClassic: 'client-overview-alt-btn-classic',
  edit: 'client-overview-alt-btn-edit',
  invitePortal: 'client-overview-alt-btn-invite-portal',
  messages: 'client-overview-alt-btn-messages',
  actionsMenu: 'client-overview-alt-btn-actions-menu',
  actionsMenuPanel: 'client-overview-alt-actions-menu',
  moreActions: 'client-overview-alt-btn-more-actions',
  moreActionsPanel: 'client-overview-alt-more-actions',
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
  copyMrn: 'client-overview-alt-btn-copy-mrn',
}

export const clientBillingTestIds = {
  root: 'client-billing-tab',
  rowView: id => toTestId('client-billing-row-view', id),
}

export const clientFinancialTestIds = {
  overview: 'client-financial-overview',
  ledger: 'client-ledger-tab',
  search: 'client-ledger-search',
  typeFilter: 'client-ledger-type-filter',
  statusFilter: 'client-ledger-status-filter',
  fromDate: 'client-ledger-from-date',
  toDate: 'client-ledger-to-date',
  rowView: id => toTestId('client-ledger-row-view', id),
  recentRow: id => toTestId('client-financial-recent', id),
  viewClaim: 'client-ledger-btn-view-claim',
  viewSuperbill: 'client-ledger-btn-view-superbill',
  detailClose: 'client-ledger-btn-close',
  overviewTabs: 'client-financial-subtabs',
  recordPayment: 'client-financial-btn-record-payment',
  payments: 'client-payments-tab',
  paymentSearch: 'client-payments-search',
  paymentRowView: id => toTestId('client-payments-row-view', id),
  paymentAmount: 'client-payment-amount',
  paymentDate: 'client-payment-date',
  paymentMethod: 'client-payment-method',
  paymentReference: 'client-payment-reference',
  paymentCheckNumber: 'client-payment-check-number',
  paymentMethodDescription: 'client-payment-method-description',
  paymentNotes: 'client-payment-notes',
  paymentAutoApply: 'client-payment-btn-auto-apply',
  paymentSubmit: 'client-payment-btn-submit',
  paymentReverse: 'client-payment-btn-reverse',
  paymentApply: 'client-payment-btn-apply',
  paymentReverseReason: 'client-payment-reverse-reason',
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
  completeHint: 'active-encounter-complete-hint',
  cancel: 'active-encounter-btn-cancel',
  wait: 'active-encounter-btn-wait',
  resume: 'active-encounter-btn-resume',
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
  profilePhotoCropZoomOut: 'client-page-profile-photo-crop-zoom-out',
  profilePhotoCropZoomIn: 'client-page-profile-photo-crop-zoom-in',
  profilePhotoCameraCancel: 'client-page-profile-photo-camera-cancel',
  profilePhotoCameraRetake: 'client-page-profile-photo-camera-retake',
  profilePhotoCameraUse: 'client-page-profile-photo-camera-use',
  profilePhotoCameraCapture: 'client-page-profile-photo-camera-capture',
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
  fmhSocialField: name => toTestId('add-client-fmh-social', name),
  fmhBtnAdd: 'add-client-fmh-btn-add',
  fmhRowEdit: id => toTestId('add-client-fmh-row', id, 'btn-edit'),
  fmhRowDelete: id => toTestId('add-client-fmh-row', id, 'btn-delete'),
  fmhDeleteDialog: 'add-client-fmh-delete-dialog',
  fmhDeleteCancel: 'add-client-fmh-delete-btn-cancel',
  fmhDeleteConfirm: 'add-client-fmh-delete-btn-confirm',
  fmhDeleteReason: 'add-client-fmh-delete-field-reason',
  guardianConsentDialog: 'add-client-guardian-consent-dialog',
  guardianConsentView: id => toTestId(
    'add-client-guardian-consent',
    id,
    'btn-view',
  ),
  guardianConsentCancel: 'add-client-guardian-consent-btn-cancel',
  guardianConsentConfirm: 'add-client-guardian-consent-btn-confirm',
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
  allergyDeleteDialog: 'add-client-allergy-delete-dialog',
  allergyDeleteCancel: 'add-client-allergy-delete-btn-cancel',
  allergyDeleteConfirm: 'add-client-allergy-delete-btn-confirm',
  allergyDeleteReason: 'add-client-allergy-delete-field-reason',
  insuranceCardBtn: name => toTestId(
    'add-client-insurance-card-btn',
    name,
  ),
  insuranceCardTabs: 'add-client-insurance-card-tabs',
  insuranceCardTab: kind => toTestId(
    'add-client-insurance-card-tab',
    kind,
  ),
  insuranceCardPanel: kind => toTestId(
    'add-client-insurance-card-panel',
    kind,
  ),
  vitalsField: name => toTestId('add-client-vitals-field', name),
  vitalsPainLevel: token => toTestId('add-client-vitals-pain', token),
  vitalsBtnSave: 'add-client-vitals-btn-save',
  vitalsBtnAdd: 'add-client-vitals-btn-add',
  vitalsBtnCancelEdit: 'add-client-vitals-btn-cancel-edit',
  vitalsBtnTimePickerClose: 'add-client-vitals-btn-time-picker-close',
  vitalsRecordDialog: 'add-client-vitals-record-dialog',
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
  option: name => toTestId('screening-option', name),
}

export const labTestIds = {
  btn: name => toTestId('lab-btn', name),
  field: name => toTestId('lab-field', name),
  rowView: id => toTestId('lab-row', id, 'btn-view'),
  rowEdit: id => toTestId('lab-row', id, 'btn-edit'),
  rowDownload: id => toTestId('lab-row', id, 'btn-download'),
  rowCollect: id => toTestId('lab-row', id, 'btn-collect'),
  rowResults: id => toTestId('lab-row', id, 'btn-results'),
  rowReview: id => toTestId('lab-row', id, 'btn-review'),
  rowCancel: id => toTestId('lab-row', id, 'btn-cancel'),
  rowDelete: id => toTestId('lab-row', id, 'btn-delete'),
  componentRowView: id => toTestId('lab-component-row', id, 'btn-view'),
  componentRowEdit: id => toTestId('lab-component-row', id, 'btn-edit'),
  componentRowDelete: id => toTestId(
    'lab-component-row',
    id,
    'btn-delete',
  ),
  attachmentRemove: 'lab-attachment-btn-remove',
  attachmentDownload: 'lab-attachment-btn-download',
  attachmentPreview: 'lab-attachment-btn-preview',
  attachmentOpen: 'lab-attachment-btn-open',
}

export const diagnosticStudyTestIds = {
  dialog: mode => toTestId('diagnostic-study-dialog', mode),
  btn: name => toTestId('diagnostic-study-btn', name),
  field: name => toTestId('diagnostic-study-field', name),
  rowView: id => toTestId('diagnostic-study-row', id, 'btn-view'),
  rowComplete: id => toTestId(
    'diagnostic-study-row',
    id,
    'btn-complete',
  ),
  rowResult: id => toTestId(
    'diagnostic-study-row',
    id,
    'btn-result',
  ),
  rowReview: id => toTestId(
    'diagnostic-study-row',
    id,
    'btn-review',
  ),
  rowDownload: id => toTestId(
    'diagnostic-study-row',
    id,
    'btn-download',
  ),
  rowCancel: id => toTestId(
    'diagnostic-study-row',
    id,
    'btn-cancel',
  ),
  rowDelete: id => toTestId(
    'diagnostic-study-row',
    id,
    'btn-delete',
  ),
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
  rowDiscontinue: id => toTestId('medication-row', id, 'btn-discontinue'),
  rowDelete: id => toTestId('medication-row', id, 'btn-delete'),
  showDiscontinued: 'medication-show-discontinued',
}

export const carePlanTestIds = {
  btn: name => toTestId('care-plan-btn', name),
  field: name => toTestId('care-plan-field', name),
  rowView: id => toTestId('care-plan-row', id, 'btn-view'),
  rowEdit: id => toTestId('care-plan-row', id, 'btn-edit'),
  rowDelete: id => toTestId('care-plan-row', id, 'btn-delete'),
  rowSign: id => toTestId('care-plan-row', id, 'btn-sign'),
  rowComplete: id => toTestId('care-plan-row', id, 'btn-complete'),
  rowArchive: id => toTestId('care-plan-row', id, 'btn-archive'),
  rowCancel: id => toTestId('care-plan-row', id, 'btn-cancel'),
  rowDiscontinue: id => toTestId('care-plan-row', id, 'btn-discontinue'),
  rowReplace: id => toTestId('care-plan-row', id, 'btn-replace'),
  rowHistory: id => toTestId('care-plan-row', id, 'btn-history'),
  rowAddMeasurement: id => toTestId(
    'care-plan-row',
    id,
    'btn-add-measurement',
  ),
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
  addendumItem: id => toTestId('clinical-note-addendum', id),
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
  rowRemove: id => toTestId('follow-up-row', id, 'btn-remove'),
}

export const appointmentTestIds = {
  btn: name => toTestId('appointment-btn', name),
  field: name => toTestId('appointment-field', name),
  copyNumber: 'appointment-btn-copy-number',
  copyInvite: 'appointment-btn-copy-invite',
  close: 'appointment-btn-close',
  encounter: 'appointment-btn-encounter',
  joinTelehealth: 'appointment-btn-join-telehealth',
  viewClient: 'appointment-btn-view-client',
  clientCard: 'appointment-detail-client-card',
  insuranceCard: 'appointment-detail-insurance-card',
  availabilityPrev: 'appointment-availability-btn-prev',
  availabilityNext: 'appointment-availability-btn-next',
  availabilityRefresh: 'appointment-availability-btn-refresh',
  availabilitySlot: key => toTestId(
    'appointment-availability-slot',
    key,
  ),
  spinner: name => toTestId('appointment-time-spinner', name),
  serviceLineRemove: index => toTestId(
    'appointment-service-line',
    index,
    'btn-remove',
  ),
  recurrenceToggle: 'appointment-field-repeat',
  recurrencePreview: 'appointment-recurrence-preview',
  recurrencePreviewRow: index => toTestId(
    'appointment-recurrence-preview-row',
    index,
  ),
  recurrenceDay: day => toTestId('appointment-recurrence-day', day),
  rowView: id => toTestId('appointment-row', id, 'btn-view'),
  rowEdit: id => toTestId('appointment-row', id, 'btn-edit'),
  rowCancel: id => toTestId('appointment-row', id, 'btn-cancel'),
  rowDelete: id => toTestId('appointment-row', id, 'btn-delete'),
  rowReschedule: id => toTestId('appointment-row', id, 'btn-reschedule'),
  rowCheckIn: id => toTestId('appointment-row', id, 'btn-check-in'),
  rowComplete: id => toTestId('appointment-row', id, 'btn-complete'),
  rowNoShow: id => toTestId('appointment-row', id, 'btn-no-show'),
}

export const appointmentRequestListTestIds = {
  page: 'appointment-request-list-page',
  search: 'appointment-request-list-search',
  statusFilter: 'appointment-request-list-status-filter',
  refresh: 'appointment-request-list-refresh',
  actionsMenu: 'appointment-request-list-btn-actions-menu',
  rowClient: id => toTestId(
    'appointment-request-row',
    id,
    'btn-client',
  ),
  rowSchedule: id => toTestId(
    'appointment-request-row',
    id,
    'btn-schedule',
  ),
  rowDecline: id => toTestId(
    'appointment-request-row',
    id,
    'btn-decline',
  ),
  rowCreateClient: id => toTestId(
    'appointment-request-row',
    id,
    'btn-create-client',
  ),
}

export const clinicMessagesTestIds = {
  page: 'clinic-messages-page',
  search: 'clinic-messages-search',
  refresh: 'clinic-messages-refresh',
  inbox: 'clinic-messages-inbox',
  inboxItem: id => toTestId('clinic-messages-inbox-item', id),
  thread: 'clinic-messages-thread',
  back: 'clinic-messages-btn-back',
  clientLink: 'clinic-messages-btn-client',
  clientPanel: 'clinic-messages-client-panel',
  clientPhoto: 'clinic-messages-client-photo',
  clientInfoToggle: 'clinic-messages-btn-client-info',
  encounterLink: 'clinic-messages-btn-encounter',
  appointment: id => toTestId('clinic-messages-appointment', id),
  tabs: 'clinic-messages-client-tabs',
  tab: name => toTestId('clinic-messages-tab', name),
  editClient: 'clinic-messages-btn-edit-client',
  list: 'clinic-messages-list',
  threadLoading: 'clinic-messages-thread-loading',
  clientLoading: 'clinic-messages-client-loading',
  sending: id => toTestId('clinic-messages-sending', id),
  item: id => toTestId('clinic-messages-item', id),
  file: id => toTestId('clinic-messages-file', id),
  fileInput: 'clinic-messages-file-input',
  attach: 'clinic-messages-btn-attach',
  input: 'clinic-messages-input',
  send: 'clinic-messages-btn-send',
}

export const portalRegistrationListTestIds = {
  page: 'portal-registration-list-page',
  search: 'portal-registration-list-search',
  refresh: 'portal-registration-list-refresh',
  rowCreate: id => toTestId(
    'portal-registration-row',
    id,
    'btn-create',
  ),
}

export const referralTestIds = {
  btn: name => toTestId('referral-btn', name),
  field: name => toTestId('referral-field', name),
  rowView: id => toTestId('referral-row', id, 'btn-view'),
  rowEdit: id => toTestId('referral-row', id, 'btn-edit'),
  rowMore: id => toTestId('referral-row', id, 'btn-more'),
  rowSchedule: id => toTestId('referral-row', id, 'btn-schedule'),
  rowDecline: id => toTestId('referral-row', id, 'btn-decline'),
  rowCancel: id => toTestId('referral-row', id, 'btn-cancel'),
  rowDelete: id => toTestId('referral-row', id, 'btn-delete'),
  attachmentRemove: 'referral-attachment-btn-remove',
  attachmentDownload: 'referral-attachment-btn-download',
  diagnosesRemove: key => toTestId(
    'referral-diagnoses',
    key,
    'btn-remove',
  ),
  diagnosesAi: 'referral-diagnoses-btn-ai',
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

export const signatureCanvasTestIds = {
  clear: 'signature-canvas-btn-clear',
}

export const subtenantToolbarTestIds = {
  picker: 'layout-subtenant-picker',
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

export const staffLicenseTestIds = {
  addButton: 'staff-license-btn-add',
  typeField: 'staff-license-field-type',
  numberField: 'staff-license-field-number',
  stateField: 'staff-license-field-state',
  expirationField: 'staff-license-field-expiration',
  validFromField: 'staff-license-field-valid-from',
  statusField: 'staff-license-field-status',
  primaryToggle: 'staff-license-field-primary',
  attachmentField: 'staff-license-field-attachment',
  saveButton: 'staff-license-btn-save',
  cancelButton: 'staff-license-btn-cancel',
  rowEdit: id => toTestId('staff-license-row', id, 'btn-edit'),
  rowDelete: id => toTestId('staff-license-row', id, 'btn-delete'),
  eligibility: 'staff-clinical-eligibility',
  eligibilityRow: code => toTestId(
    'staff-clinical-eligibility-row',
    code,
  ),
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

export { staffFormTestIds } from 'src/test-ids/staff.js'

export { telehealthTestIds } from 'src/test-ids/telehealth.js'
