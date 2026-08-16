import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { findCatalogSelectOption } from 'src/utils/catalogs.js'

export const clinicianCapabilityCode = 'clinician'

function readEnvelope(response) {
  return response?.data?.data ?? response?.data ?? {}
}

export function specialtyCapabilityCodes(item = {}) {
  const raw = item.capabilities ?? item.capabilityCodes ?? []
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map(capability => {
    if (typeof capability === 'string') {
      return capability.trim().toLowerCase()
    }

    return String(capability?.code ?? '').trim().toLowerCase()
  }).filter(Boolean)
}

export function specialtyHasClinicianCapability(item) {
  return specialtyCapabilityCodes(item).includes(clinicianCapabilityCode)
}

export function mapSpecialtiesToSelectOptions(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item?.id != null)
    .map(item => ({
      label: String(item.name ?? item.label ?? '').trim(),
      value: item.id,
      code: String(item.code ?? '').trim(),
      capabilities: specialtyCapabilityCodes(item),
      categoryName: String(
        item.specialty_category_name ?? item.specialtyCategoryName ?? '',
      ).trim(),
    }))
    .filter(option => option.label)
}

export function filterClinicalSpecialtyOptions(options = []) {
  return (Array.isArray(options) ? options : [])
    .filter(specialtyHasClinicianCapability)
}

export function findSpecialtyOption(options, raw) {
  if (raw == null || raw === '') {
    return null
  }
  const list = Array.isArray(options) ? options : []
  const asNumber = Number(raw)
  if (Number.isFinite(asNumber) && String(raw).trim() !== '') {
    const byId = list.find(option => Number(option?.value) === asNumber)
    if (byId) {
      return byId
    }
  }
  const needle = String(raw).trim().toLowerCase()
  const byCodeOrName = list.find(option => {
    const code = String(option?.code ?? '').trim().toLowerCase()
    const label = String(option?.label ?? '').trim().toLowerCase()

    return code === needle || label === needle
  })
  if (byCodeOrName) {
    return byCodeOrName
  }

  return findCatalogSelectOption(list, raw)
}

export function resolveSpecialtySelectValue(options, raw) {
  const match = findSpecialtyOption(options, raw)

  return match?.value ?? null
}

export async function fetchSpecialties({ capability } = {}) {
  const params = {}
  const code = String(capability ?? '').trim()
  if (code) {
    params.capability = code
  }
  const response = await apiInstance.get(apiPaths.specialties, { params })
  const envelope = readEnvelope(response)
  const items = Array.isArray(envelope)
    ? envelope
    : envelope.items ?? envelope.specialties ?? []

  return mapSpecialtiesToSelectOptions(items)
}
