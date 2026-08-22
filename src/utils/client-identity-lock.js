import { clientFieldKeys } from 'components/constants.js'
import {
  hasStoredIdNumberMasked,
  normalizeSsnDigits,
} from 'src/utils/client-form.js'

const IDENTITY_TEXT_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'dob',
  'sex',
]

function trim(value) {
  return String(value ?? '').trim()
}

export function snapshotClientIdentity(
  form,
  ck = clientFieldKeys,
) {
  return {
    firstName: trim(form?.[ck.firstName]),
    middleName: trim(form?.[ck.middleName]),
    lastName: trim(form?.[ck.lastName]),
    dob: trim(form?.[ck.dob]),
    sex: trim(form?.[ck.gender]),
    hasSsn: hasStoredIdNumberMasked(form, ck),
  }
}

export function hasSavedIdentityValue(snapshot, field) {
  if (!snapshot) {
    return false
  }
  if (field === 'ssn') {
    return Boolean(snapshot.hasSsn)
  }

  return Boolean(trim(snapshot[field]))
}

export function identityOverrideFields(
  snapshot,
  form,
  ck = clientFieldKeys,
) {
  if (!snapshot) {
    return []
  }
  const next = snapshotClientIdentity(form, ck)
  const changed = []
  IDENTITY_TEXT_FIELDS.forEach(field => {
    if (!hasSavedIdentityValue(snapshot, field)) {
      return
    }
    if (snapshot[field] !== next[field]) {
      changed.push(field)
    }
  })
  const digits = normalizeSsnDigits(form?.[ck.socialSecurityNumber])
  if (snapshot.hasSsn && digits.length === 9) {
    changed.push('ssn')
  }

  return changed
}

export function isIdentityFieldLocked(
  snapshot,
  field,
  isEdit,
  canOverride,
) {
  if (!isEdit || canOverride) {
    return false
  }

  return hasSavedIdentityValue(snapshot, field)
}

export function showIdentityAdminBadge(snapshot, field, isEdit) {
  return Boolean(isEdit && hasSavedIdentityValue(snapshot, field))
}
