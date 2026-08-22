import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { displayDateToApi } from 'src/utils/app-datetime.js'

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

function readItems(envelope) {
  if (Array.isArray(envelope)) {
    return envelope
  }

  return Array.isArray(envelope?.items) ? envelope.items : []
}

export function mapLicenseTypesToSelectOptions(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item?.id != null)
    .map(item => {
      const name = String(item.name ?? '').trim()
      const abbreviation = String(
        item.abbreviation ?? item.code ?? '',
      ).trim()
      const label = name && abbreviation && name !== abbreviation
        ? `${name} (${abbreviation})`
        : (name || abbreviation)

      return {
        label,
        value: item.id,
        code: String(item.code ?? '').trim(),
        abbreviation,
        category: String(item.category ?? '').trim(),
      }
    })
    .filter(option => option.label)
}

export async function fetchLicenseTypes(state) {
  const issuingState = String(state ?? '').trim().toUpperCase()
  if (!issuingState) {
    return []
  }
  const response = await apiInstance.get(apiPaths.licenseTypes, {
    params: { state: issuingState },
  })
  return mapLicenseTypesToSelectOptions(readItems(readEnvelope(response)))
}

export async function fetchProviderTypes() {
  const response = await apiInstance.get(apiPaths.providerTypes)
  return mapLicenseTypesToSelectOptions(readItems(readEnvelope(response)))
}

export async function fetchStaffLicenses(staffId) {
  const response = await apiInstance.get(apiPaths.staffLicenses(staffId))
  return readItems(readEnvelope(response))
}

export async function createStaffLicense(staffId, body) {
  const response = await apiInstance.post(
    apiPaths.staffLicenses(staffId),
    body,
  )

  return readEnvelope(response)
}

export async function updateStaffLicense(staffId, licenseId, body) {
  const response = await apiInstance.put(
    apiPaths.staffLicenseById(staffId, licenseId),
    body,
  )

  return readEnvelope(response)
}

export async function deleteStaffLicense(staffId, licenseId) {
  await apiInstance.delete(apiPaths.staffLicenseById(staffId, licenseId))
}

export async function fetchClinicalEligibility(staffId) {
  const response = await apiInstance.get(
    apiPaths.staffClinicalEligibility(staffId),
  )
  const envelope = readEnvelope(response)
  const capabilities = Array.isArray(envelope?.capabilities)
    ? envelope.capabilities
    : []

  return {
    staffId: envelope?.staff_id ?? envelope?.staffId ?? staffId,
    capabilities,
  }
}

export function staffLicenseApiBody(license) {
  /* eslint-disable camelcase -- API payload field names */
  const source = String(license?.source ?? '').trim().toUpperCase()
  return {
    license_type_id: license?.licenseTypeId ?? license?.license_type_id,
    license_number: String(
      license?.identifier ?? license?.license_number ?? '',
    ).trim(),
    state: String(license?.state ?? '').trim(),
    expiration_date: displayDateToApi(
      license?.expirationDate ?? license?.expiration_date,
    ) || null,
    valid_from: displayDateToApi(
      license?.validFrom ?? license?.valid_from,
    ) || null,
    status: String(license?.status ?? 'Active').trim(),
    is_primary: Boolean(license?.isPrimary ?? license?.is_primary),
    attachment_file_id:
      license?.attachmentFileId ?? license?.attachment_file_id ?? null,
    source: source === 'NPI' ? 'NPI' : 'MANUAL',
  }
  /* eslint-enable camelcase */
}

export function normalizeLicenseNumberForDuplicate(value) {
  return String(value ?? '').trim().replace(/\s+/g, '').toUpperCase()
}

export function isDuplicateStaffLicense(
  candidate,
  licenses,
  excludeId,
) {
  const typeId = String(
    candidate?.licenseTypeId ?? candidate?.license_type_id ?? '',
  )
  const state = String(candidate?.state ?? '').trim().toUpperCase()
  const number = normalizeLicenseNumberForDuplicate(
    candidate?.identifier
    ?? candidate?.licenseNumber
    ?? candidate?.license_number,
  )
  if (!typeId || !state || !number) {
    return false
  }

  return (licenses ?? []).some(row => {
    if (excludeId != null && String(row?.id) === String(excludeId)) {
      return false
    }

    return String(row?.licenseTypeId ?? row?.license_type_id ?? '')
      === typeId
      && String(row?.state ?? '').trim().toUpperCase() === state
      && normalizeLicenseNumberForDuplicate(
        row?.identifier ?? row?.licenseNumber ?? row?.license_number,
      ) === number
  })
}

export function isPersistedStaffLicenseId(id) {
  if (id == null || id === '') {
    return false
  }
  const value = String(id).trim()
  if (value.startsWith('staff-license-')) {
    return false
  }
  const numeric = Number(value)

  return Number.isInteger(numeric) && numeric > 0
}

export function apiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const msg = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return typeof msg === 'string' && msg.trim() ? msg : fallback
}
