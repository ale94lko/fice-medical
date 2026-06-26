import {
  clientFieldKeys,
  clientFormSections,
} from 'components/constants.js'
import { visibleInsuranceProfiles } from 'src/utils/client-insurance.js'
import { formHasAssignedClinicians } from 'src/utils/client-clinicians-form.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
}

function contactSectionHasBeyondEmpty(contact) {
  if (!contact || typeof contact !== 'object') {
    return false
  }
  const addrKeys = [
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'county',
    'zipCode',
  ]
  for (const key of addrKeys) {
    if (trim(contact[key])) {
      return true
    }
  }
  for (const p of contact.phones ?? []) {
    if (trim(p?.number)) {
      return true
    }
  }
  for (const e of contact.emails ?? []) {
    if (trim(e?.address)) {
      return true
    }
  }
  if (Array.isArray(contact.preferredCommunication)
    && contact.preferredCommunication.length) {
    return true
  }
  if (trim(contact.additionalNotes)) {
    return true
  }
  if (Array.isArray(contact.otherContacts) && contact.otherContacts.length) {
    return true
  }

  return false
}

function sectionHasRows(section, key) {
  const entries = section?.[key]
  return Array.isArray(entries) && entries.length > 0
}

function basicIdentityFieldsHaveData(form) {
  if (trim(form[ck.middleName])) {
    return true
  }
  if (form[ck.prefix] != null && String(form[ck.prefix]).trim() !== '') {
    return true
  }
  if (form[ck.suffix] != null && String(form[ck.suffix]).trim() !== '') {
    return true
  }
  if (trim(form[ck.gender])) {
    return true
  }
  if (trim(form[ck.preferredLanguage])) {
    return true
  }
  if (form[ck.race] != null && String(form[ck.race]).trim() !== '') {
    return true
  }
  if (form[ck.ethnicity] != null && String(form[ck.ethnicity]).trim() !== '') {
    return true
  }
  if (trim(form[ck.dob])) {
    return true
  }
  if (trim(form[ck.age])) {
    return true
  }
  if (
    trim(form[ck.socialSecurityNumber])
    || trim(form[ck.idNumberMasked])
  ) {
    return true
  }
  if (trim(form[ck.admissionDate])) {
    return true
  }
  if (formHasAssignedClinicians(form)) {
    return true
  }

  return false
}

/**
 * True when the add-client form has meaningful data beyond first + last name.
 * Used before navigating away from a draft to an existing client record.
 */
export function hasAddClientDataBeyondFirstLastName(form) {
  if (!form || typeof form !== 'object') {
    return false
  }
  if (basicIdentityFieldsHaveData(form)) {
    return true
  }
  const contact = form[clientFormSections.contact]
  if (contactSectionHasBeyondEmpty(contact)) {
    return true
  }
  if (
    sectionHasRows(
      form[clientFormSections.familyMedicalHistory],
      'entries',
    )
  ) {
    return true
  }
  if (sectionHasRows(form[clientFormSections.allergies], 'entries')) {
    return true
  }
  if (visibleInsuranceProfiles(form[clientFormSections.insurance]).length) {
    return true
  }
  if (sectionHasRows(form[clientFormSections.vitals], 'entries')) {
    return true
  }
  const labs = form[clientFormSections.labs]
  if (Array.isArray(labs) && labs.length) {
    return true
  }

  return false
}
