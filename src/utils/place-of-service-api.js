import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }

  return []
}

function parseOptionalBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function iconForPlaceOfService(code, name) {
  const byCode = {
    '02': 'videocam',
    '11': 'business',
    '12': 'home',
    '03': 'school',
  }
  const normalizedCode = String(code ?? '').trim()
  if (byCode[normalizedCode]) {
    return byCode[normalizedCode]
  }

  const lowerName = String(name ?? '').toLowerCase()
  if (lowerName.includes('tele')) {
    return 'videocam'
  }
  if (lowerName.includes('office')) {
    return 'business'
  }
  if (lowerName.includes('home')) {
    return 'home'
  }
  if (lowerName.includes('school')) {
    return 'school'
  }

  return 'place'
}

export function normalizePlaceOfServiceFromApi(raw = {}) {
  const active = raw.active == null
    ? true
    : parseOptionalBool(raw.active)

  return {
    id: raw.id ?? null,
    code: String(raw.code ?? '').trim(),
    name: String(raw.name ?? '').trim(),
    active,
    defaultValue: parseOptionalBool(
      raw.default_value ?? raw.defaultValue,
    ),
  }
}

export function formatPlaceOfServiceOptionLabel(name, code) {
  const label = String(name ?? '').trim()
  const normalizedCode = String(code ?? '').trim()
  if (label && normalizedCode) {
    return `${normalizedCode} - ${label}`
  }

  return label || normalizedCode
}

export function mapPlaceOfServiceOptions(rows = []) {
  return rows
    .map(normalizePlaceOfServiceFromApi)
    .filter(row => row.id != null && row.active && row.name)
    .map(row => ({
      label: formatPlaceOfServiceOptionLabel(row.name, row.code),
      value: row.id,
      icon: iconForPlaceOfService(row.code, row.name),
      raw: row,
    }))
}

export function resolveDefaultPlaceOfServiceId(options = []) {
  const defaultOption = options.find(option => option.raw?.defaultValue)

  return defaultOption?.value
    ?? options[0]?.value
    ?? null
}

export async function listActivePlacesOfService() {
  const response = await apiInstance.get(
    apiPaths.appointmentPlacesOfService,
  )

  return mapPlaceOfServiceOptions(unwrapList(response.data))
}
