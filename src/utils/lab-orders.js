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
    hasAttachments: false,
    createdAt: new Date().toISOString(),
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

/** True when both dates are valid and `dateStr` is strictly before `minStr`. */
export function isUsDateBefore(dateStr, minStr) {
  const dateKey = parseUsDateToSortable(dateStr)
  const minKey = parseUsDateToSortable(minStr)
  if (!dateKey || !minKey) {
    return false
  }

  return dateKey < minKey
}

function validateDateNotBefore(dateStr, minStr, errorKey) {
  if (!String(dateStr ?? '').trim() || !String(minStr ?? '').trim()) {
    return null
  }
  if (isUsDateBefore(dateStr, minStr)) {
    return errorKey
  }

  return null
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

/** Higher = introduced more recently (for same ordered date). */
export function labIntroductionSortKey(lab) {
  const created = lab?.createdAt ?? lab?.created_at ?? lab?.introducedAt
  if (created != null && created !== '') {
    if (typeof created === 'number' && Number.isFinite(created)) {
      return created
    }
    const parsed = Date.parse(String(created))
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  const id = String(lab?.id ?? '').trim()
  if (id !== '' && Number.isFinite(Number(id))) {
    return Number(id)
  }
  // Local ids: lab-<timestamp>-<random>
  const localStamp = /-(\d{10,})(?:-|$)/.exec(id)
  if (localStamp) {
    return Number(localStamp[1])
  }

  return 0
}

/**
 * Newest ordered date first; same date → last introduced first.
 */
export function sortLabsByOrderedDateDesc(list) {
  const rows = Array.isArray(list) ? [...list] : []

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const dateA = parseUsDateToSortable(a.row?.orderedDate)
      const dateB = parseUsDateToSortable(b.row?.orderedDate)
      if (dateB !== dateA) {
        return dateB - dateA
      }
      const introA = labIntroductionSortKey(a.row)
      const introB = labIntroductionSortKey(b.row)
      if (introB !== introA) {
        return introB - introA
      }

      // Stable fallback: later in the list = introduced last.
      return b.index - a.index
    })
    .map(item => item.row)
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

export function validateLabOrder(lab) {
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
  if (!String(lab?.orderedDate ?? '').trim()) {
    errors.orderedDate = true
  } else if (isUsDateAfterToday(lab.orderedDate)) {
    errors.orderedDate = 'labDateNotFuture'
  }
  const summary = String(lab?.resultSummary ?? '')
  if (summary.length > labMaxResultSummaryLength) {
    errors.resultSummary = true
  }

  return errors
}

export function validateLabCollect(lab) {
  const errors = {}
  if (!String(lab?.specimenType ?? '').trim()) {
    errors.specimenType = true
  }
  if (!String(lab?.collectedDate ?? '').trim()) {
    errors.collectedDate = true
  } else if (isUsDateAfterToday(lab.collectedDate)) {
    errors.collectedDate = 'labDateNotFuture'
  } else {
    const beforeOrdered = validateDateNotBefore(
      lab.collectedDate,
      lab.orderedDate,
      'labCollectedBeforeOrdered',
    )
    if (beforeOrdered) {
      errors.collectedDate = beforeOrdered
    }
  }

  return errors
}

export function validateLabResults(lab) {
  const errors = {}
  if (!String(lab?.resultDate ?? '').trim()) {
    errors.resultDate = true
  } else if (isUsDateAfterToday(lab.resultDate)) {
    errors.resultDate = 'labDateNotFuture'
  } else {
    const minDate = String(lab?.collectedDate ?? '').trim()
      || String(lab?.orderedDate ?? '').trim()
    const beforeCollected = validateDateNotBefore(
      lab.resultDate,
      minDate,
      'labResultBeforeCollected',
    )
    if (beforeCollected) {
      errors.resultDate = beforeCollected
    }
  }
  const summary = String(lab?.resultSummary ?? '')
  if (summary.length > labMaxResultSummaryLength) {
    errors.resultSummary = true
  }

  return errors
}

export function validateLabReview(lab) {
  const errors = {}
  if (!String(lab?.reviewedBy ?? '').trim()) {
    errors.reviewedBy = true
  }
  if (!String(lab?.reviewedDate ?? '').trim()) {
    errors.reviewedDate = true
  } else if (isUsDateAfterToday(lab.reviewedDate)) {
    errors.reviewedDate = 'labDateNotFuture'
  } else {
    const minDate = String(lab?.resultDate ?? '').trim()
      || String(lab?.collectedDate ?? '').trim()
      || String(lab?.orderedDate ?? '').trim()
    const beforeResult = validateDateNotBefore(
      lab.reviewedDate,
      minDate,
      'labReviewedBeforeResult',
    )
    if (beforeResult) {
      errors.reviewedDate = beforeResult
    }
  }

  return errors
}

/** Validate fields editable via PATCH for the current status. */
export function validateLabPatch(lab, status) {
  const token = String(status ?? lab?.status ?? '')
    .trim()
    .toUpperCase()
  if (token === labStatuses.ordered) {
    return validateLabOrder(lab)
  }
  if (token === labStatuses.collected) {
    return validateLabCollect(lab)
  }
  if (token === labStatuses.resulted) {
    return validateLabResults(lab)
  }

  return {}
}

export function labStatusToken(status) {
  return String(status ?? '').trim().toUpperCase()
}

export function isLabCancelled(status) {
  return labStatusToken(status) === labStatuses.cancelled
}

export function isLabTerminal(status) {
  const token = labStatusToken(status)

  return token === labStatuses.reviewed || token === labStatuses.cancelled
}

export function canEditLabOrderFields(status) {
  return labStatusToken(status) === labStatuses.ordered
}

export function canShowLabSpecimen(status) {
  const token = labStatusToken(status)

  return token === labStatuses.ordered
    || token === labStatuses.collected
    || token === labStatuses.resulted
    || token === labStatuses.reviewed
}

export function canEditLabSpecimen(status) {
  const token = labStatusToken(status)

  return token === labStatuses.ordered || token === labStatuses.collected
}

export function canShowLabResults(status) {
  const token = labStatusToken(status)

  return token === labStatuses.collected
    || token === labStatuses.resulted
    || token === labStatuses.reviewed
}

export function canEditLabResults(status) {
  const token = labStatusToken(status)

  return token === labStatuses.collected || token === labStatuses.resulted
}

export function canShowLabComponents(status) {
  return canShowLabResults(status)
}

export function canEditLabComponents(status) {
  return canEditLabResults(status)
}

export function canShowLabReview(status) {
  const token = labStatusToken(status)

  return token === labStatuses.resulted || token === labStatuses.reviewed
}

export function canEditLabReview(status) {
  return labStatusToken(status) === labStatuses.resulted
}

export function canAdvanceLabToCollect(status) {
  return labStatusToken(status) === labStatuses.ordered
}

export function canAdvanceLabToResults(status) {
  return labStatusToken(status) === labStatuses.collected
}

export function canAdvanceLabToReview(status) {
  return labStatusToken(status) === labStatuses.resulted
}

export function canCancelLab(status) {
  const token = labStatusToken(status)

  return Boolean(token)
    && token !== labStatuses.cancelled
    && token !== labStatuses.reviewed
}

export function hasLabAttachments(lab) {
  if (lab?.hasAttachments === true) {
    return true
  }
  const files = lab?.files ?? lab?.attachments ?? []
  if (!Array.isArray(files) || !files.length) {
    return false
  }

  return files.some(file => {
    if (!file || file.deletedAt) {
      return false
    }

    return Boolean(file.id || file.rawFile || file.name)
  })
}

export function normalizeLabComponentName(name) {
  return String(name ?? '').trim().toLowerCase()
}

export function isLabComponentAlreadyAdded(
  componentName,
  existingComponents = [],
  { excludeId = null } = {},
) {
  const needle = normalizeLabComponentName(componentName)
  if (!needle) {
    return false
  }
  const exclude = String(excludeId ?? '').trim()

  return visibleComponents(existingComponents).some(item => {
    if (exclude && String(item.id ?? '').trim() === exclude) {
      return false
    }

    return normalizeLabComponentName(item.componentName) === needle
  })
}

export function nextLabTransitionAction(status) {
  if (canAdvanceLabToCollect(status)) {
    return 'collect'
  }
  if (canAdvanceLabToResults(status)) {
    return 'results'
  }
  if (canAdvanceLabToReview(status)) {
    return 'review'
  }

  return null
}

export function validateLabComponent(
  component,
  {
    existingComponents = [],
    excludeId = null,
    minResultDate = '',
  } = {},
) {
  const errors = {}
  if (!String(component?.componentName ?? '').trim()) {
    errors.componentName = true
  } else if (isLabComponentAlreadyAdded(
    component.componentName,
    existingComponents,
    { excludeId },
  )) {
    errors.componentName = 'labComponentDuplicate'
  }
  if (component?.value === '' || component?.value == null) {
    errors.value = true
  }
  if (!String(component?.unit ?? '').trim()) {
    errors.unit = true
  }
  if (!String(component?.resultDate ?? '').trim()) {
    errors.resultDate = true
  } else if (isUsDateAfterToday(component.resultDate)) {
    errors.resultDate = 'labDateNotFuture'
  } else if (minResultDate) {
    const beforeMin = validateDateNotBefore(
      component.resultDate,
      minResultDate,
      'labResultBeforeCollected',
    )
    if (beforeMin) {
      errors.resultDate = beforeMin
    }
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
