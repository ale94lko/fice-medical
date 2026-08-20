/* eslint-disable camelcase -- API payloads use snake_case */
import {
  diagnosticStudyResultStatuses,
  diagnosticStudyStatuses,
} from 'components/constants.js'
import { isoDateToUsDateString, usDateToIso } from
  'src/utils/client-form.js'
import {
  cloneDiagnosticStudy,
  sortDiagnosticStudiesDesc,
} from 'src/utils/diagnostic-study-orders.js'

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function firstText(...values) {
  for (const value of values) {
    if (value == null) {
      continue
    }
    const text = String(value).trim()
    if (text) {
      return text
    }
  }

  return ''
}

function toUsDate(value) {
  return isoDateToUsDateString(value) || firstText(value)
}

function toIsoDate(value) {
  return usDateToIso(value) || firstText(value) || null
}

export function toDiagnosticStudyApiEnum(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  return raw.replace(/[\s-]+/g, '_').toUpperCase()
}

export function normalizeDiagnosticStudy(raw = {}) {
  const status = toDiagnosticStudyApiEnum(
    raw.status,
  ) || diagnosticStudyStatuses.ordered
  const resultStatus = toDiagnosticStudyApiEnum(
    raw.result_status ?? raw.resultStatus,
  ) || diagnosticStudyResultStatuses.pending

  return cloneDiagnosticStudy({
    id: parseOptionalNumber(raw.id),
    version: parseOptionalNumber(raw.version) ?? 0,
    clientId: parseOptionalNumber(
      raw.client_id ?? raw.clientId,
    ),
    orderingEncounterId: parseOptionalNumber(
      raw.ordering_encounter_id ?? raw.orderingEncounterId,
    ),
    documentedEncounterId: parseOptionalNumber(
      raw.documented_encounter_id ?? raw.documentedEncounterId,
    ),
    reviewedEncounterId: parseOptionalNumber(
      raw.reviewed_encounter_id ?? raw.reviewedEncounterId,
    ),
    source: toDiagnosticStudyApiEnum(raw.source),
    studyName: firstText(raw.study_name, raw.studyName),
    studyType: toDiagnosticStudyApiEnum(
      raw.study_type ?? raw.studyType,
    ),
    reasonIndication: firstText(
      raw.reason_indication,
      raw.reasonIndication,
    ),
    orderedDate: toUsDate(raw.ordered_date ?? raw.orderedDate),
    orderedBy: parseOptionalNumber(
      raw.ordered_by ?? raw.orderedBy,
    ),
    orderedByName: firstText(
      raw.ordered_by_name,
      raw.orderedByName,
    ),
    studyDate: toUsDate(raw.study_date ?? raw.studyDate),
    status,
    resultStatus,
    resultDate: toUsDate(raw.result_date ?? raw.resultDate),
    findings: firstText(raw.findings),
    providerInterpretation: firstText(
      raw.provider_interpretation,
      raw.providerInterpretation,
    ),
    reviewedAt: firstText(raw.reviewed_at, raw.reviewedAt),
    reviewedBy: parseOptionalNumber(
      raw.reviewed_by ?? raw.reviewedBy,
    ),
    reviewedByName: firstText(
      raw.reviewed_by_name,
      raw.reviewedByName,
    ),
    sourceDocumentId: parseOptionalNumber(
      raw.source_document_id ?? raw.sourceDocumentId,
    ),
    sourceDocumentName: firstText(
      raw.source_document_name,
      raw.sourceDocumentName,
    ),
    createdAt: firstText(raw.created_at, raw.createdAt),
    updatedAt: firstText(raw.updated_at, raw.updatedAt),
  })
}

export function mapDiagnosticStudiesListFromApi(list) {
  const rows = Array.isArray(list) ? list : []

  return sortDiagnosticStudiesDesc(
    rows.map(item => normalizeDiagnosticStudy(item)),
  )
}

function optionalIso(value) {
  const iso = toIsoDate(value)

  return iso || undefined
}

export function diagnosticStudyToOrderPayload(row = {}) {
  return {
    study_name: firstText(row.studyName),
    study_type: toDiagnosticStudyApiEnum(row.studyType) || undefined,
    reason_indication: firstText(row.reasonIndication) || undefined,
  }
}

export function diagnosticStudyToExistingPayload(row = {}) {
  return {
    study_name: firstText(row.studyName),
    study_type: toDiagnosticStudyApiEnum(row.studyType) || undefined,
    study_date: optionalIso(row.studyDate),
    result_date: optionalIso(row.resultDate),
    findings: firstText(row.findings),
    provider_interpretation:
      firstText(row.providerInterpretation) || undefined,
    source_document_id: parseOptionalNumber(row.sourceDocumentId)
      || undefined,
    mark_as_reviewed: Boolean(row.markAsReviewed) || undefined,
  }
}

export function diagnosticStudyToCompletePayload(row = {}) {
  return {
    version: parseOptionalNumber(row.version) ?? 0,
    study_date: optionalIso(row.studyDate),
  }
}

export function diagnosticStudyToResultPayload(row = {}) {
  return {
    version: parseOptionalNumber(row.version) ?? 0,
    findings: firstText(row.findings),
    result_date: optionalIso(row.resultDate),
    study_date: optionalIso(row.studyDate),
    source_document_id: parseOptionalNumber(row.sourceDocumentId)
      || undefined,
  }
}

export function diagnosticStudyToReviewPayload(row = {}) {
  return {
    version: parseOptionalNumber(row.version) ?? 0,
    provider_interpretation:
      firstText(row.providerInterpretation) || undefined,
  }
}

export function diagnosticStudyToPatchPayload(row = {}) {
  return {
    version: parseOptionalNumber(row.version) ?? 0,
    study_name: firstText(row.studyName) || undefined,
    study_type: toDiagnosticStudyApiEnum(row.studyType) || undefined,
    reason_indication: firstText(row.reasonIndication) || undefined,
    study_date: optionalIso(row.studyDate),
    findings: firstText(row.findings) || undefined,
    result_date: optionalIso(row.resultDate),
    provider_interpretation:
      firstText(row.providerInterpretation) || undefined,
  }
}

export function diagnosticStudyToCancelPayload(row = {}) {
  return {
    version: parseOptionalNumber(row.version) ?? 0,
  }
}
