import {
  labAbnormalValues,
  labCategories,
  labClinicalKeys,
  labFlags,
  labMaxComponentNotesLength,
  labMaxResultSummaryLength,
  labPriorities,
  labStatuses,
} from 'components/constants.js'
import {
  todayDateUs,
  parseUsDateString,
  startOfDay,
} from 'src/utils/client-form.js'

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
  {
    label: 'Hemoglobin',
    value: 'Hemoglobin',
    clinicalKey: labClinicalKeys.hemoglobin,
  },
  {
    label: 'WBC',
    value: 'WBC',
    clinicalKey: labClinicalKeys.wbc,
  },
  {
    label: 'Platelets',
    value: 'Platelets',
    clinicalKey: labClinicalKeys.platelets,
  },
  {
    label: 'Hemoglobin A1C',
    value: 'Hemoglobin A1C',
    clinicalKey: labClinicalKeys.a1c,
  },
  {
    label: 'Glucose',
    value: 'Glucose',
    clinicalKey: 'glucose',
  },
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
    priority: labPriorities.routine,
    specimenType: null,
    collectedDate: null,
    collectionLocation: null,
    resultDate: null,
    abnormalResult: null,
    abnormalResultManual: null,
    reviewedBy: null,
    reviewedDate: null,
    resultSummary: '',
    components: [],
    files: [],
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
    resultTime: nowTimeHms(),
    notes: '',
    abnormalIndicator: null,
    deletedAt: null,
  }
}

export function nextLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Current local time as HH:mm:ss (e.g. 23:00:58). */
export function nowTimeHms(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

/**
 * Formats digit input into HH:mm:ss (e.g. 230058 → 23:00:58).
 * Returns null for empty / invalid input.
 */
export function formatLabResultTimeInput(value) {
  const raw = String(value ?? '').replace(/_/g, '').trim()
  if (!raw || raw === '::') {
    return null
  }
  const digits = raw.replace(/\D/g, '').slice(0, 6)
  if (!digits) {
    return null
  }
  const padded = digits.padEnd(6, '0')
  const hours = Number(padded.slice(0, 2))
  const minutes = Number(padded.slice(2, 4))
  const seconds = Number(padded.slice(4, 6))
  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null
  }

  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`
}

function isUsDateAfterToday(usDate) {
  const parsed = parseUsDateString(usDate)
  if (!parsed) {
    return false
  }

  return parsed.getTime() > startOfDay(new Date()).getTime()
}

export function isAbnormalFlag(flag) {
  const f = String(flag ?? '').trim().toUpperCase()
  if (!f || f === labFlags.normal) {
    return false
  }

  return true
}

function isPresentNumber(value) {
  if (value == null || value === '') {
    return false
  }
  const n = Number(value)

  return Number.isFinite(n)
}

export function suggestFlagFromReference(value, low, high) {
  const num = Number(value)
  if (
    !Number.isFinite(num)
    || !isPresentNumber(low)
    || !isPresentNumber(high)
  ) {
    return null
  }
  const lowN = Number(low)
  const highN = Number(high)
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

  // Unset → null (Pending). false only when user/API says No.
  return null
}

export const labResultStatusValues = {
  pending: 'pending',
  normal: 'normal',
  abnormal: 'abnormal',
}

/**
 * Result Status for labs list/UI from Abnormal Result? (yes/no/empty).
 * Pending = null or field missing, Normal = false/No, Abnormal = true/Yes.
 */
export function resolveLabResultStatus(lab = {}) {
  const manual = String(lab.abnormalResultManual ?? '')
    .trim()
    .toLowerCase()
  if (manual === labAbnormalValues.yes) {
    return labResultStatusValues.abnormal
  }
  if (manual === labAbnormalValues.no) {
    return labResultStatusValues.normal
  }
  if (lab.abnormalResult === true) {
    return labResultStatusValues.abnormal
  }
  if (lab.abnormalResult === false) {
    return labResultStatusValues.normal
  }

  return labResultStatusValues.pending
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
    if (
      status
      && String(row.status ?? '').trim().toLowerCase() !== status
    ) {
      return false
    }
    if (
      category
      && String(row.category ?? '').trim().toLowerCase() !== category
    ) {
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
  } else if (isUsDateAfterToday(lab.orderedDate)) {
    errors.orderedDate = 'labDateNotFuture'
  }
  if (
    String(lab?.collectedDate ?? '').trim()
    && isUsDateAfterToday(lab.collectedDate)
  ) {
    errors.collectedDate = 'labDateNotFuture'
  }
  if (
    String(lab?.resultDate ?? '').trim()
    && isUsDateAfterToday(lab.resultDate)
  ) {
    errors.resultDate = 'labDateNotFuture'
  }
  if (
    String(lab?.reviewedDate ?? '').trim()
    && isUsDateAfterToday(lab.reviewedDate)
  ) {
    errors.reviewedDate = 'labDateNotFuture'
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
  } else if (isUsDateAfterToday(component.resultDate)) {
    errors.resultDate = 'labDateNotFuture'
  }
  const notes = String(component?.notes ?? '')
  if (notes.length > labMaxComponentNotesLength) {
    errors.notes = true
  }
  const lowPresent = isPresentNumber(component?.referenceRangeLow)
  const highPresent = isPresentNumber(component?.referenceRangeHigh)
  if (lowPresent && highPresent) {
    const lowN = Number(component.referenceRangeLow)
    const highN = Number(component.referenceRangeHigh)
    if (lowN >= highN) {
      errors.referenceRange = 'labRefRangeLowMustBeLessThanHigh'
    }
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

function hasTrimmedValue(value) {
  return String(value ?? '').trim().length > 0
}

export function hasLabSpecimenInfo(lab = {}) {
  return hasTrimmedValue(lab.specimenType)
    || hasTrimmedValue(lab.collectedDate)
    || hasTrimmedValue(lab.collectionLocation)
}

export function hasLabResultsInfo(lab = {}) {
  return hasTrimmedValue(lab.resultDate)
    || hasTrimmedValue(lab.abnormalResultManual)
    || hasTrimmedValue(lab.reviewedBy)
    || hasTrimmedValue(lab.reviewedDate)
    || hasTrimmedValue(lab.resultSummary)
}

/**
 * Default Ordering Clinician for Add Lab: only the signed-in provider,
 * and only when they can add labs and appear in clinician options.
 */
export function resolveDefaultOrderingClinicianOption(
  clinicianOptions = [],
  { staffMember = null, canAddLabs = false } = {},
) {
  if (!canAddLabs || !staffMember?.isClinician) {
    return null
  }
  const staffId = Number(staffMember.id)
  if (!Number.isFinite(staffId) || staffId <= 0) {
    return null
  }
  const options = Array.isArray(clinicianOptions) ? clinicianOptions : []

  return options.find(option =>
    Number(option?.staffMemberId) === staffId,
  ) ?? null
}
