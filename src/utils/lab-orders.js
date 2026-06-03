import {
  labAbnormalValues,
  labCategories,
  labClinicalKeys,
  labFlags,
  labMaxComponentNotesLength,
  labMaxResultSummaryLength,
  labStatuses,
} from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'

export const LAB_TEST_OPTIONS = [
  {
    label: 'Complete Blood Count (CBC)',
    value: 'Complete Blood Count (CBC)',
    category: labCategories.bloodTest,
  },
  {
    label: 'Hemoglobin A1C',
    value: 'Hemoglobin A1C',
    category: labCategories.bloodTest,
    clinicalKey: labClinicalKeys.a1c,
  },
  {
    label: 'Comprehensive Metabolic Panel',
    value: 'Comprehensive Metabolic Panel',
    category: labCategories.bloodTest,
  },
  {
    label: 'Urinalysis',
    value: 'Urinalysis',
    category: labCategories.urineTest,
  },
  {
    label: 'Chest X-Ray',
    value: 'Chest X-Ray',
    category: labCategories.imaging,
  },
]

export const LAB_COMPONENT_OPTIONS = [
  { label: 'Hemoglobin', value: 'Hemoglobin', clinicalKey: labClinicalKeys.hemoglobin },
  { label: 'WBC', value: 'WBC', clinicalKey: labClinicalKeys.wbc },
  { label: 'Platelets', value: 'Platelets', clinicalKey: labClinicalKeys.platelets },
  { label: 'Hemoglobin A1C', value: 'Hemoglobin A1C', clinicalKey: labClinicalKeys.a1c },
  { label: 'Glucose', value: 'Glucose', clinicalKey: 'glucose' },
]

export function createEmptyLabOrder() {
  return {
    id: '',
    patientId: '',
    testName: '',
    category: null,
    orderingClinicianId: null,
    orderingClinicianName: null,
    status: labStatuses.ordered,
    orderedDate: todayDateUs(),
    priority: null,
    specimenType: null,
    collectedDate: null,
    collectionLocation: null,
    resultDate: null,
    abnormalResult: false,
    abnormalResultManual: null,
    reviewedBy: null,
    reviewedDate: null,
    resultSummary: '',
    components: [],
    attachments: [],
    deletedAt: null,
  }
}

export function createEmptyLabComponent() {
  return {
    id: '',
    componentName: '',
    clinicalKey: null,
    value: '',
    unit: null,
    referenceRangeLow: null,
    referenceRangeHigh: null,
    referenceRangeUnit: null,
    flag: null,
    resultDate: todayDateUs(),
    resultTime: null,
    notes: '',
    abnormalIndicator: null,
    deletedAt: null,
  }
}

export function nextLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function isAbnormalFlag(flag) {
  const f = String(flag ?? '').trim().toLowerCase()
  if (!f || f === labFlags.normal) {
    return false
  }

  return true
}

export function suggestFlagFromReference(value, low, high) {
  const num = Number(value)
  const lowN = Number(low)
  const highN = Number(high)
  if (!Number.isFinite(num) || !Number.isFinite(lowN) || !Number.isFinite(highN)) {
    return null
  }
  if (num < lowN) {
    const span = highN - lowN
    if (span > 0 && num < lowN - span * 0.25) {
      return labFlags.criticalLow
    }

    return labFlags.low
  }
  if (num > highN) {
    const span = highN - lowN
    if (span > 0 && num > highN + span * 0.25) {
      return labFlags.criticalHigh
    }

    return labFlags.high
  }

  return labFlags.normal
}

export function computeLabAbnormalResult(components, manualValue) {
  if (manualValue === labAbnormalValues.yes) {
    return true
  }
  if (manualValue === labAbnormalValues.no) {
    return false
  }
  for (const c of components ?? []) {
    if (c.deletedAt) {
      continue
    }
    if (isAbnormalFlag(c.flag)) {
      return true
    }
    if (c.abnormalIndicator === labAbnormalValues.yes) {
      return true
    }
  }

  return false
}

export function formatReferenceRange(low, high, unit) {
  const hasLow = low != null && low !== ''
  const hasHigh = high != null && high !== ''
  if (!hasLow && !hasHigh) {
    return '—'
  }
  const range = `${hasLow ? low : '—'} - ${hasHigh ? high : '—'}`
  const u = String(unit ?? '').trim()

  return u ? `${range} ${u}` : range
}

export function resolveClinicalKeyForComponent(name) {
  const needle = String(name ?? '').trim().toLowerCase()
  const found = LAB_COMPONENT_OPTIONS.find(
    item => item.value.toLowerCase() === needle
      || item.label.toLowerCase() === needle,
  )

  return found?.clinicalKey ?? null
}

export function visibleLabs(list) {
  return (list ?? []).filter(item => !item.deletedAt)
}

export function visibleComponents(list) {
  return (list ?? []).filter(item => !item.deletedAt)
}

export function parseUsDateToSortable(dateStr) {
  const s = String(dateStr ?? '').trim()
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (!m) {
    return 0
  }

  return Number(`${m[3]}${m[1].padStart(2, '0')}${m[2].padStart(2, '0')}`)
}

export function filterLabs(list, filters = {}) {
  const search = String(filters.search ?? '').trim().toLowerCase()
  const status = String(filters.status ?? '').trim().toLowerCase()
  const category = String(filters.category ?? '').trim().toLowerCase()
  const dateFrom = parseUsDateToSortable(filters.dateFrom)
  const dateTo = parseUsDateToSortable(filters.dateTo)

  return visibleLabs(list).filter(row => {
    if (search && !String(row.testName ?? '').toLowerCase().includes(search)) {
      return false
    }
    if (status && row.status !== status) {
      return false
    }
    if (category && row.category !== category) {
      return false
    }
    const ordered = parseUsDateToSortable(row.orderedDate)
    if (dateFrom && ordered && ordered < dateFrom) {
      return false
    }
    if (dateTo && ordered && ordered > dateTo) {
      return false
    }

    return true
  })
}

export function validateLabOrder(lab, { requireComplete = false } = {}) {
  const errors = {}
  if (!String(lab?.testName ?? '').trim()) {
    errors.testName = true
  }
  if (!lab?.category) {
    errors.category = true
  }
  if (!lab?.orderingClinicianId) {
    errors.orderingClinicianId = true
  }
  if (!lab?.status) {
    errors.status = true
  }
  if (!String(lab?.orderedDate ?? '').trim()) {
    errors.orderedDate = true
  }
  if (requireComplete && lab?.status === labStatuses.draft) {
    errors.status = true
  }
  const summary = String(lab?.resultSummary ?? '')
  if (summary.length > labMaxResultSummaryLength) {
    errors.resultSummary = true
  }

  return errors
}

export function validateLabComponent(component) {
  const errors = {}
  if (!String(component?.componentName ?? '').trim()) {
    errors.componentName = true
  }
  if (component?.value === '' || component?.value == null) {
    errors.value = true
  }
  if (!String(component?.resultDate ?? '').trim()) {
    errors.resultDate = true
  }
  const notes = String(component?.notes ?? '')
  if (notes.length > labMaxComponentNotesLength) {
    errors.notes = true
  }

  return errors
}

export function cloneLab(lab) {
  return JSON.parse(JSON.stringify(lab ?? createEmptyLabOrder()))
}

export function categoryForTestName(testName) {
  const found = LAB_TEST_OPTIONS.find(
    item => item.value === testName || item.label === testName,
  )

  return found?.category ?? null
}
