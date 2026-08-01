import { clientFieldKeys as ck } from 'components/constants.js'
import { typeNames } from 'components/constants.js'
import {
  formatClientDisplay,
  resolveClientListClinicianEntries,
} from 'components/helpers.js'
import { resolveClientListEmailEntries } from
  'src/utils/client-list-email.js'
import { resolveClientListPhoneEntries } from
  'src/utils/client-list-phones.js'
import { resolveClientListAllergyEntries } from
  'src/utils/client-list-allergies.js'
import { formatPersonDisplayNameFromRecord } from
  'src/utils/person-display-name.js'

function resolveClientListPhotoFileId(item) {
  if (!item || typeof item !== 'object') {
    return null
  }

  const personal = item.personal_information
    ?? item.basic_info
    ?? item.personalInformation
    ?? item
  const raw = personal.photo_file_id
    ?? personal.photoFileId
    ?? item.photo_file_id
    ?? item.photoFileId
  const id = Number(raw)

  return Number.isFinite(id) && id > 0 ? id : null
}

function resolveListViewClinicianEntries(clinicians) {
  if (!Array.isArray(clinicians) || !clinicians.length) {
    return []
  }

  const withDisplayName = clinicians.every(
    item => item?.display_name != null || item?.initials != null,
  )
  if (!withDisplayName) {
    return resolveClientListClinicianEntries({ clinicians })
  }

  return clinicians
    .map(item => {
      if (!item || typeof item !== typeNames.object) {
        return null
      }
      const name = String(item.display_name ?? '').trim()
      if (!name) {
        return null
      }

      return {
        id: item.id ?? null,
        name,
        personName: name,
        specialty: String(item.specialty ?? '').trim(),
        initials: String(item.initials ?? '').trim(),
      }
    })
    .filter(Boolean)
}

export function mapClientListViewItem(item, t, options = {}) {
  if (!item || item.id == null) {
    return null
  }

  const {
    prefixSelectOptions = [],
    suffixSelectOptions = [],
  } = options

  const emailEntries = item.email != null
    ? resolveClientListEmailEntries({ emails: item.email })
    : []
  const phoneEntries = item.phones != null
    ? resolveClientListPhoneEntries(item.phones)
    : []
  const allergyEntries = item.allergies != null
    ? resolveClientListAllergyEntries(item.allergies)
    : []
  const clinicianEntries = item.clinicians != null
    ? resolveListViewClinicianEntries(item.clinicians)
    : []

  const mapped = {
    id: item.id,
    [ck.clientNumber]: String(item.client_number ?? '').trim(),
    [ck.name]: formatPersonDisplayNameFromRecord(
      item,
      {
        prefixSelectOptions,
        suffixSelectOptions,
      },
      item.name,
    ),
    [ck.email]: emailEntries[0]?.email ?? '',
    emailEntries,
    phoneEntries,
    allergyEntries,
    [ck.dob]: item.dob ?? '',
    [ck.clinicians]: clinicianEntries.map(entry => entry.name).join(', '),
    clinicianEntries,
    [ck.admissionDate]: item.admission_date ?? '',
    [ck.status]: item.status ?? '',
    [ck.photoFileId]: resolveClientListPhotoFileId(item),
  }

  return formatClientDisplay(mapped, t)
}

function nonNegativeCount(value) {
  const n = Number(value)

  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function emptyClientListSummary() {
  return {
    totalClients: 0,
    upcomingAppointments: 0,
    missingInformation: 0,
    pendingBilling: 0,
    authorizationsExpiring: 0,
  }
}

/**
 * Maps `data.summary` from GET /client/v1/list-view.
 * @param {Record<string, unknown>|null|undefined} raw
 */
export function mapClientListSummary(raw) {
  if (!raw || typeof raw !== 'object') {
    return emptyClientListSummary()
  }

  return {
    totalClients: nonNegativeCount(
      raw.total_clients ?? raw.totalClients,
    ),
    upcomingAppointments: nonNegativeCount(
      raw.upcoming_appointments ?? raw.upcomingAppointments,
    ),
    missingInformation: nonNegativeCount(
      raw.missing_information ?? raw.missingInformation,
    ),
    pendingBilling: nonNegativeCount(
      raw.pending_billing ?? raw.pendingBilling,
    ),
    authorizationsExpiring: nonNegativeCount(
      raw.authorizations_expiring ?? raw.authorizationsExpiring,
    ),
  }
}
