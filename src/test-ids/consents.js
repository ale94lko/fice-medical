import { toTestId } from 'src/utils/base.js'

export const consentTemplateListTestIds = {
  page: 'consent-template-list-page',
  search: 'consent-template-list-search',
  add: 'consent-template-list-btn-add',
  rowView: id => toTestId('consent-template-row', id, 'view'),
  rowEdit: id => toTestId('consent-template-row', id, 'edit'),
  rowDelete: id => toTestId('consent-template-row', id, 'delete'),
}

export const consentTemplateDialogTestIds = {
  dialog: 'consent-template-dialog',
  field: name => toTestId('consent-template-field', name),
  save: 'consent-template-btn-save',
  addVersion: 'consent-template-btn-add-version',
  versionEdit: id => toTestId('consent-template-version', id, 'edit'),
  versionPublish: id => toTestId('consent-template-version', id, 'publish'),
  versionPreview: id => toTestId('consent-template-version', id, 'preview'),
  versionDelete: id => toTestId('consent-template-version', id, 'delete'),
}

export const consentVersionDialogTestIds = {
  dialog: 'consent-version-dialog',
  field: name => toTestId('consent-version-field', name),
  save: 'consent-version-btn-save',
  preview: 'consent-version-btn-preview',
  contentPreviewDialog: 'consent-content-preview',
}

export const clientConsentsTestIds = {
  root: 'client-consents',
  table: 'client-consents-table',
  btnAssign: 'client-consents-btn-assign',
  btnView: id => toTestId('client-consent-btn', id, 'view'),
  btnSign: id => toTestId('client-consent-btn', id, 'sign'),
  btnDecline: id => toTestId('client-consent-btn', id, 'decline'),
  btnCancel: id => toTestId('client-consent-btn', id, 'cancel'),
  btnRevoke: id => toTestId('client-consent-btn', id, 'revoke'),
  btnDownload: id => toTestId('client-consent-btn', id, 'download'),
  btnPrint: id => toTestId('client-consent-btn', id, 'print'),
  btnPrintPaper: 'client-consent-sign-btn-print',
  paperScanUpload: 'client-consent-sign-paper-scan',
  assignDialog: 'client-consent-assign',
  viewDialog: 'client-consent-view',
  signDialog: 'client-consent-sign',
  revokeDialog: 'client-consent-revoke',
  assignCancel: 'client-consent-assign-btn-cancel',
  assignSubmit: 'client-consent-assign-btn-submit',
  viewClose: 'client-consent-view-btn-close',
  signCancel: 'client-consent-sign-btn-cancel',
  signContinue: 'client-consent-sign-btn-continue',
  signCapture: 'client-consent-sign-btn-capture',
  signComplete: 'client-consent-sign-btn-complete',
  signCopyLink: 'client-consent-sign-btn-copy-link',
  revokeCancel: 'client-consent-revoke-btn-cancel',
  revokeSubmit: 'client-consent-revoke-btn-submit',
  paperScanRemove: 'client-consent-paper-scan-btn-remove',
}
