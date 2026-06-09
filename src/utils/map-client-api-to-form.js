import {
  clientAllergySeverityValues,
  clientContactTypeValues,
  clientCountryDefault,
  clientEmailTypeValues,
  clientFamilyRelationshipValues,
  clientFieldKeys as ck,
  clientFormSections,
  clientInsurancePriorityValues,
  clientInsuranceRelationshipValues,
  clientInsuranceStatusValues,
  clientInsuranceTypeValues,
  clientPhoneTypeValues,
  clientRelationshipTypeValues,
  clientGenderValues,
} from 'components/constants.js'
import {
  createEmptyAllergiesSection,
  nextAllergyId,
} from 'src/utils/client-allergies.js'
import {
  applyPreferredPointOfContactFromApi,
  normalizePreferredCommunicationList,
} from 'src/utils/client-preferred-communication.js'
import {
  createEmptyContactSection,
  createEmptyEmail,
  createEmptyOtherContact,
  createEmptyPhone,
  copyClientAddressToContact,
  formatPhoneUs,
  nextContactId,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'
import {
  createEmptyFamilyMedicalHistorySection,
  nextFamilyMedicalHistoryId,
} from 'src/utils/client-family-medical-history.js'
import { nextInsuranceId } from 'src/utils/client-insurance.js'
import { createEmptyVitalsSection } from 'src/utils/client-vitals.js'
import { mapClientLabsListFromApi } from 'src/utils/lab-normalize.js'
import {
  ageAndUnitFromUsDateString,
  isoDateToUsDateString,
  parseUsDateString,
} from 'src/utils/client-form.js'
import { relationshipTokenForApi } from
  'src/utils/build-client-register-clinical.js'

/* eslint-disable camelcase -- API token keys */
const PHONE_TYPE_FROM_API = {
  home: clientPhoneTypeValues.home,
  work: clientPhoneTypeValues.work,
  mobile: clientPhoneTypeValues.mobile,
  cell: clientPhoneTypeValues.mobile,
  fax: clientPhoneTypeValues.fax,
  pager: clientPhoneTypeValues.pager,
  emergency: clientPhoneTypeValues.emergency,
}

const EMAIL_TYPE_FROM_API = {
  personal: clientEmailTypeValues.personal,
  work: clientEmailTypeValues.work,
  other: clientEmailTypeValues.other,
  billing: clientEmailTypeValues.billing,
}

const CONTACT_TYPE_FROM_API = {
  primary: clientContactTypeValues.primary,
  emergency: clientContactTypeValues.emergency,
  billing: clientContactTypeValues.billing,
  legal: clientContactTypeValues.legal,
  caregiver: clientContactTypeValues.caregiver,
  next_of_kin: clientContactTypeValues.nextOfKin,
  other: clientContactTypeValues.other,
}

const RELATIONSHIP_FROM_API = {
  parents: clientRelationshipTypeValues.parents,
  other_family: clientRelationshipTypeValues.otherFamily,
  others: clientRelationshipTypeValues.others,
}

const GENDER_FROM_API = {
  male: clientGenderValues.male,
  female: clientGenderValues.female,
  unknown: clientGenderValues.unknown,
  other: clientGenderValues.unknown,
}

const FMH_RELATIONSHIP_LABEL_BY_API_TOKEN = (() => {
  const m = new Map()
  for (const label of Object.values(clientFamilyRelationshipValues)) {
    m.set(relationshipTokenForApi(label), label)
  }

  return m
})()

function mapFmhRelationshipFromApi(raw) {
  const token = relationshipTokenForApi(raw)
  if (token && FMH_RELATIONSHIP_LABEL_BY_API_TOKEN.has(token)) {
    return FMH_RELATIONSHIP_LABEL_BY_API_TOKEN.get(token)
  }

  return String(raw ?? '').trim()
}

function personalInfo(client) {
  return client?.personal_information ?? client?.basic_info ?? client ?? {}
}

function contactPersonalInfo(item) {
  return item?.personal_information ?? item ?? {}
}

function toSnakeToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function optionalSelectValue(value) {
  const trimmed = String(value ?? '').trim()

  return trimmed || null
}

function resolveCatalogSelectField(
  raw,
  catalogOptions,
  resolveCatalogSelectValue,
) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) {
    return null
  }
  const fromCatalog = resolveCatalogSelectValue?.(catalogOptions, trimmed)

  return fromCatalog ?? optionalSelectValue(trimmed)
}

function pickPrimaryAddress(source) {
  if (!source || typeof source !== 'object') {
    return {}
  }
  const list = source.addresses
  if (Array.isArray(list) && list.length) {
    const active = list.find(
      entry => entry?.status === 1 || entry?.status === 'active',
    )

    return active ?? list[0] ?? {}
  }

  return {
    address: source.address ?? source.address_line1 ?? '',
    address2: source.address2 ?? source.address_line2 ?? '',
    city: source.city ?? '',
    state: source.state ?? '',
    county: source.county ?? '',
    zip_code: source.zip_code ?? source.zipCode ?? '',
    country: source.country ?? '',
  }
}

function addressRecordHasData(addr) {
  if (!addr || typeof addr !== 'object') {
    return false
  }

  return Boolean(
    String(addr.address ?? addr.address_line1 ?? '').trim()
    || String(addr.address2 ?? addr.address_line2 ?? '').trim()
    || String(addr.city ?? '').trim()
    || String(addr.state ?? '').trim()
    || String(addr.zip_code ?? addr.zipCode ?? '').trim()
    || String(addr.county ?? '').trim(),
  )
}

function pickAddressFromApiContact(item) {
  const pi = contactPersonalInfo(item)
  const piAddresses = Array.isArray(pi.addresses) ? pi.addresses : []
  const itemAddresses = Array.isArray(item?.addresses) ? item.addresses : []
  const addresses = piAddresses.length ? piAddresses : itemAddresses

  if (addresses.length) {
    return pickPrimaryAddress({ addresses })
  }

  const nested = item?.address ?? pi?.address
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const fromNested = pickPrimaryAddress(nested)
    if (addressRecordHasData(fromNested)) {
      return fromNested
    }
  }

  return pickPrimaryAddress({ ...pi, ...item })
}

function readSameAsClientAddressFromApi(item) {
  const pi = contactPersonalInfo(item)

  return Boolean(
    item?.same_as_client_address
    ?? item?.sameAsClientAddress
    ?? pi?.same_as_client_address
    ?? pi?.sameAsClientAddress,
  )
}

function mapPhoneTypeFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return PHONE_TYPE_FROM_API[token] ?? ''
}

function mapEmailTypeFromApi(value) {
  const token = toSnakeToken(value)

  return EMAIL_TYPE_FROM_API[token] ?? ''
}

function mapContactTypeFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return CONTACT_TYPE_FROM_API[token] ?? ''
}

function mapRelationshipFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return RELATIONSHIP_FROM_API[token] ?? ''
}

function mapGenderFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }

  return GENDER_FROM_API[token] ?? ''
}

function resolveGenderField(
  raw,
  genderSelectOptions,
  resolveCatalogSelectValue,
) {
  const fromCatalog = resolveCatalogSelectField(
    raw,
    genderSelectOptions,
    resolveCatalogSelectValue,
  )
  if (fromCatalog) {
    return fromCatalog
  }
  const token = toSnakeToken(raw)
  if (!token) {
    return ''
  }
  const match = (genderSelectOptions ?? []).find(option => {
    const valueToken = toSnakeToken(option?.value)
    const labelToken = toSnakeToken(option?.label)

    return valueToken === token || labelToken === token
  })
  if (match?.value) {
    return match.value
  }

  return mapGenderFromApi(raw)
}

function mapSeverityFromApi(value) {
  const token = toSnakeToken(value)
  if (!token) {
    return ''
  }
  const match = Object.values(clientAllergySeverityValues).find(
    label => toSnakeToken(label) === token,
  )

  return match ?? ''
}

function mapPhonesFromApi(phones) {
  const list = Array.isArray(phones) ? phones : []
  const mapped = list
    .map(item => {
      const number = formatPhoneUs(
        normalizePhoneDigits(
          item?.phone_number ?? item?.number ?? item?.phone,
        ),
      )
      const type = mapPhoneTypeFromApi(
        item?.phone_type ?? item?.type,
      )
      if (!number && !type) {
        return null
      }

      return { number, type }
    })
    .filter(Boolean)

  return mapped.length ? mapped : [createEmptyPhone()]
}

function mapEmailsFromApi(emails) {
  const list = Array.isArray(emails) ? emails : []
  const mapped = list
    .map(item => {
      const address = String(
        item?.email ?? item?.address ?? '',
      ).trim()
      const type = mapEmailTypeFromApi(
        item?.email_type ?? item?.type,
      )
      if (!address && !type) {
        return null
      }

      return { address, type }
    })
    .filter(Boolean)

  return mapped.length ? mapped : [createEmptyEmail()]
}

function mapCountryToForm(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return clientCountryDefault
  }
  const lower = raw.toLowerCase()
  if (lower === 'us' || lower === 'usa') {
    return clientCountryDefault
  }

  return raw
}

function mapAddressFieldsToContact(contact, addr) {
  contact.addressLine1 = String(addr?.address ?? addr?.address_line1 ?? '')
    .trim()
  contact.addressLine2 = String(
    addr?.address2 ?? addr?.address_line2 ?? '',
  ).trim()
  contact.city = String(addr?.city ?? '').trim()
  contact.state = String(addr?.state ?? '').trim()
  contact.county = String(addr?.county ?? '').trim()
  contact.zipCode = String(addr?.zip_code ?? addr?.zipCode ?? '').trim()
  contact.country = mapCountryToForm(addr?.country)
}

function findSelfApiContact(contacts, personalInfoId) {
  const list = Array.isArray(contacts) ? contacts : []
  const selfContact = list.find(
    item => toSnakeToken(item?.relationship_type) === 'self',
  )
  if (selfContact) {
    return selfContact
  }
  if (personalInfoId != null && personalInfoId !== '') {
    const idStr = String(personalInfoId)
    const byPi = list.find(
      item => String(item?.personal_information_id ?? '') === idStr,
    )
    if (byPi) {
      return byPi
    }
  }

  return null
}

function resolvePreferredCommunication(client, personal) {
  const selfContact = findSelfApiContact(
    client?.contacts,
    personal?.id ?? personal?.personal_information_id,
  )
  const raw = selfContact?.communication_preference
    ?? personal?.communication_preference
    ?? personal?.preferred_communication
    ?? client?.communication_preference

  return normalizePreferredCommunicationList(raw)
}

/** Client mirror row in contacts (relationship self), not other contacts. */
function isClientPrimaryContact(item) {
  return toSnakeToken(item?.relationship_type) === 'self'
}

function resolveConsentFromApi(personal, client) {
  const raw = personal?.consent ?? client?.consent
  if (raw != null && String(raw).trim()) {
    const usDate = isoDateToUsDateString(raw)

    return usDate || null
  }

  const legacyDate = personal?.communication_authorization_date
    ?? client?.communication_authorization_date
  if (legacyDate != null && String(legacyDate).trim()) {
    const usDate = isoDateToUsDateString(legacyDate)

    return usDate || null
  }

  return null
}

function mapClientContactFromApi(client, personal) {
  const addr = pickPrimaryAddress(personal)
  const contact = createEmptyContactSection()

  mapAddressFieldsToContact(contact, addr)
  contact.phones = mapPhonesFromApi(personal.phones)
  contact.emails = mapEmailsFromApi(personal.emails)
  contact.preferredCommunication = resolvePreferredCommunication(
    client,
    personal,
  )
  contact.consent = resolveConsentFromApi(personal, client)
  contact.additionalNotes = String(
    client?.notes
    ?? client?.additional_notes
    ?? personal?.notes
    ?? '',
  ).trim()

  return contact
}

function addressesMatch(clientAddr, otherAddr) {
  const keys = [
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'county',
    'zipCode',
  ]

  return keys.every(
    key => String(clientAddr[key] ?? '').trim()
      === String(otherAddr[key] ?? '').trim(),
  )
}

function mapOtherContactFromApi(item, clientContact, catalogOptions = {}) {
  if (isClientPrimaryContact(item)) {
    return null
  }
  const pi = contactPersonalInfo(item)
  const {
    resolveCatalogSelectValue,
    prefixSelectOptions = [],
    suffixSelectOptions = [],
    contactTypeSelectOptions = [],
    relationshipTypeSelectOptions = [],
  } = catalogOptions
  const other = createEmptyOtherContact()
  other.id = nextContactId()
  other.apiId = item?.id ?? item?.contact_id ?? null
  const rawContactType = item?.contact_type ?? item?.contactType
  other.contactType = resolveCatalogSelectField(
    rawContactType,
    contactTypeSelectOptions,
    resolveCatalogSelectValue,
  )
    ?? mapContactTypeFromApi(rawContactType)
    ?? ''
  const rawRelationshipType = item?.relationship_type ?? item?.relationshipType
  other.relationshipType = resolveCatalogSelectField(
    rawRelationshipType,
    relationshipTypeSelectOptions,
    resolveCatalogSelectValue,
  )
    ?? mapRelationshipFromApi(rawRelationshipType)
    ?? ''
  other.responsibleForPayments = Boolean(
    item?.responsive_for_payment
    ?? item?.responsible_for_payments
    ?? item?.responsibleForPayments,
  )
  other.isPreferredPointOfContact = Boolean(
    item?.is_preferred_point_of_contact
    ?? item?.isPreferredPointOfContact,
  )
  other.prefix = resolveCatalogSelectField(
    pi.prefix ?? item?.prefix,
    prefixSelectOptions,
    resolveCatalogSelectValue,
  )
  other.firstName = String(pi.first_name ?? item?.first_name ?? '').trim()
  other.middleName = String(
    pi.middle_name ?? item?.middle_name ?? '',
  ).trim()
  other.lastName = String(pi.last_name ?? item?.last_name ?? '').trim()
  other.suffix = resolveCatalogSelectField(
    pi.suffix ?? item?.suffix,
    suffixSelectOptions,
    resolveCatalogSelectValue,
  )
  other.phones = mapPhonesFromApi(pi.phones ?? item?.phones)
  other.emails = mapEmailsFromApi(pi.emails ?? item?.emails)

  const sameAsFromApi = readSameAsClientAddressFromApi(item)
  const addr = pickAddressFromApiContact(item)
  mapAddressFieldsToContact(other, addr)

  if (sameAsFromApi) {
    other.sameAsClientAddress = true
    copyClientAddressToContact(clientContact, other)
  } else if (addressesMatch(clientContact, other)) {
    other.sameAsClientAddress = true
  }

  return other
}

function mapAllergiesFromApi(client) {
  const section = createEmptyAllergiesSection()
  const list = Array.isArray(client?.allergies) ? client.allergies : []
  section.entries = list.map(item => {
    const startRaw = item?.start_date ?? item?.startDate ?? ''
    let startYear = ''
    if (startRaw) {
      const year = String(startRaw).slice(0, 4)
      if (/^\d{4}$/.test(year)) {
        startYear = year
      }
    }

    return {
      id: nextAllergyId(),
      allergy: String(item?.name ?? item?.allergy ?? '').trim(),
      severity: mapSeverityFromApi(item?.severity),
      startYear,
    }
  })

  if (!section.entries.length && client?.no_allergies) {
    section.entries = []
  }

  return section
}

/**
 * Map API catalog key (or camelCase / label) to form display label.
 */
function insuranceLabelFromApiKey(mapObj, rawKey) {
  const key = String(rawKey ?? '').trim()
  if (!key) {
    return null
  }
  if (Object.prototype.hasOwnProperty.call(mapObj, key)) {
    return mapObj[key]
  }
  const camel = key.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())
  if (Object.prototype.hasOwnProperty.call(mapObj, camel)) {
    return mapObj[camel]
  }
  const lower = key.toLowerCase()
  for (const [k, label] of Object.entries(mapObj)) {
    if (k.toLowerCase() === lower || String(label).toLowerCase() === lower) {
      return label
    }
  }

  return null
}

function insuranceUrlOrNull(value) {
  const s = String(value ?? '').trim()

  return s || null
}

function mapInsuranceProfileFromApi(row) {
  const payerPlan = String(
    row?.payer_plan_name ?? row?.payerPlanName ?? '',
  ).trim()

  return {
    id: nextInsuranceId(),
    apiId: row?.id ?? row?.ID ?? null,
    payerId: null,
    payerName: payerPlan,
    planName: '',
    priority: insuranceLabelFromApiKey(
      clientInsurancePriorityValues,
      row?.insurance_priority ?? row?.insurancePriority,
    ),
    memberId: String(row?.member_id ?? row?.memberId ?? '').trim(),
    insuranceType: insuranceLabelFromApiKey(
      clientInsuranceTypeValues,
      row?.insurance_type ?? row?.insuranceType,
    ),
    policyEffectiveDate: isoDateToUsDateString(
      row?.policy_effective_date ?? row?.policyEffectiveDate,
    ),
    policyExpirationDate: isoDateToUsDateString(
      row?.policy_expiration_date ?? row?.policyExpirationDate,
    ),
    relationshipToSubscriber: insuranceLabelFromApiKey(
      clientInsuranceRelationshipValues,
      row?.relationship_to_subscriber ?? row?.relationshipToSubscriber,
    ),
    subscriberName: String(
      row?.subscriber_name ?? row?.subscriberName ?? '',
    ).trim(),
    medicaidRecipientId: String(
      row?.medicaid_id ?? row?.medicaidId ?? '',
    ).trim(),
    medicareMemberId: String(
      row?.medicare_id ?? row?.medicareId ?? '',
    ).trim(),
    goldenCardMemberId: String(
      row?.assistance_program_id ?? row?.assistanceProgramId ?? '',
    ).trim(),
    otherInsuranceId: String(
      row?.other_insurance_id ?? row?.otherInsuranceId ?? '',
    ).trim(),
    status:
      insuranceLabelFromApiKey(
        clientInsuranceStatusValues,
        row?.insurance_status ?? row?.insuranceStatus,
      )
      ?? clientInsuranceStatusValues.active,
    frontCardFile: insuranceUrlOrNull(
      row?.front_card_url ?? row?.frontCardUrl,
    ),
    backCardFile: insuranceUrlOrNull(
      row?.back_card_url ?? row?.backCardUrl,
    ),
    deleted: false,
    deletedAt: null,
  }
}

function mapInsuranceSectionFromApi(client) {
  const list = Array.isArray(client?.insurance)
    ? client.insurance
    : Array.isArray(client?.insurances)
      ? client.insurances
      : []

  return {
    profiles: list.map(mapInsuranceProfileFromApi),
  }
}

function mapFamilyMedicalHistoryFromApi(entries) {
  const section = createEmptyFamilyMedicalHistorySection()
  const list = Array.isArray(entries) ? entries : []
  section.entries = list.map(item => {
    const relRaw = item?.family_relationship
      ?? item?.relationship
      ?? item?.familyRelationship
      ?? ''
    const entry = {
      id: nextFamilyMedicalHistoryId(),
      familyRelationship: mapFmhRelationshipFromApi(relRaw),
      medicalConditions: String(
        item?.medical_conditions
        ?? item?.medical_condition
        ?? item?.medicalConditions
        ?? '',
      ).trim(),
    }
    const apiId = item?.id ?? item?.ID
    if (apiId != null && String(apiId).trim() !== '') {
      entry.apiId = String(apiId)
    }

    return entry
  })

  return section
}

function resolveAgeFields(personal, dobUs, resolveAgeUnitCode) {
  const ageRaw = personal?.age
  const unitRaw = personal?.age_unit ?? personal?.ageUnit
  if (dobUs && parseUsDateString(dobUs)) {
    const derived = ageAndUnitFromUsDateString(dobUs)
    if (derived) {
      const unit = resolveAgeUnitCode?.(derived.unit) ?? derived.unit

      return {
        age: String(derived.age),
        ageUnit: unit,
      }
    }
  }
  if (ageRaw != null && ageRaw !== '') {
    const unit = resolveAgeUnitCode?.(unitRaw)
      ?? unitRaw
      ?? ''

    return {
      age: String(ageRaw),
      ageUnit: unit,
    }
  }

  return { age: '', ageUnit: resolveAgeUnitCode?.('years') ?? 'years' }
}

function resolveClinicianValue(client, personal) {
  const id = personal?.clinician_id
    ?? client?.clinician_id
    ?? personal?.assigned_clinician_id
  if (id != null && id !== '') {
    return String(id)
  }
  const clinicians = client?.clinicians ?? client?.clinician_assignments
  if (Array.isArray(clinicians) && clinicians[0]?.id != null) {
    return String(clinicians[0].id)
  }

  return ''
}

/**
 * Maps a client list/detail API payload into the add/edit client form shape.
 */
export function mapClientApiToForm(client, options = {}) {
  const {
    resolveAgeUnitCode,
    defaultAgeUnitValue,
    resolveCatalogSelectValue,
    prefixSelectOptions = [],
    suffixSelectOptions = [],
    contactTypeSelectOptions = [],
    relationshipTypeSelectOptions = [],
    raceSelectOptions = [],
    ethnicitySelectOptions = [],
    genderSelectOptions = [],
  } = options
  if (!client || typeof client !== 'object') {
    return null
  }

  const personal = personalInfo(client)
  const dobResolved = isoDateToUsDateString(personal.dob ?? client.dob)
  const ageFields = resolveAgeFields(
    personal,
    dobResolved,
    resolveAgeUnitCode,
  )
  if (!ageFields.ageUnit && defaultAgeUnitValue) {
    ageFields.ageUnit = defaultAgeUnitValue()
  }

  const contact = mapClientContactFromApi(client, personal)
  const otherRaw = client.contacts ?? client.other_contacts ?? []
  const catalogOptions = {
    resolveCatalogSelectValue,
    prefixSelectOptions,
    suffixSelectOptions,
    contactTypeSelectOptions,
    relationshipTypeSelectOptions,
  }
  contact.otherContacts = (Array.isArray(otherRaw) ? otherRaw : [])
    .map(item => mapOtherContactFromApi(item, contact, catalogOptions))
    .filter(Boolean)
  if (contact.otherContacts.length) {
    contact.activeOtherContactId = contact.otherContacts[0].id
  }

  applyPreferredPointOfContactFromApi(contact)

  if (!contact.preferredPointOfContactId) {
    const preferredPointApiId = personal?.preferred_point_of_contact_id
      ?? client?.preferred_point_of_contact_id
    if (preferredPointApiId != null && String(preferredPointApiId).trim()) {
      const match = contact.otherContacts.find(
        item => String(item.apiId) === String(preferredPointApiId),
      )
      if (match) {
        contact.preferredPointOfContactId = match.id
        match.isPreferredPointOfContact = true
      }
    } else {
      const prefIndex = personal?.preferred_point_of_contact_index
        ?? client?.preferred_point_of_contact_index
      if (
        Number.isInteger(prefIndex)
        && prefIndex >= 0
        && prefIndex < contact.otherContacts.length
      ) {
        contact.preferredPointOfContactId =
          contact.otherContacts[prefIndex].id
        contact.otherContacts[prefIndex].isPreferredPointOfContact = true
      }
    }
    applyPreferredPointOfContactFromApi(contact)
  }

  const ssnRaw = personal.ssn ?? client.ssn ?? client.social_security_number
  let ssnDigits = ''
  if (ssnRaw != null && ssnRaw !== '') {
    ssnDigits = String(ssnRaw).replace(/\D/g, '').slice(0, 9)
  }

  return {
    [ck.id]: client.id ?? client.client_id ?? null,
    [ck.clientNumber]: String(
      client.client_number ?? client[ck.clientNumber] ?? '',
    ).trim(),
    [ck.prefix]: resolveCatalogSelectField(
      personal.prefix,
      prefixSelectOptions,
      resolveCatalogSelectValue,
    ),
    [ck.firstName]: String(personal.first_name ?? '').trim(),
    [ck.middleName]: String(personal.middle_name ?? '').trim(),
    [ck.lastName]: String(personal.last_name ?? '').trim(),
    [ck.suffix]: resolveCatalogSelectField(
      personal.suffix,
      suffixSelectOptions,
      resolveCatalogSelectValue,
    ),
    [ck.gender]: resolveGenderField(
      personal.gender ?? personal.sex ?? client.gender ?? client.sex,
      genderSelectOptions,
      resolveCatalogSelectValue,
    ),
    [ck.race]: resolveCatalogSelectField(
      personal.race,
      raceSelectOptions,
      resolveCatalogSelectValue,
    ),
    [ck.ethnicity]: resolveCatalogSelectField(
      personal.ethnicity,
      ethnicitySelectOptions,
      resolveCatalogSelectValue,
    ),
    [ck.dob]: dobResolved,
    [ck.age]: ageFields.age,
    [ck.ageUnit]: ageFields.ageUnit,
    [ck.socialSecurityNumber]: ssnDigits,
    [ck.admissionDate]: isoDateToUsDateString(
      client.admission_date ?? personal.admission_date,
    ),
    [ck.assignedClinician]: resolveClinicianValue(client, personal),
    [ck.status]: String(client.status ?? personal.status ?? 'active').trim(),
    [clientFormSections.contact]: contact,
    [clientFormSections.familyMedicalHistory]: mapFamilyMedicalHistoryFromApi(
      client.medical_history
      ?? client.family_medical_history
      ?? client.familyMedicalHistory
      ?? client.medicalHistory,
    ),
    [clientFormSections.allergies]: mapAllergiesFromApi(client),
    [clientFormSections.insurance]: mapInsuranceSectionFromApi(client),
    [clientFormSections.vitals]: createEmptyVitalsSection(),
    [clientFormSections.labs]: mapClientLabsListFromApi(
      client.labs
      ?? client.lab_orders
      ?? client.labOrders
      ?? [],
    ),
  }
}
