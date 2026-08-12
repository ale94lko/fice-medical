import { toTestId, withTestIdPrefix } from 'src/utils/base.js'

export const aiTestIds = {
  generateDialog: 'ai-generate-dialog',
  reviewPanel: 'ai-suggestion-review-panel',
  framingBanner: 'ai-framing-banner',
  provenance: 'ai-provenance',
  statusBadge: 'ai-status-badge',
  btnGenerate: 'ai-btn-generate',
  btnEdit: 'ai-btn-edit',
  btnAccept: 'ai-btn-accept',
  btnAcceptCommit: 'ai-btn-accept-commit',
  btnReject: 'ai-btn-reject',
  btnClose: 'ai-btn-close',
  commitConfirm: 'ai-commit-confirm',
  rejectDialog: 'ai-reject-dialog',
  rejectReason: 'ai-reject-reason',
  notDocumentedWarning: 'ai-not-documented-warning',
  committedBadge: 'ai-committed-badge',
  featureBtn: feature => toTestId('ai-btn', feature),
  field: name => withTestIdPrefix('ai', 'field', name),
  configPage: 'ai-config-page',
  configSave: 'ai-config-btn-save',
}
