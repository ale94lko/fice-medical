import { toTestId } from 'src/utils/base.js'

export const staffFormTestIds = {
  page: 'staff-form-page',
  tab: name => toTestId('staff-form-tab', name),
  save: 'staff-form-btn-save',
  close: 'staff-form-btn-close',
  next: 'staff-form-btn-next',
  previous: 'staff-form-btn-previous',
  field: name => toTestId('staff-form-field', name),
  npiInput: 'staff-form-field-npi',
  npiSearch: 'staff-form-btn-npi-search',
  addCompensation: 'staff-form-btn-add-compensation',
  compensationRowDelete: id => toTestId(
    'staff-compensation-row',
    id,
    'btn-delete',
  ),
  addTaxonomy: 'staff-form-btn-add-taxonomy',
  taxonomyRowDelete: id => toTestId(
    'staff-taxonomy-row',
    id,
    'btn-delete',
  ),
  taxonomyDialog: 'staff-taxonomy-dialog',
  taxonomyField: name => toTestId('staff-taxonomy-field', name),
  taxonomyCancel: 'staff-taxonomy-dialog-btn-cancel',
  taxonomySave: 'staff-taxonomy-dialog-btn-save',
  copyEmail: 'staff-profile-btn-copy-email',
  edit: 'staff-profile-btn-edit',
}
