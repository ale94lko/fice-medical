/* eslint-disable camelcase -- mock persistence mirrors API snake_case */
import { buildLabSeedForPatient } from 'src/data/lab-orders-seed.js'
import { labStatuses } from 'components/constants.js'
import {
  computeLabAbnormalResult,
  nextLocalId,
  suggestFlagFromReference,
} from 'src/utils/lab-orders.js'
import {
  normalizeLabDetail,
  normalizeLabSummary,
} from 'src/utils/lab-normalize.js'

const STORAGE_KEY = 'fice-lab-mock-v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { labsByPatient: {}, seededPatients: {} }
    }
    const parsed = JSON.parse(raw)

    return {
      labsByPatient: parsed?.labsByPatient ?? {},
      seededPatients: parsed?.seededPatients ?? {},
    }
  } catch {
    return { labsByPatient: {}, seededPatients: {} }
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function ensurePatientLabs(state, patientId) {
  const pid = String(patientId).trim()
  if (!state.labsByPatient[pid]) {
    state.labsByPatient[pid] = []
  }
  if (!state.seededPatients[pid]) {
    state.labsByPatient[pid] = buildLabSeedForPatient(pid)
    state.seededPatients[pid] = true
    saveState(state)
  }

  return state.labsByPatient[pid]
}

function findLabRecord(state, patientId, labId) {
  const list = state.labsByPatient[String(patientId)] ?? []

  return list.find(
    item => String(item.id) === String(labId) && !item.deleted_at,
  ) ?? null
}

function applyComponentFlags(components) {
  return (components ?? []).map(c => {
    if (c.deleted_at || c.deletedAt) {
      return c
    }
    const suggested = suggestFlagFromReference(
      c.value,
      c.reference_range_low ?? c.referenceRangeLow,
      c.reference_range_high ?? c.referenceRangeHigh,
    )
    if (!c.flag && suggested) {
      return { ...c, flag: suggested }
    }

    return c
  })
}

function finalizeLabRecord(record) {
  const components = applyComponentFlags(record.components ?? [])
  record.components = components
  record.abnormal_result = computeLabAbnormalResult(
    components.map(c => ({
      flag: c.flag,
      abnormalIndicator: c.abnormal_indicator,
      deletedAt: c.deleted_at,
    })),
    record.abnormal_result_manual,
  )

  return record
}

export function mockListPatientLabs(patientId) {
  const state = loadState()
  const list = ensurePatientLabs(state, patientId)

  return list
    .filter(item => !item.deleted_at)
    .map(item => normalizeLabSummary(finalizeLabRecord({ ...item })))
}

export function mockGetPatientLab(patientId, labId) {
  const state = loadState()
  ensurePatientLabs(state, patientId)
  const record = findLabRecord(state, patientId, labId)
  if (!record) {
    throw new Error('Lab not found for patient')
  }

  return normalizeLabDetail(finalizeLabRecord({ ...record }))
}

export function mockCreatePatientLab(patientId, payload) {
  const state = loadState()
  const pid = String(patientId).trim()
  ensurePatientLabs(state, pid)
  const record = finalizeLabRecord({
    id: nextLocalId('lab'),
    patient_id: pid,
    test_name: payload.testName,
    category: payload.category,
    ordering_clinician_id: payload.orderingClinicianId,
    ordering_clinician_name: payload.orderingClinicianName,
    status: payload.status ?? labStatuses.draft,
    ordered_date: payload.orderedDate,
    priority: payload.priority,
    specimen_type: payload.specimenType,
    collected_date: payload.collectedDate,
    collection_location: payload.collectionLocation,
    result_date: payload.resultDate,
    abnormal_result_manual: payload.abnormalResultManual,
    reviewed_by: payload.reviewedBy,
    reviewed_date: payload.reviewedDate,
    result_summary: payload.resultSummary,
    components: [],
    attachments: [],
  })
  state.labsByPatient[pid].unshift(record)
  saveState(state)

  return {
    labId: record.id,
    status: record.status,
  }
}

export function mockSavePatientLab(
  patientId,
  labId,
  payload,
  { asDraft = false } = {},
) {
  const state = loadState()
  const record = findLabRecord(state, patientId, labId)
  if (!record) {
    throw new Error('Lab not found for patient')
  }
  if (String(record.patient_id) !== String(patientId).trim()) {
    throw new Error('Lab does not belong to patient')
  }
  Object.assign(record, {
    test_name: payload.testName ?? record.test_name,
    category: payload.category ?? record.category,
    ordering_clinician_id: payload.orderingClinicianId
      ?? record.ordering_clinician_id,
    ordering_clinician_name: payload.orderingClinicianName
      ?? record.ordering_clinician_name,
    status: asDraft ? labStatuses.draft : (payload.status ?? record.status),
    ordered_date: payload.orderedDate ?? record.ordered_date,
    priority: payload.priority ?? record.priority,
    specimen_type: payload.specimenType ?? record.specimen_type,
    collected_date: payload.collectedDate ?? record.collected_date,
    collection_location: payload.collectionLocation
      ?? record.collection_location,
    result_date: payload.resultDate ?? record.result_date,
    abnormal_result_manual: payload.abnormalResultManual
      ?? record.abnormal_result_manual,
    reviewed_by: payload.reviewedBy ?? record.reviewed_by,
    reviewed_date: payload.reviewedDate ?? record.reviewed_date,
    result_summary: payload.resultSummary ?? record.result_summary,
    components: (payload.components ?? []).map(c => ({
      id: c.id || nextLocalId('cmp'),
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
      deleted_at: c.deletedAt,
    })),
  })
  finalizeLabRecord(record)
  saveState(state)

  return normalizeLabDetail(record)
}

export function mockSoftDeletePatientLab(patientId, labId) {
  const state = loadState()
  const record = findLabRecord(state, patientId, labId)
  if (!record) {
    throw new Error('Lab not found for patient')
  }
  record.deleted_at = new Date().toISOString()
  saveState(state)
}

export function mockAddLabAttachment(patientId, labId, fileMeta) {
  const state = loadState()
  const record = findLabRecord(state, patientId, labId)
  if (!record) {
    throw new Error('Lab not found for patient')
  }
  if (!record.attachments) {
    record.attachments = []
  }
  const attachment = {
    id: nextLocalId('att'),
    name: fileMeta.name,
    mime_type: fileMeta.mimeType,
    size: fileMeta.size,
    uploaded_at: new Date().toISOString(),
    data_url: fileMeta.dataUrl,
  }
  record.attachments.push(attachment)
  saveState(state)

  return normalizeLabDetail(finalizeLabRecord(record)).attachments
}

export function mockGetLabAttachmentBlob(patientId, labId, attachmentId) {
  const state = loadState()
  const record = findLabRecord(state, patientId, labId)
  if (!record) {
    throw new Error('Lab not found for patient')
  }
  const attachment = (record.attachments ?? []).find(
    item => String(item.id) === String(attachmentId) && !item.deleted_at,
  )
  if (!attachment) {
    throw new Error('Attachment not found for lab')
  }

  return {
    name: attachment.name,
    mimeType: attachment.mime_type,
    dataUrl: attachment.data_url,
  }
}

export function mockSoftDeleteLabAttachment(
  patientId,
  labId,
  attachmentId,
) {
  const state = loadState()
  const record = findLabRecord(state, patientId, labId)
  if (!record) {
    throw new Error('Lab not found for patient')
  }
  const attachment = (record.attachments ?? []).find(
    item => String(item.id) === String(attachmentId),
  )
  if (!attachment) {
    throw new Error('Attachment not found for lab')
  }
  attachment.deleted_at = new Date().toISOString()
  saveState(state)
}
