import {
  labAbnormalValues,
  labStatuses,
} from 'components/constants.js'
import { cloneLab, computeLabAbnormalResult } from 'src/utils/lab-orders.js'
import { isoDateToUsDateString, usDateToIso } from 'src/utils/client-form.js'
import {
  mapStoredFilesList,
  normalizeStoredFile,
} from 'src/utils/stored-file-normalize.js'

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

/** API enums: BLOOD_TEST, ORDERED, LOW, CRITICAL_LOW, … */
export function toLabApiEnum(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }

  return raw.replace(/[\s-]+/g, '_').toUpperCase()
}

/** Numeric server ids only (skips local ids like lab-…). */
export function parseLabApiEntityId(value) {
  if (value == null || value === '') {
    return null
  }
  const raw = String(value).trim()
  if (!/^\d+$/.test(raw)) {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) && n > 0 ? n : null
}

function trimOrNull(value) {
  const text = String(value ?? '').trim()

  return text || null
}

export function normalizeLabFile(raw) {
  return normalizeStoredFile(raw)
}

/** @deprecated use normalizeLabFile */
export function normalizeLabAttachment(raw) {
  return normalizeLabFile(raw)
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
    flag: toLabApiEnum(c.flag),
    resultDate: isoDateToUsDateString(
      c.result_date ?? c.resultDate ?? '',
    ),
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
    testName: String(
      l.lab_name ?? l.labName ?? l.test_name ?? l.testName ?? '',
    ).trim(),
    category: toLabApiEnum(l.category),
    orderedDate: isoDateToUsDateString(
      l.ordered_date ?? l.orderedDate ?? '',
    ),
    collectedDate: String(
      isoDateToUsDateString(l.collected_date ?? l.collectedDate ?? ''),
    ).trim() || null,
    resultDate: String(
      isoDateToUsDateString(l.result_date ?? l.resultDate ?? ''),
    ).trim() || null,
    status: toLabApiEnum(l.status) || labStatuses.draft,
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
  const files = mapStoredFilesList(l.files ?? l.attachments ?? [])

  return {
    ...normalizeLabSummary(l),
    orderingClinicianId: String(
      l.ordering_clinician_id ?? l.orderingClinicianId ?? '',
    ).trim() || null,
    orderingClinicianName: String(
      l.ordering_clinician_name ?? l.orderingClinicianName ?? '',
    ).trim() || null,
    priority: toLabApiEnum(l.priority),
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
    reviewedDate: isoDateToUsDateString(
      l.reviewed_date ?? l.reviewedDate ?? '',
    ) || null,
    resultSummary: String(
      l.result_summary ?? l.resultSummary ?? '',
    ).trim() || null,
    components,
    files,
    attachments: files,
  }
}

function resolveAbnormalResult(lab) {
  if (typeof lab?.abnormalResult === 'boolean') {
    return lab.abnormalResult
  }

  return computeLabAbnormalResult(
    lab?.components ?? [],
    lab?.abnormalResultManual,
  )
}

function mapComponentToApiPayload(component) {
  /* eslint-disable camelcase -- API snake_case */
  const payload = {
    component_name: component.componentName,
    clinical_key: component.clinicalKey,
    value: component.value,
    unit: component.unit,
    reference_range_low: component.referenceRangeLow,
    reference_range_high: component.referenceRangeHigh,
    reference_range_unit: component.referenceRangeUnit,
    flag: toLabApiEnum(component.flag),
    result_date: usDateToIso(component.resultDate) || null,
    result_time: component.resultTime,
    notes: component.notes,
    abnormal_indicator: component.abnormalIndicator,
  }
  /* eslint-enable camelcase */
  const id = parseLabApiEntityId(component.id)
  if (id != null) {
    payload.id = id
  }

  return payload
}

export function labToApiPayload(lab, { draft = false } = {}) {
  /* eslint-disable camelcase -- API snake_case */
  const status = draft
    ? labStatuses.draft
    : (toLabApiEnum(lab.status) || labStatuses.ordered)
  const body = {
    lab_name: trimOrNull(lab.testName),
    category: toLabApiEnum(lab.category),
    ordering_clinician_id: lab.orderingClinicianId,
    status,
    ordered_date: usDateToIso(lab.orderedDate) || null,
    priority: toLabApiEnum(lab.priority),
    specimen_type: lab.specimenType,
    collected_date: usDateToIso(lab.collectedDate) || null,
    collection_location: lab.collectionLocation,
    result_date: usDateToIso(lab.resultDate) || null,
    abnormal_result: resolveAbnormalResult(lab),
    abnormal_result_manual: lab.abnormalResultManual,
    reviewed_by: lab.reviewedBy,
    reviewed_date: usDateToIso(lab.reviewedDate) || null,
    result_summary: lab.resultSummary,
    components: (lab.components ?? [])
      .filter(c => !c.deletedAt)
      .map(mapComponentToApiPayload),
  }
  const id = parseLabApiEntityId(lab.id)
  if (id != null) {
    body.id = id
  }

  return body
}

/**
 * Maps labs from GET client (or list endpoint) into the in-app lab order shape.
 */
export function mapClientLabsListFromApi(rawList) {
  const list = Array.isArray(rawList) ? rawList : []

  return list.map(raw => {
    const detail = normalizeLabDetail(raw)
    const copy = cloneLab(detail)
    copy.abnormalResult = computeLabAbnormalResult(
      copy.components ?? [],
      copy.abnormalResultManual,
    )

    return { ...copy, abnormalResult: copy.abnormalResult }
  })
}
