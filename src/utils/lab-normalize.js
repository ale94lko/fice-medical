import {
  labAbnormalValues,
  labStatuses,
} from 'components/constants.js'

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function parseOptionalBool(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false
  }
  if (value === labAbnormalValues.yes) {
    return true
  }
  if (value === labAbnormalValues.no) {
    return false
  }

  return null
}

export function normalizeLabAttachment(raw) {
  const a = raw ?? {}

  return {
    id: String(a.id ?? a.attachment_id ?? '').trim(),
    name: String(a.name ?? a.file_name ?? '').trim(),
    mimeType: String(a.mime_type ?? a.mimeType ?? '').trim() || null,
    size: Number(a.size ?? 0) || 0,
    uploadedAt: a.uploaded_at ?? a.uploadedAt ?? null,
    deletedAt: a.deleted_at ?? a.deletedAt ?? null,
  }
}

export function normalizeLabComponent(raw) {
  const c = raw ?? {}

  return {
    id: String(c.id ?? c.component_id ?? '').trim(),
    componentName: String(
      c.component_name ?? c.componentName ?? '',
    ).trim(),
    clinicalKey: String(c.clinical_key ?? c.clinicalKey ?? '').trim()
      || null,
    value: c.value ?? '',
    unit: String(c.unit ?? '').trim() || null,
    referenceRangeLow: parseOptionalNumber(
      c.reference_range_low ?? c.referenceRangeLow,
    ),
    referenceRangeHigh: parseOptionalNumber(
      c.reference_range_high ?? c.referenceRangeHigh,
    ),
    referenceRangeUnit: String(
      c.reference_range_unit ?? c.referenceRangeUnit ?? '',
    ).trim() || null,
    flag: String(c.flag ?? '').trim().toLowerCase() || null,
    resultDate: String(c.result_date ?? c.resultDate ?? '').trim(),
    resultTime: String(c.result_time ?? c.resultTime ?? '').trim() || null,
    notes: String(c.notes ?? '').trim() || null,
    abnormalIndicator: String(
      c.abnormal_indicator ?? c.abnormalIndicator ?? '',
    ).trim().toLowerCase() || null,
    deletedAt: c.deleted_at ?? c.deletedAt ?? null,
  }
}

export function normalizeLabSummary(raw) {
  const l = raw ?? {}

  return {
    id: String(l.id ?? l.lab_id ?? '').trim(),
    patientId: String(l.patient_id ?? l.patientId ?? '').trim(),
    testName: String(l.test_name ?? l.testName ?? '').trim(),
    category: String(l.category ?? '').trim().toLowerCase() || null,
    orderedDate: String(l.ordered_date ?? l.orderedDate ?? '').trim(),
    collectedDate: String(
      l.collected_date ?? l.collectedDate ?? '',
    ).trim() || null,
    resultDate: String(l.result_date ?? l.resultDate ?? '').trim() || null,
    status: String(l.status ?? labStatuses.draft).trim().toLowerCase(),
    abnormalResult: parseOptionalBool(
      l.abnormal_result ?? l.abnormalResult,
    ),
    deletedAt: l.deleted_at ?? l.deletedAt ?? null,
  }
}

export function normalizeLabDetail(raw) {
  const l = raw ?? {}
  const components = (l.components ?? [])
    .map(normalizeLabComponent)
    .filter(c => c.id && !c.deletedAt)
  const attachments = (l.attachments ?? [])
    .map(normalizeLabAttachment)
    .filter(a => a.id && !a.deletedAt)

  return {
    ...normalizeLabSummary(l),
    orderingClinicianId: String(
      l.ordering_clinician_id ?? l.orderingClinicianId ?? '',
    ).trim() || null,
    orderingClinicianName: String(
      l.ordering_clinician_name ?? l.orderingClinicianName ?? '',
    ).trim() || null,
    priority: String(l.priority ?? '').trim().toLowerCase() || null,
    specimenType: String(
      l.specimen_type ?? l.specimenType ?? '',
    ).trim() || null,
    collectionLocation: String(
      l.collection_location ?? l.collectionLocation ?? '',
    ).trim() || null,
    abnormalResultManual: String(
      l.abnormal_result_manual ?? l.abnormalResultManual ?? '',
    ).trim().toLowerCase() || null,
    reviewedBy: String(l.reviewed_by ?? l.reviewedBy ?? '').trim() || null,
    reviewedDate: String(
      l.reviewed_date ?? l.reviewedDate ?? '',
    ).trim() || null,
    resultSummary: String(
      l.result_summary ?? l.resultSummary ?? '',
    ).trim() || null,
    components,
    attachments,
  }
}

export function labToApiPayload(lab, { draft = false } = {}) {
  /* eslint-disable camelcase -- API snake_case */
  const body = {
    test_name: lab.testName,
    category: lab.category,
    ordering_clinician_id: lab.orderingClinicianId,
    status: draft ? labStatuses.draft : lab.status,
    ordered_date: lab.orderedDate,
    priority: lab.priority,
    specimen_type: lab.specimenType,
    collected_date: lab.collectedDate,
    collection_location: lab.collectionLocation,
    result_date: lab.resultDate,
    abnormal_result_manual: lab.abnormalResultManual,
    reviewed_by: lab.reviewedBy,
    reviewed_date: lab.reviewedDate,
    result_summary: lab.resultSummary,
    components: (lab.components ?? [])
      .filter(c => !c.deletedAt)
      .map(c => ({
        id: c.id || undefined,
        component_name: c.componentName,
        clinical_key: c.clinicalKey,
        value: c.value,
        unit: c.unit,
        reference_range_low: c.referenceRangeLow,
        reference_range_high: c.referenceRangeHigh,
        reference_range_unit: c.referenceRangeUnit,
        flag: c.flag,
        result_date: c.resultDate,
        result_time: c.resultTime,
        notes: c.notes,
        abnormal_indicator: c.abnormalIndicator,
      })),
  }

  return body
}
