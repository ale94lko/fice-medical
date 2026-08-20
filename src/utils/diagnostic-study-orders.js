import {
  diagnosticStudyDialogModes,
  diagnosticStudyResultStatuses,
  diagnosticStudyStatuses,
  diagnosticStudyTypes,
} from 'components/constants.js'

export const diagnosticStudyTypeValues = Object.values(
  diagnosticStudyTypes,
)

export function cloneDiagnosticStudy(row = {}) {
  return {
    id: row.id ?? null,
    version: row.version ?? 0,
    clientId: row.clientId ?? null,
    orderingEncounterId: row.orderingEncounterId ?? null,
    documentedEncounterId: row.documentedEncounterId ?? null,
    reviewedEncounterId: row.reviewedEncounterId ?? null,
    source: row.source ?? '',
    studyName: row.studyName ?? '',
    studyType: row.studyType ?? '',
    reasonIndication: row.reasonIndication ?? '',
    orderedDate: row.orderedDate ?? '',
    orderedBy: row.orderedBy ?? null,
    orderedByName: row.orderedByName ?? '',
    studyDate: row.studyDate ?? '',
    status: row.status ?? diagnosticStudyStatuses.ordered,
    resultStatus: row.resultStatus
      ?? diagnosticStudyResultStatuses.pending,
    resultDate: row.resultDate ?? '',
    findings: row.findings ?? '',
    providerInterpretation: row.providerInterpretation ?? '',
    reviewedAt: row.reviewedAt ?? '',
    reviewedBy: row.reviewedBy ?? null,
    reviewedByName: row.reviewedByName ?? '',
    sourceDocumentId: row.sourceDocumentId ?? null,
    sourceDocumentName: row.sourceDocumentName ?? '',
    markAsReviewed: Boolean(row.markAsReviewed),
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}

export function createEmptyDiagnosticStudy() {
  return cloneDiagnosticStudy()
}

export function sortDiagnosticStudiesDesc(rows = []) {
  return [...rows].sort((a, b) => {
    const da = Date.parse(a?.orderedDate || a?.studyDate || 0) || 0
    const db = Date.parse(b?.orderedDate || b?.studyDate || 0) || 0
    if (db !== da) {
      return db - da
    }

    return Number(b?.id || 0) - Number(a?.id || 0)
  })
}

export function isOrderedPending(row) {
  return row?.status === diagnosticStudyStatuses.ordered
    && row?.resultStatus === diagnosticStudyResultStatuses.pending
}

export function isCompletedPending(row) {
  return row?.status === diagnosticStudyStatuses.completed
    && row?.resultStatus === diagnosticStudyResultStatuses.pending
}

export function isCompletedAvailable(row) {
  return row?.status === diagnosticStudyStatuses.completed
    && row?.resultStatus === diagnosticStudyResultStatuses.available
}

export function isCompletedReviewed(row) {
  return row?.status === diagnosticStudyStatuses.completed
    && row?.resultStatus === diagnosticStudyResultStatuses.reviewed
}

export function canMarkDiagnosticStudyCompleted(row) {
  return isOrderedPending(row)
}

export function canAddDiagnosticStudyResult(row) {
  return isOrderedPending(row) || isCompletedPending(row)
}

export function canReviewDiagnosticStudy(row) {
  return isCompletedAvailable(row)
}

export function canCancelDiagnosticStudy(row) {
  return isOrderedPending(row)
}

export function canEditDiagnosticStudy(row) {
  return isOrderedPending(row) || isCompletedAvailable(row)
}

export function hasSourceDocument(row) {
  return Boolean(row?.sourceDocumentId || row?.sourceDocumentName)
}

export function emptyDiagnosticStudyDraft(mode) {
  const draft = createEmptyDiagnosticStudy()
  if (mode === diagnosticStudyDialogModes.existing) {
    draft.status = diagnosticStudyStatuses.completed
    draft.resultStatus = diagnosticStudyResultStatuses.available
  }

  return draft
}
