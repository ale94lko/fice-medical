import { userStatusValues } from 'components/constants.js'
import {
  formatPersonDisplayName,
} from 'src/utils/person-display-name.js'
import {
  staffStatusLabel,
  staffStatusVariant,
} from 'src/utils/staff-status.js'
import { staffHasExistingSystemUser } from 'src/utils/staff-form.js'

export const staffProfileTabKeys = {
  basic: 'basic',
  contact: 'contact',
  employment: 'employment',
  clinical: 'clinical',
  systemAccess: 'systemAccess',
}

function trim(value) {
  return String(value ?? '').trim()
}

function displayOrDash(value) {
  const text = trim(value)

  return text || '—'
}

function field(key, label, value) {
  return {
    key,
    label,
    value: displayOrDash(value),
  }
}

function contactEntries(rows, valueKey, typeKey) {
  return (Array.isArray(rows) ? rows : [])
    .map((row, index) => {
      const value = trim(row?.[valueKey])
      if (!value) {
        return null
      }

      return {
        key: `${valueKey}-${index}`,
        value,
        type: trim(row?.[typeKey]),
      }
    })
    .filter(Boolean)
}

function formatSexLabel(sex, t) {
  const token = trim(sex).toLowerCase()
  if (!token) {
    return ''
  }
  if (token === 'male' || token === 'm') {
    return t('genderMale')
  }
  if (token === 'female' || token === 'f') {
    return t('genderFemale')
  }
  if (token === 'unknown' || token === 'u') {
    return t('genderUnknown')
  }

  return trim(sex)
}

function userStatusLabel(status, t) {
  const token = trim(status).toLowerCase()
  if (token === userStatusValues.active) {
    return t('userStatusActive')
  }
  if (token === userStatusValues.inactive) {
    return t('userStatusInactive')
  }
  if (token === 'pending') {
    return t('userStatusPending')
  }

  return displayOrDash(status)
}

function formatLicenseItem(row, t) {
  const type = trim(row?.type)
  const identifier = trim(row?.identifier)
  const expiration = trim(row?.expirationDate)
  const status = trim(row?.status)
  const primary = row?.isPrimary
    ? ` · ${t('staffLicensePrimaryShort')}`
    : ''
  const head = [type, identifier].filter(Boolean).join(' · ')
  const tail = [expiration, status].filter(Boolean).join(' · ')
  if (!head && !tail) {
    return ''
  }

  return `${head || '—'}${tail ? ` · ${tail}` : ''}${primary}`
}

function formatTaxonomyItem(row, t) {
  const code = trim(row?.code)
  const name = trim(row?.displayName)
  const primary = row?.isPrimary
    ? ` · ${t('staffTaxonomyPrimaryBadge')}`
    : ''
  const head = [code, name].filter(Boolean).join(' — ')
  if (!head) {
    return ''
  }

  return `${head}${primary}`
}

function buildBasicFields(basic = {}, t) {
  return [
    field('prefix', t('prefix'), basic.prefix),
    field('firstName', t('firstName'), basic.firstName),
    field('middleName', t('middleName'), basic.middleName),
    field('lastName', t('lastName'), basic.lastName),
    field('suffix', t('suffix'), basic.suffix),
    field('dob', t('dob'), basic.dob),
    field('sex', t('gender'), formatSexLabel(basic.sex, t)),
  ]
}

function buildContactFields(contact = {}, t) {
  const address = contact.address ?? {}
  const phoneEntries = contactEntries(
    contact.phones,
    'phoneNumber',
    'phoneType',
  )
  const emailEntries = contactEntries(
    contact.emails,
    'email',
    'emailType',
  )

  return [
    field('address', t('addressLine1'), address.address),
    field('address2', t('addressLine2'), address.address2),
    field('city', t('city'), address.city),
    field('state', t('state'), address.state),
    field('zipCode', t('zipCode'), address.zipCode),
    field('county', t('county'), address.county),
    field('country', t('country'), address.country),
    {
      key: 'phones',
      label: t('phone'),
      type: 'phones',
      entries: phoneEntries,
      value: phoneEntries.length
        ? phoneEntries.map(e => e.value).join(', ')
        : '—',
    },
    {
      key: 'emails',
      label: t('email'),
      type: 'emails',
      entries: emailEntries,
      value: emailEntries.length
        ? emailEntries.map(e => e.value).join(', ')
        : '—',
    },
  ]
}

function buildEmploymentFields(employment = {}, t) {
  return [
    field('position', t('staffListColPosition'), employment.position),
    field(
      'status',
      t('status'),
      staffStatusLabel(employment.status, t),
    ),
    field('hireDate', t('staffListColHireDate'), employment.hireDate),
    field(
      'terminationDate',
      t('staffTerminationDate'),
      employment.terminationDate,
    ),
  ]
}

function buildClinicalFields(clinical = {}, t) {
  const licenses = (clinical.licenses ?? [])
    .map(row => formatLicenseItem(row, t))
    .filter(Boolean)
  const taxonomies = (clinical.taxonomies ?? [])
    .map(row => formatTaxonomyItem(row, t))
    .filter(Boolean)
  const fields = [
    field('npi', t('staffNpiLabel'), clinical.npi),
    field('credential', t('staffCredentialLabel'), clinical.credential),
    field(
      'primarySpecialty',
      t('staffPrimarySpecialtyLabel'),
      clinical.primarySpecialty,
    ),
    {
      key: 'licenses',
      label: t('staffLicensesTitle'),
      type: 'list',
      items: licenses,
      value: licenses.length ? licenses.join('; ') : '—',
    },
    {
      key: 'taxonomies',
      label: t('staffTaxonomiesTitle'),
      type: 'list',
      items: taxonomies,
      value: taxonomies.length ? taxonomies.join('; ') : '—',
    },
  ]
  const supervisorName = trim(clinical.supervisorDisplayName)
  if (supervisorName || clinical.supervisorId != null) {
    fields.push(field(
      'supervisor',
      t('staffSupervisorLabel'),
      supervisorName || String(clinical.supervisorId),
    ))
  }

  return fields
}

function buildSystemAccessFields(systemUser = {}, t) {
  const enabled = Boolean(systemUser?.enabled)
    || staffHasExistingSystemUser(systemUser)

  return [
    field(
      'enabled',
      t('staffProfileSystemAccessEnabled'),
      enabled ? t('yes') : t('no'),
    ),
    field('username', t('username'), systemUser.username),
    field('email', t('email'), systemUser.email),
    field(
      'userStatus',
      t('status'),
      enabled ? userStatusLabel(systemUser.status, t) : '',
    ),
  ]
}

/**
 * Build staff profile overview view-model from normalized staff form + meta.
 */
export function buildStaffProfileView(form = {}, meta = {}, t) {
  const basic = form.basic ?? {}
  const contact = form.contact ?? {}
  const employment = form.employment ?? {}
  const clinical = form.clinical ?? {}
  const systemUser = employment.systemUser ?? {}
  const isClinician = Boolean(form.isClinician)
  const staffNo = trim(meta.staffNo ?? meta.code ?? meta.staff_no)
  const fullName = formatPersonDisplayName(basic)
    || trim(meta.name)
    || t('staffProfile')
  const statusRaw = employment.status ?? ''
  const statusLabel = staffStatusLabel(statusRaw, t)
  const statusVariant = staffStatusVariant(statusRaw)
  const sexLabel = formatSexLabel(basic.sex, t)

  return {
    id: meta.id ?? null,
    staffNo,
    fullName,
    photoFileId: basic.photoFileId ?? null,
    isClinician,
    statusLabel,
    statusVariant,
    statusRaw,
    dob: displayOrDash(basic.dob),
    sexLabel: displayOrDash(sexLabel),
    position: displayOrDash(employment.position),
    hireDate: displayOrDash(employment.hireDate),
    clinicianLabel: isClinician
      ? t('staffListClinicianYes')
      : t('staffProfileNotClinician'),
    sections: {
      [staffProfileTabKeys.basic]: {
        icon: 'badge',
        title: t('tabStaffBasicInformation'),
        fields: buildBasicFields(basic, t),
      },
      [staffProfileTabKeys.contact]: {
        icon: 'contact_mail',
        title: t('tabStaffContactInformation'),
        fields: buildContactFields(contact, t),
      },
      [staffProfileTabKeys.employment]: {
        icon: 'work',
        title: t('tabStaffEmployment'),
        fields: buildEmploymentFields(employment, t),
      },
      [staffProfileTabKeys.clinical]: isClinician
        ? {
          icon: 'medical_services',
          title: t('tabStaffClinicalProfile'),
          fields: buildClinicalFields(clinical, t),
        }
        : null,
      [staffProfileTabKeys.systemAccess]: {
        icon: 'manage_accounts',
        title: t('tabStaffSystemAccess'),
        fields: buildSystemAccessFields(systemUser, t),
      },
    },
  }
}
