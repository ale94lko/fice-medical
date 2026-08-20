import {
  familyMedicalHistoryMaxConditionsLength,
  familyMedicalHistoryMaxNotesLength,
  familyMedicalHistoryMaxRelationshipLength,
  familyMedicalHistorySelfValue,
  medicalHistoryTypeValues,
} from 'components/constants.js'
import { MEDICAL_CONDITIONS_RE } from 'src/utils/text-input-chars.js'
import { createEmptySocialHistory } from 'src/utils/client-social-history.js'

let entryIdCounter = 0

export function nextFamilyMedicalHistoryId() {
  entryIdCounter += 1

  return `fmh-${entryIdCounter}`
}

export function createEmptyFamilyMedicalHistoryDraft() {
  return {
    historyType: null,
    familyRelationship: '',
    medicalConditions: '',
    notes: '',
  }
}

export function createEmptyFamilyMedicalHistorySection() {
  return {
    entries: [],
    draft: createEmptyFamilyMedicalHistoryDraft(),
    deletionAudit: [],
    noSignificantPersonal: false,
    noSurgicalHistory: false,
    noSignificantFamily: false,
    socialHistory: createEmptySocialHistory(),
  }
}

export function isSelfFamilyRelationship(value) {
  return String(value ?? '').trim() === familyMedicalHistorySelfValue
}

export function normalizeMedicalHistoryType(value, relationship = '') {
  const token = String(value ?? '').trim().toLowerCase()
  if (token === medicalHistoryTypeValues.personal
    || token === medicalHistoryTypeValues.family
    || token === medicalHistoryTypeValues.surgical) {
    return token
  }
  if (isSelfFamilyRelationship(relationship)) {
    return medicalHistoryTypeValues.personal
  }
  if (String(relationship ?? '').trim()) {
    return medicalHistoryTypeValues.family
  }

  return medicalHistoryTypeValues.personal
}

export function historyTypeForApi(value, relationship = '') {
  return normalizeMedicalHistoryType(value, relationship).toUpperCase()
}

export function historyTypeFromApi(raw, relationship = '') {
  return normalizeMedicalHistoryType(raw, relationship)
}

export function isValidMedicalConditions(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return (
    MEDICAL_CONDITIONS_RE.test(s)
    && s.length <= familyMedicalHistoryMaxConditionsLength
  )
}

export function isValidMedicalHistoryNotes(value) {
  const s = String(value ?? '').trim()
  if (!s) {
    return true
  }

  return (
    MEDICAL_CONDITIONS_RE.test(s)
    && s.length <= familyMedicalHistoryMaxNotesLength
  )
}

export function trimFamilyMedicalField(value) {
  if (value == null) {
    return ''
  }

  return String(value).trim()
}

function rowHasBackendFmhId(entry) {
  const raw = entry?.apiId ?? entry?.api_id

  return raw != null && String(raw).trim() !== ''
}

/** True when this row came from the API (audit reason required on delete). */
export function fmhRowHasPersistedApiId(entry) {
  return rowHasBackendFmhId(entry)
}

export function relationshipForHistoryType(historyType, relationship) {
  const type = normalizeMedicalHistoryType(historyType, relationship)
  if (type === medicalHistoryTypeValues.personal) {
    return familyMedicalHistorySelfValue
  }
  if (type === medicalHistoryTypeValues.surgical) {
    return ''
  }

  return trimFamilyMedicalField(relationship)
}

export function normalizeFamilyMedicalHistoryEntry(entry) {
  const historyType = normalizeMedicalHistoryType(
    entry?.historyType,
    entry?.familyRelationship,
  )

  return {
    historyType,
    familyRelationship: relationshipForHistoryType(
      historyType,
      entry?.familyRelationship,
    ),
    medicalConditions: trimFamilyMedicalField(entry?.medicalConditions),
    notes: trimFamilyMedicalField(entry?.notes),
  }
}

export function entryDuplicateKey(
  historyType,
  familyRelationship,
  medicalConditions,
) {
  const type = normalizeMedicalHistoryType(historyType, familyRelationship)
  const rel = String(familyRelationship ?? '').trim().toLowerCase()
  const cond = String(medicalConditions ?? '').trim().toLowerCase()

  return `${type}|${rel}|${cond}`
}

export function isDuplicateFamilyMedicalHistoryEntry(
  entries,
  familyRelationship,
  medicalConditions,
  excludeId = null,
  historyType = null,
) {
  const normalizedType = normalizeMedicalHistoryType(
    historyType,
    familyRelationship,
  )
  const key = entryDuplicateKey(
    normalizedType,
    relationshipForHistoryType(normalizedType, familyRelationship),
    medicalConditions,
  )

  return (entries ?? []).some(entry => {
    if (excludeId && entry.id === excludeId) {
      return false
    }
    const normalized = normalizeFamilyMedicalHistoryEntry(entry)

    return entryDuplicateKey(
      normalized.historyType,
      normalized.familyRelationship,
      normalized.medicalConditions,
    ) === key
  })
}

export function validateFamilyMedicalHistoryPair(
  familyRelationship,
  medicalConditions,
) {
  const rel = String(familyRelationship ?? '').trim()
  const cond = String(medicalConditions ?? '').trim()

  if (!rel && !cond) {
    return { ok: true }
  }
  if (rel && !cond) {
    return { ok: false, errorKey: 'fmhConditionsRequired' }
  }
  if (!rel && cond) {
    return { ok: false, errorKey: 'fmhRelationshipRequired' }
  }
  if (rel.length > familyMedicalHistoryMaxRelationshipLength) {
    return { ok: false, errorKey: 'fmhRelationshipMax' }
  }
  if (!isValidMedicalConditions(cond)) {
    return { ok: false, errorKey: 'fmhConditionsInvalid' }
  }

  return { ok: true }
}

function emptyDraftErrorKeys() {
  return {
    historyType: null,
    relationship: null,
    conditions: null,
    notes: null,
  }
}

export function validateMedicalHistoryDraftForAdd(draft) {
  const historyType = normalizeMedicalHistoryType(
    draft?.historyType,
    draft?.familyRelationship,
  )
  const typed = trimFamilyMedicalField(draft?.historyType)
  const rel = trimFamilyMedicalField(draft?.familyRelationship)
  const cond = trimFamilyMedicalField(draft?.medicalConditions)
  const notes = trimFamilyMedicalField(draft?.notes)
  const keys = emptyDraftErrorKeys()

  if (!typed) {
    keys.historyType = 'fmhHistoryTypeRequired'
  }

  if (historyType === medicalHistoryTypeValues.family) {
    if (!rel) {
      keys.relationship = 'fmhRelationshipRequired'
    } else if (rel.length > familyMedicalHistoryMaxRelationshipLength) {
      keys.relationship = 'fmhRelationshipMax'
    }
  }

  if (!cond) {
    keys.conditions = historyType === medicalHistoryTypeValues.surgical
      ? 'fmhProcedureRequired'
      : 'fmhConditionsRequired'
  } else if (!isValidMedicalConditions(cond)) {
    keys.conditions = historyType === medicalHistoryTypeValues.surgical
      ? 'fmhProcedureInvalid'
      : 'fmhConditionsInvalid'
  }

  if (notes && !isValidMedicalHistoryNotes(notes)) {
    keys.notes = 'fmhNotesInvalid'
  }

  const hasError = Boolean(
    keys.historyType || keys.relationship || keys.conditions || keys.notes,
  )

  return {
    ok: !hasError,
    ...keys,
    errorKey: keys.historyType
      || keys.relationship
      || keys.conditions
      || keys.notes,
  }
}

/**
 * Validate draft before Add. Empty fields each get their own required key.
 */
export function validateFamilyMedicalHistoryForAdd(
  familyRelationship,
  medicalConditions,
  historyType = medicalHistoryTypeValues.family,
  notes = '',
) {
  return validateMedicalHistoryDraftForAdd({
    historyType,
    familyRelationship,
    medicalConditions,
    notes,
  })
}

export function validateFamilyMedicalHistoryDraftClear(section) {
  const draft = section?.draft ?? {}
  const typed = trimFamilyMedicalField(draft.historyType)
  const rel = trimFamilyMedicalField(draft.familyRelationship)
  const cond = trimFamilyMedicalField(draft.medicalConditions)
  const notes = trimFamilyMedicalField(draft.notes)
  if (!typed && !rel && !cond && !notes) {
    return { ok: true }
  }

  return validateMedicalHistoryDraftForAdd(draft)
}

export function getFamilyMedicalHistoryDraftFieldErrorKeys(section) {
  const draft = section?.draft ?? {}
  const typed = trimFamilyMedicalField(draft.historyType)
  const rel = trimFamilyMedicalField(draft.familyRelationship)
  const cond = trimFamilyMedicalField(draft.medicalConditions)
  const notes = trimFamilyMedicalField(draft.notes)
  if (!typed && !rel && !cond && !notes) {
    return emptyDraftErrorKeys()
  }

  const result = validateMedicalHistoryDraftForAdd(draft)

  return {
    historyType: result.historyType,
    relationship: result.relationship,
    conditions: result.conditions,
    notes: result.notes,
  }
}

export function countFamilyMedicalHistoryDraftFieldErrors(section) {
  const keys = getFamilyMedicalHistoryDraftFieldErrorKeys(section)

  return [
    keys.historyType,
    keys.relationship,
    keys.conditions,
    keys.notes,
  ].filter(Boolean).length
}

export function splitFamilyMedicalHistoryEntries(entries) {
  const personal = []
  const family = []
  const surgical = []

  for (const entry of entries ?? []) {
    const type = normalizeMedicalHistoryType(
      entry.historyType,
      entry.familyRelationship,
    )
    if (type === medicalHistoryTypeValues.surgical) {
      surgical.push(entry)
    } else if (type === medicalHistoryTypeValues.personal) {
      personal.push(entry)
    } else {
      family.push(entry)
    }
  }

  return { personal, family, surgical }
}

export function negativeFlagKeyForType(historyType) {
  if (historyType === medicalHistoryTypeValues.personal) {
    return 'noSignificantPersonal'
  }
  if (historyType === medicalHistoryTypeValues.surgical) {
    return 'noSurgicalHistory'
  }

  return 'noSignificantFamily'
}

export function buildFamilyMedicalHistoryPayload(section) {
  const items = (section?.entries ?? [])
    .map(entry => normalizeFamilyMedicalHistoryEntry(entry))
    .filter(item => item.medicalConditions.length > 0)
    .filter(item =>
      item.historyType !== medicalHistoryTypeValues.family
      || item.familyRelationship.length > 0,
    )

  const deletions = (section?.deletionAudit ?? [])
    .map(row => ({
      familyRelationship: String(row.familyRelationship ?? '').trim(),
      medicalConditions: String(row.medicalConditions ?? '').trim(),
      reason: String(row.reason ?? '').trim(),
      apiId: row.apiId ?? row.api_id ?? null,
      historyType: normalizeMedicalHistoryType(
        row.historyType,
        row.familyRelationship,
      ),
    }))
    .filter(row => row.reason && (row.apiId || (
      row.familyRelationship && row.medicalConditions
    )))

  if (!items.length && !deletions.length) {
    return null
  }

  const payload = {}
  if (items.length) {
    payload.entries = items
  }
  if (deletions.length) {
    payload.deletions = deletions
  }

  return payload
}
