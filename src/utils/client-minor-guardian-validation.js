import {
  clientFieldKeys,
  clientContactTypeValues,
  clientFormSections,
} from 'components/constants.js'
import {
  dobUsDateFromAgeAndUnit,
  fullYearsBetween,
  isCompleteUsDateString,
  parseUsDateString,
  startOfDay,
} from 'src/utils/client-form.js'
import {
  otherContactMeetsMinimumRequirements,
} from 'src/utils/client-contact-form.js'

export const CLIENT_MINOR_AGE_YEARS = 18

function trim(value) {
  return String(value ?? '').trim()
}

export function isGuardianContactType(contactType) {
  const normalized = trim(contactType)
  if (!normalized) {
    return false
  }

  return normalized === clientContactTypeValues.guardian
    || normalized.toLowerCase() === 'guardian'
}

/**
 * Full years from today using DOB when complete, otherwise age + unit.
 */
export function resolveClientAgeInYears(form) {
  if (!form || typeof form !== 'object') {
    return null
  }

  const dob = trim(form[clientFieldKeys.dob])
  if (dob && isCompleteUsDateString(dob)) {
    const parsed = parseUsDateString(dob)
    if (parsed) {
      return fullYearsBetween(parsed, startOfDay(new Date()))
    }
  }

  const ageStr = trim(form[clientFieldKeys.age])
  const ageNum = Number(ageStr)
  if (!ageStr || !Number.isFinite(ageNum) || ageNum < 0) {
    return null
  }

  const dobFromAge = dobUsDateFromAgeAndUnit(
    ageNum,
    form[clientFieldKeys.ageUnit],
  )
  if (!dobFromAge) {
    return null
  }

  const parsedFromAge = parseUsDateString(dobFromAge)
  if (!parsedFromAge) {
    return null
  }

  return fullYearsBetween(parsedFromAge, startOfDay(new Date()))
}

export function isClientMinor(form) {
  const ageYears = resolveClientAgeInYears(form)

  return ageYears != null && ageYears < CLIENT_MINOR_AGE_YEARS
}

export function isPersistableGuardianContact(other) {
  if (!other || other.deleted) {
    return false
  }

  return isGuardianContactType(other.contactType)
    && otherContactMeetsMinimumRequirements(other)
}

export function hasPersistableGuardianContact(contactSection) {
  return (contactSection?.otherContacts ?? []).some(
    isPersistableGuardianContact,
  )
}

export function resolveMinorGuardianContactSaveErrorKey(form) {
  if (!isClientMinor(form)) {
    return null
  }

  const contactSection = form?.[clientFormSections.contact]
  if (hasPersistableGuardianContact(contactSection)) {
    return null
  }

  return 'minorClientGuardianContactRequired'
}
