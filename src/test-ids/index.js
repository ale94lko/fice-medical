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
  notifications: 'layout-btn-notifications',
  userMenu: 'layout-btn-user-menu',
  signOut: 'layout-menu-sign-out',
  navDashboard: 'layout-nav-dashboard',
  navClientMenu: 'layout-nav-client-menu',
  navClientList: 'layout-nav-client-list',
  navPriorAuth: 'layout-nav-prior-authorization',
  navClientAssignment: 'layout-nav-client-assignment',
  navAdminUsers: 'layout-nav-admin-users',
  navStaffList: 'layout-nav-staff-list',
}

export const sessionInactivityTestIds = {
  dialog: 'session-inactivity-dialog',
  countdown: 'session-inactivity-countdown',
  closeSection: 'session-inactivity-btn-close-section',
  keepOpen: 'session-inactivity-btn-keep-open',
}

export const adminTableTestIds = {
  columnSettings: 'admin-table-btn-column-settings',
}

export const userListTestIds = {
  page: 'user-list-page',
  search: 'user-list-input-search',
  addUser: 'user-list-btn-add',
  rowView: id => toTestId('user-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('user-list-row', id, 'btn-edit'),
  rowMore: id => toTestId('user-list-row', id, 'btn-more'),
  rowDelete: id => toTestId('user-list-row', id, 'btn-delete'),
}

export const userDialogTestIds = {
  field: name => toTestId('user-dialog-field', name),
  btn: name => toTestId('user-dialog-btn', name),
}

export const clientListTestIds = {
  page: 'client-list-page',
  search: 'client-list-input-search',
  addClient: 'client-list-btn-add',
  assignClinicians: 'client-list-btn-assign-clinicians',
  changeStatus: 'client-list-btn-change-status',
  filters: 'client-list-btn-filters',
  columnSettings: 'client-list-btn-column-settings',
  summaryUpcoming: 'client-list-summary-upcoming',
  summaryMissing: 'client-list-summary-missing',
  summaryBilling: 'client-list-summary-billing',
  summaryAuthorizations: 'client-list-summary-authorizations',
  rowView: id => toTestId('client-list-row', id, 'btn-view'),
  rowEdit: id => toTestId('client-list-row', id, 'btn-edit'),
  rowAssign: id => toTestId('client-list-row', id, 'btn-assign'),
  rowStatus: id => toTestId('client-list-row', id, 'btn-status'),
  rowMore: id => toTestId('client-list-row', id, 'btn-more'),
}

export const staffListTestIds = {
  page: 'staff-list-page',
  search: 'staff-list-input-search',
  addStaff: 'staff-list-btn-add-staff',
  addClinician: 'staff-list-btn-add-clinician',
  changeStatus: 'staff-list-btn-change-status',
  filters: 'staff-list-btn-filters',
  filtersDialog: 'staff-list-filters-dialog',
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
  rowMore: id => toTestId('staff-list-row', id, 'btn-more'),
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

export const clientPageTestIds = {
  save: 'client-page-btn-save',
  close: 'client-page-btn-close',
  breadcrumbClients: 'client-page-breadcrumb-clients',
  profilePhotoCamera: 'client-page-profile-photo-camera',
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
  insuranceRowView: id => toTestId('add-client-insurance-row', id, 'btn-view'),
  insuranceRowEdit: id => toTestId('add-client-insurance-row', id, 'btn-edit'),
  insuranceRowDeactivate: id => toTestId(
    'add-client-insurance-row',
    id,
    'btn-deactivate',
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
