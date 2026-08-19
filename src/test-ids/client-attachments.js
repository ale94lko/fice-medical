import { toTestId } from 'src/utils/base.js'

export const clientAttachmentsTestIds = {
  root: 'client-attachments',
  btnAdd: 'client-attachments-btn-add',
  btnRefresh: 'client-attachments-btn-refresh',
  actionsMenu: 'client-attachments-btn-actions-menu',
  filterCategory: 'client-attachments-filter-category',
  filterEntityType: 'client-attachments-filter-entity-type',
  table: 'client-attachments-table',
  rowPreview: id => toTestId('client-attachments-row', id, 'preview'),
  rowDownload: id => toTestId('client-attachments-row', id, 'download'),
  rowSource: id => toTestId('client-attachments-row', id, 'source'),
  rowDelete: id => toTestId('client-attachments-row', id, 'delete'),
  uploadDialog: 'client-attachment-upload',
  uploadFile: 'client-attachment-upload-file',
  uploadName: 'client-attachment-upload-name',
  uploadCategory: 'client-attachment-upload-category',
  uploadSubmit: 'client-attachment-upload-submit',
  previewDialog: 'client-attachment-preview',
  deleteConfirm: 'client-attachment-delete',
}
