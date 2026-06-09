import {
  clientAllergyMaxNameLength,
  clientAllergyMinStartYear,
  clientAllergySeverityRank,
  clientAllergySeverityValues,
  clientAllergiesNkaStatus,
  clientMaxAge,
} from 'components/constants.js'
import { birthYearFromUsDob } from 'src/utils/client-form.js'

const ALLERGY_NAME_RE = /^[a-zA-Z0-9\s\-()"']*$/

let allergyIdCounter = 0

export function nextAllergyId() {
  allergyIdCounter += 1

  return `allergy-${allergyIdCounter}`
}

export function allergyMaxStartYear() {
  return new Date().getFullYear()
}

/**
 * @param {string} [patientDobUs] Patient DOB as mm/dd/yyyy when known.
 *   Allergy start year cannot be before this calendar year.
 */
export function allergyMinStartYear(patientDobUs) {
  const base = Math.max(
    clientAllergyMinStartYear,
    allergyMaxStartYear() - clientMaxAge,
  )
  const birthYear = birthYearFromUsDob(patientDobUs)
  if (birthYear == null) {
    return base
  }

  return Math.max(base, birthYear)
}

export function createEmptyAllergyDraft() {
  return {
    allergy: '',
    severity: '',
    startYear: '',
  }
}

export function createEmptyAllergiesSection() {
  return {
    entries: [],
    draft: createEmptyAllergyDraft(),
    addExpanded: true,
  }
}

export function trimAllergyField(value) {
  if (value == null) {
    return ''
  }

  return String(value).trim()
}

export function normalizeAllergyEntry(entry) {
  const startYearRaw = trimAllergyField(entry.startYear)
  const startYear = startYearRaw === '' ? null : Number(startYearRaw)

  return {
    allergy: trimAllergyField(entry.allergy),
    severity: trimAllergyField(entry.severity),
    startYear: Number.isFinite(startYear) ? startYear : null,
    // eslint-disable-next-line camelcase -- mirrors API / PATCH payload
    deletion_reason: trimAllergyField(entry.deletion_reason),
  }
}

/** Rows still shown in the allergies list (not soft-deleted). */
export function visibleAllergyEntries(entries) {
  return (entries ?? []).filter(
    row => !trimAllergyField(row?.deletion_reason),
  )
}

function rowHasBackendAllergyId(entry) {
  const raw = entry?.apiId ?? entry?.api_id
  return raw != null && String(raw).trim() !== ''
}

/** True when this row came from the API (PATCH/DELETE semantics on save). */
export function allergyRowHasPersistedApiId(entry) {
  return rowHasBackendAllergyId(entry)
}

/**
 * True when optional start year is set but outside the range allowed for
 * patient DOB (e.g. DOB was raised after the year was chosen).
 */
export function allergyEntryStartYearViolatesDob(entry, patientDobUs) {
  if (trimAllergyField(entry?.deletion_reason)) {
    return false
  }
  const raw = entry?.startYear
  if (raw == null || raw === '') {
    return false
  }
  const s = String(raw).trim()
  if (!/^\d{4}$/.test(s)) {
    return true
  }
  const year = Number(s)
  const min = allergyMinStartYear(patientDobUs)
  const max = allergyMaxStartYear()

  return year < min || year > max
}

/** Ids of visible allergy rows whose start year conflicts with current DOB. */
export function allergyEntriesDobInvalidIds(entries, patientDobUs) {
  const out = []
  for (const e of entries ?? []) {
    if (allergyEntryStartYearViolatesDob(e, patientDobUs)) {
      out.push(e.id)
    }
  }

  return out
}

export function isValidAllergyName(value) {
  const s = trimAllergyField(value)
  if (!s) {
    return true
  }

  return (
    ALLERGY_NAME_RE.test(s)
    && s.length <= clientAllergyMaxNameLength
  )
}

export function isValidAllergyStartYear(value, patientDobUs) {
  const s = trimAllergyField(value)
  if (!s) {
    return true
  }
  if (!/^\d{4}$/.test(s)) {
    return false
  }
  const year = Number(s)
  const min = allergyMinStartYear(patientDobUs)
  const max = allergyMaxStartYear()

  return Number.isInteger(year) && year >= min && year <= max
}

export function entryDuplicateKey(allergy, severity, startYear) {
  const normalized = normalizeAllergyEntry({
    allergy,
    severity,
    startYear,
  })

  return [
    normalized.allergy.toLowerCase(),
    normalized.severity.toLowerCase(),
    normalized.startYear ?? '',
  ].join('|')
}

export function isDuplicateAllergyEntry(
  entries,
  allergy,
  severity,
  startYear,
  excludeId = null,
) {
  const key = entryDuplicateKey(allergy, severity, startYear)

  return (entries ?? []).some(entry => {
    if (trimAllergyField(entry?.deletion_reason)) {
      return false
    }
    if (excludeId && entry.id === excludeId) {
      return false
    }
    const normalized = normalizeAllergyEntry(entry)

    return entryDuplicateKey(
      normalized.allergy,
      normalized.severity,
      normalized.startYear,
    ) === key
  })
}

export function validateAllergyPair(
  allergy,
  severity,
  startYear,
  patientDobUs,
) {
  const name = trimAllergyField(allergy)
  const sev = trimAllergyField(severity)
  const year = trimAllergyField(startYear)

  if (!name && !sev && !year) {
    return { ok: true }
  }
  if (!name && (sev || year)) {
    return { ok: false, errorKey: 'allergyNameRequired' }
  }
  if (name && !sev) {
    return { ok: false, errorKey: 'allergySeverityRequired' }
  }
  if (!isValidAllergyName(name)) {
    return { ok: false, errorKey: 'allergyNameInvalid' }
  }
  if (!isValidAllergyStartYear(year, patientDobUs)) {
    return { ok: false, errorKey: 'allergyStartYearInvalid' }
  }

  return { ok: true }
}

export function validateAllergyForAdd(
  allergy,
  severity,
  startYear,
  patientDobUs,
) {
  const name = trimAllergyField(allergy)
  const sev = trimAllergyField(severity)
  const year = trimAllergyField(startYear)

  if (!name && !sev && !year) {
    return { ok: false, errorKey: 'allergyAddRequired' }
  }

  return validateAllergyPair(allergy, severity, startYear, patientDobUs)
}

export function validateAllergiesDraftClear(section, patientDobUs) {
  const draft = section?.draft ?? {}

  return validateAllergyPair(
    draft.allergy,
    draft.severity,
    draft.startYear,
    patientDobUs,
  )
}

export function getAllergyDraftFieldErrorKeys(section, patientDobUs) {
  const draft = section?.draft ?? {}
  const name = trimAllergyField(draft.allergy)
  const sev = trimAllergyField(draft.severity)
  const year = trimAllergyField(draft.startYear)
  const keys = {
    name: null,
    severity: null,
    year: null,
  }

  if (!name && !sev && !year) {
    return keys
  }
  if (!name) {
    keys.name = 'allergyNameRequired'
  } else if (!isValidAllergyName(name)) {
    keys.name = 'allergyNameInvalid'
  }
  if (name && !sev) {
    keys.severity = 'allergySeverityRequired'
  }
  if (!isValidAllergyStartYear(year, patientDobUs)) {
    keys.year = 'allergyStartYearInvalid'
  }

  return keys
}

export function countAllergyDraftFieldErrors(section, patientDobUs) {
  const keys = getAllergyDraftFieldErrorKeys(section, patientDobUs)

  return [keys.name, keys.severity, keys.year].filter(Boolean).length
}

export function highestAllergySeverity(entries) {
  let maxRank = 0
  let topSeverity = ''

  for (const entry of entries ?? []) {
    if (trimAllergyField(entry?.deletion_reason)) {
      continue
    }
    const sev = trimAllergyField(entry.severity)
    const rank = clientAllergySeverityRank[sev] ?? 0
    if (rank > maxRank) {
      maxRank = rank
      topSeverity = sev
    }
  }

  return topSeverity
}

export function severityTabModifier(severity) {
  const value = trimAllergyField(severity)
  if (value === clientAllergySeverityValues.severe) {
    return 'severe'
  }
  if (value === clientAllergySeverityValues.moderate) {
    return 'moderate'
  }
  if (value === clientAllergySeverityValues.mild) {
    return 'mild'
  }

  return ''
}

function allergyStartDateIsoFromYear(year) {
  const y = Number(year)
  if (!Number.isFinite(y) || y < 1) {
    return null
  }

  return `${y}-01-01`
}

export function buildAllergiesPayload(section) {
  const rows = (section?.entries ?? [])
    .map(entry => {
      const normalized = normalizeAllergyEntry(entry)
      if (!normalized.allergy || !normalized.severity) {
        return null
      }
      const row = {
        name: normalized.allergy,
        severity: normalized.severity,
        // eslint-disable-next-line camelcase -- register API shape
        start_date: allergyStartDateIsoFromYear(normalized.startYear),
      }
      if (normalized.deletion_reason) {
        // eslint-disable-next-line camelcase -- register API shape
        row.deletion_reason = normalized.deletion_reason
      }
      if (rowHasBackendAllergyId(entry)) {
        const raw = entry.apiId ?? entry.api_id
        const numericId = Number(raw)
        row.id = Number.isFinite(numericId) ? numericId : raw
      }

      return row
    })
    .filter(row => {
      if (trimAllergyField(row.deletion_reason)) {
        return row.id != null
      }

      return row.name && row.severity
    })

  if (!rows.length) {
    return { status: clientAllergiesNkaStatus }
  }

  return { entries: rows }
}
