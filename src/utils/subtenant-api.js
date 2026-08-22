import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeListPagination } from 'components/helpers.js'
import {
  buildSubtenantRequest,
  normalizeSubtenantFromApi,
} from 'src/utils/subtenant-form.js'
import { mapSubtenantListItem } from 'src/utils/subtenant-list-normalize.js'

function unwrapListRoot(body) {
  const root = body?.data ?? body
  if (Array.isArray(root?.items)) {
    return root
  }
  if (Array.isArray(root)) {
    return { items: root, pagination: null }
  }

  return root
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function subtenantApiErrorMessage(error, fallback = 'Request failed') {
  const data = error?.response?.data
  const message = data?.error?.message
    ?? data?.message
    ?? error?.message

  return String(message || fallback)
}

export async function listSubtenants(params = {}, t) {
  const uiPage = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 20))
  const page = uiPage - 1
  const response = await apiInstance.get(apiPaths.subtenantsList, {
    params: { page, limit },
  })
  const root = unwrapListRoot(response.data)
  const pagination = extractEnvelopeListPagination(root)
    ?? root?.pagination
    ?? null

  return {
    items: (root?.items ?? [])
      .map(item => mapSubtenantListItem(item, t))
      .filter(Boolean),
    pagination,
  }
}

export async function fetchSubtenantById(id) {
  const response = await apiInstance.get(apiPaths.subtenantById(id))
  const raw = unwrapData(response.data)

  return normalizeSubtenantFromApi(raw)
}

export async function createSubtenant(form) {
  const body = buildSubtenantRequest(form)
  const response = await apiInstance.post(apiPaths.subtenantsList, body)

  return normalizeSubtenantFromApi(unwrapData(response.data))
}

export async function updateSubtenant(id, form) {
  const body = buildSubtenantRequest(form)
  const response = await apiInstance.put(apiPaths.subtenantById(id), body)

  return normalizeSubtenantFromApi(unwrapData(response.data))
}

export async function deleteSubtenant(id) {
  await apiInstance.delete(apiPaths.subtenantById(id))
}

export function normalizeDocumentBranding(raw = {}) {
  const row = raw ?? {}

  return {
    subtenantId: row.subtenant_id ?? row.subtenantId ?? null,
    canManage: Boolean(row.can_manage ?? row.canManage),
    entitlementLogo: Boolean(
      row.entitlement_logo ?? row.entitlementLogo,
    ),
    entitlementColors: Boolean(
      row.entitlement_colors ?? row.entitlementColors,
    ),
    entitlementCustomTheme: Boolean(
      row.entitlement_custom_theme ?? row.entitlementCustomTheme,
    ),
    primaryColor: String(
      row.primary_color ?? row.primaryColor ?? '',
    ).trim(),
    secondaryColor: String(
      row.secondary_color ?? row.secondaryColor ?? '',
    ).trim(),
    accentColor: String(
      row.accent_color ?? row.accentColor ?? '',
    ).trim(),
    themePreset: String(
      row.theme_preset ?? row.themePreset ?? 'STANDARD',
    ).trim().toUpperCase() || 'STANDARD',
    effectivePrimaryColor: String(
      row.effective_primary_color ?? row.effectivePrimaryColor ?? '',
    ).trim(),
    effectiveSecondaryColor: String(
      row.effective_secondary_color
        ?? row.effectiveSecondaryColor
        ?? '',
    ).trim(),
    effectiveAccentColor: String(
      row.effective_accent_color ?? row.effectiveAccentColor ?? '',
    ).trim(),
    customColorsApplied: Boolean(
      row.custom_colors_applied ?? row.customColorsApplied,
    ),
  }
}

export async function fetchDocumentBranding(id) {
  const response = await apiInstance.get(
    apiPaths.subtenantDocumentBranding(id),
  )

  return normalizeDocumentBranding(unwrapData(response.data))
}

export async function updateDocumentBranding(id, form = {}) {
  const body = {}
  if (form.primaryColor != null || form.secondaryColor != null
    || form.accentColor != null) {
    /* eslint-disable camelcase -- API body */
    body.primary_color = String(form.primaryColor ?? '').trim()
      || null
    body.secondary_color = String(form.secondaryColor ?? '').trim()
      || null
    body.accent_color = String(form.accentColor ?? '').trim()
      || null
    /* eslint-enable camelcase */
  }
  if (form.themePreset) {
    /* eslint-disable-next-line camelcase -- API body */
    body.theme_preset = String(form.themePreset).trim()
  }
  const response = await apiInstance.put(
    apiPaths.subtenantDocumentBranding(id),
    body,
  )

  return normalizeDocumentBranding(unwrapData(response.data))
}
