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

export function mapClientListViewItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

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
    [ck.name]: String(item.name ?? '').trim(),
    [ck.email]: emailEntries[0]?.email ?? '',
    emailEntries,
    phoneEntries,
    allergyEntries,
    [ck.dob]: item.dob ?? '',
    [ck.clinicians]: clinicianEntries.map(entry => entry.name).join(', '),
    clinicianEntries,
    [ck.admissionDate]: item.admission_date ?? '',
    [ck.status]: item.status ?? '',
  }

  return formatClientDisplay(mapped, t)
}
