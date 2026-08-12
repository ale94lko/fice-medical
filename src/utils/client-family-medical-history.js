import {
  familyMedicalHistoryMaxConditionsLength,
  familyMedicalHistoryMaxRelationshipLength,
  familyMedicalHistorySelfValue,
} from 'components/constants.js'
import { MEDICAL_CONDITIONS_RE } from 'src/utils/text-input-chars.js'

let entryIdCounter = 0

export function nextFamilyMedicalHistoryId() {
  entryIdCounter += 1

  return `fmh-${entryIdCounter}`
}

export function createEmptyFamilyMedicalHistoryDraft() {
  return {
    familyRelationship: '',
    medicalConditions: '',
  }
}

export function createEmptyFamilyMedicalHistorySection() {
  return {
    entries: [],
    draft: createEmptyFamilyMedicalHistoryDraft(),
    deletionAudit: [],
  }
}

export function isSelfFamilyRelationship(value) {
  return String(value ?? '').trim() === familyMedicalHistorySelfValue
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

export function normalizeFamilyMedicalHistoryEntry(entry) {
  return {
    familyRelationship: trimFamilyMedicalField(entry.familyRelationship),
    medicalConditions: trimFamilyMedicalField(entry.medicalConditions),
  }
}

export function entryDuplicateKey(familyRelationship, medicalConditions) {
  const rel = String(familyRelationship ?? '').trim().toLowerCase()
  const cond = String(medicalConditions ?? '').trim().toLowerCase()

  return `${rel}|${cond}`
}

export function isDuplicateFamilyMedicalHistoryEntry(
  entries,
  familyRelationship,
  medicalConditions,
  excludeId = null,
) {
  const key = entryDuplicateKey(familyRelationship, medicalConditions)

  return (entries ?? []).some(entry => {
    if (excludeId && entry.id === excludeId) {
      return false
    }
    const normalized = normalizeFamilyMedicalHistoryEntry(entry)

    return entryDuplicateKey(
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

/**
 * Validate draft before Add. Empty fields each get their own required key.
 */
export function validateFamilyMedicalHistoryForAdd(
  familyRelationship,
  medicalConditions,
) {
  const rel = trimFamilyMedicalField(familyRelationship)
  const cond = trimFamilyMedicalField(medicalConditions)
  let relationship = null
  let conditions = null

  if (!rel) {
    relationship = 'fmhRelationshipRequired'
  } else if (rel.length > familyMedicalHistoryMaxRelationshipLength) {
    relationship = 'fmhRelationshipMax'
  }

  if (!cond) {
    conditions = 'fmhConditionsRequired'
  } else if (!isValidMedicalConditions(cond)) {
    conditions = 'fmhConditionsInvalid'
  }

  if (relationship || conditions) {
    return {
      ok: false,
      relationship,
      conditions,
      errorKey: relationship && conditions
        ? 'fmhBothRequired'
        : (relationship || conditions),
    }
  }

  return {
    ok: true,
    relationship: null,
    conditions: null,
  }
}

export function validateFamilyMedicalHistoryDraftClear(section) {
  const draft = section?.draft ?? {}

  return validateFamilyMedicalHistoryPair(
    draft.familyRelationship,
    draft.medicalConditions,
  )
}

export function getFamilyMedicalHistoryDraftFieldErrorKeys(section) {
  const draft = section?.draft ?? {}
  const rel = trimFamilyMedicalField(draft.familyRelationship)
  const cond = trimFamilyMedicalField(draft.medicalConditions)
  const keys = {
    relationship: null,
    conditions: null,
  }

  if (!rel && !cond) {
    return keys
  }
  if (!rel && cond) {
    keys.relationship = 'fmhRelationshipRequired'
  }
  if (rel && !cond) {
    keys.conditions = 'fmhConditionsRequired'
  }
  if (
    rel
    && rel.length > familyMedicalHistoryMaxRelationshipLength
  ) {
    keys.relationship = 'fmhRelationshipMax'
  }
  if (cond && !isValidMedicalConditions(cond)) {
    keys.conditions = 'fmhConditionsInvalid'
  }

  return keys
}

export function countFamilyMedicalHistoryDraftFieldErrors(section) {
  const keys = getFamilyMedicalHistoryDraftFieldErrorKeys(section)

  return [keys.relationship, keys.conditions].filter(Boolean).length
}

export function splitFamilyMedicalHistoryEntries(entries) {
  const personal = []
  const family = []

  for (const entry of entries ?? []) {
    if (isSelfFamilyRelationship(entry.familyRelationship)) {
      personal.push(entry)
    } else {
      family.push(entry)
    }
  }

  return { personal, family }
}

export function buildFamilyMedicalHistoryPayload(section) {
  const items = (section?.entries ?? [])
    .map(entry => normalizeFamilyMedicalHistoryEntry(entry))
    .filter(
      item => item.familyRelationship.length > 0
        && item.medicalConditions.length > 0,
    )

  const deletions = (section?.deletionAudit ?? [])
    .map(row => ({
      familyRelationship: String(row.familyRelationship ?? '').trim(),
      medicalConditions: String(row.medicalConditions ?? '').trim(),
      reason: String(row.reason ?? '').trim(),
    }))
    .filter(
      row => row.familyRelationship && row.medicalConditions && row.reason,
    )

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
