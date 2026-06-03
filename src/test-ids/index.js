import { toTestId, withTestIdPrefix } from 'src/utils/test-id.js'

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
}

export const clientListTestIds = {
  page: 'client-list-page',
  addClient: 'client-list-btn-add',
  assignClinicians: 'client-list-btn-assign-clinicians',
  changeStatus: 'client-list-btn-change-status',
  filters: 'client-list-btn-filters',
  rowEdit: id => toTestId('client-list-row', id, 'btn-edit'),
  rowAssign: id => toTestId('client-list-row', id, 'btn-assign'),
  rowStatus: id => toTestId('client-list-row', id, 'btn-status'),
}

export const clientPageTestIds = {
  save: 'client-page-btn-save',
  close: 'client-page-btn-close',
  breadcrumbClients: 'client-page-breadcrumb-clients',
}

export const addClientTestIds = {
  form: 'add-client-form',
  formFields: 'add-client-form-fields',
  tab: key => toTestId('add-client-tab', key),
  subTab: key => toTestId('add-client-subtab', key),
  field: name => toTestId('add-client-field', name),
  genderOption: token => toTestId('add-client-field-gender', token),
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
  vitalsBtnCancelEdit: 'add-client-vitals-btn-cancel-edit',
  vitalsRowEdit: id => toTestId('add-client-vitals-row', id, 'btn-edit'),
  vitalsRowDelete: id => toTestId('add-client-vitals-row', id, 'btn-delete'),
  insuranceField: name => toTestId('add-client-insurance-field', name),
  insuranceBtnAdd: 'add-client-insurance-btn-add',
  insuranceRowView: id => toTestId('add-client-insurance-row', id, 'btn-view'),
  insuranceRowEdit: id => toTestId('add-client-insurance-row', id, 'btn-edit'),
  insuranceRowDelete: id => toTestId(
    'add-client-insurance-row',
    id,
    'btn-delete',
  ),
  insuranceModal: name => toTestId('add-client-insurance-modal', name),
  insuranceModalBtn: name => toTestId(
    'add-client-insurance-modal',
    name,
    'btn',
  ),
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
