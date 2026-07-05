import {
  clientFieldKeys,
  clientGenderValues,
  clientStatus,
  typeNames,
} from 'components/constants.js'
import {
  buildClientRegisterBody,
} from 'src/utils/build-client-register-body.js'
import {
  resolveClientListEmailEntries,
  resolveClientListEmailSearchText,
} from 'src/utils/client-list-email.js'
import { resolveCatalogOptionLabel } from 'src/utils/catalogs.js'
import {
  formatSsnMasked,
  normalizeIdNumberMaskedDisplay,
  normalizeSsnDigits,
} from 'src/utils/client-form.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import {
  clinicianInitialsFromPersonName,
  formatClinicianDisplayLabel,
  formatClinicianPersonName,
} from 'src/utils/clinician-display.js'

function isEmpty(value) {
  return value === null || value === undefined || value === ''
}

function pickExpiration(td, root) {
  let expiration =
    td?.expiration ?? td?.expires_at ?? td?.expiresAt
    ?? root?.expiration ?? root?.expires_at ?? root?.expiresAt
  if (!isEmpty(expiration)) {
    return String(expiration)
  }
  const ei = root?.expires_in ?? td?.expires_in
  if (typeof ei === 'number' && Number.isFinite(ei)) {
    return new Date(Date.now() + ei * 1000).toISOString()
  }

  return ''
}

function normalizeLoginModules(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map(m => String(m).trim()).filter(Boolean)
}

function normalizeLoginPermissions(raw) {
  return normalizeLoginModules(raw)
}

function tenantIdFromConfig(config) {
  if (!config || typeof config !== typeNames.object) {
    return null
  }
  const raw = config.tenant_id ?? config.tenantId
  const id = Number(raw)

  return Number.isFinite(id) ? id : null
}

function findLoginConfigData(node, depth = 0) {
  if (!node || typeof node !== typeNames.object || depth > 5) {
    return null
  }
  if (node.config_data && typeof node.config_data === typeNames.object) {
    return node.config_data
  }
  if (node.configData && typeof node.configData === typeNames.object) {
    return node.configData
  }
  if (node.data && typeof node.data === typeNames.object) {
    return findLoginConfigData(node.data, depth + 1)
  }

  return null
}

export function extractLoginTenantId(body) {
  if (!body || typeof body !== typeNames.object) {
    return null
  }

  return tenantIdFromConfig(findLoginConfigData(body))
}

export function extractLoginConfigData(body) {
  if (!body || typeof body !== typeNames.object) {
    return null
  }

  return findLoginConfigData(body)
}

function normalizeLoginConfigData(raw) {
  if (!raw || typeof raw !== typeNames.object) {
    return null
  }

  return {
    timezone: String(raw.timezone ?? '').trim(),
    locale: String(raw.locale ?? '').trim(),
    // eslint-disable-next-line camelcase -- API field name
    date_format: String(raw.date_format ?? raw.dateFormat ?? '').trim(),
  }
}

function extractFromFiCeEnvelope(body) {
  const envelope = body.data
  if (!envelope?.token_data?.token) {
    return null
  }
  const td = envelope.token_data
  const refreshToken =
    envelope.refresh_token_data?.token
    || envelope.refreshTokenData?.token

  return {
    token: td.token,
    expiration: pickExpiration(td, {}),
    refreshToken,
    modules: normalizeLoginModules(envelope.modules),
    permissions: normalizeLoginPermissions(envelope.permissions),
    subtenants: normalizeLoginSubtenants(envelope.subtenants),
    tenantId: tenantIdFromConfig(envelope.config_data ?? envelope.configData),
    configData: normalizeLoginConfigData(
      envelope.config_data ?? envelope.configData,
    ),
  }
}

function extractFromRoots(body) {
  const roots = []
  const push = r => {
    if (r && typeof r === 'object' && !roots.includes(r)) {
      roots.push(r)
    }
  }
  push(body.data)
  push(body.data?.data)
  if (body.token || body.access_token) {
    push(body)
  }
  if (body.token_data) {
    push(body)
  }

  for (const root of roots) {
    const td = root.token_data
    const token =
      td?.token
      || root.token
      || root.access_token
    if (!token) {
      continue
    }
    const refreshToken =
      root.refresh_token_data?.token
      || root.refreshTokenData?.token

    return {
      token,
      expiration: pickExpiration(td || {}, root),
      refreshToken,
      modules: normalizeLoginModules(root.modules),
      permissions: normalizeLoginPermissions(root.permissions),
      subtenants: normalizeLoginSubtenants(root.subtenants),
      tenantId: tenantIdFromConfig(root.config_data ?? root.configData),
      configData: normalizeLoginConfigData(
        root.config_data ?? root.configData,
      ),
    }
  }

  return null
}

export function normalizeLoginSubtenants(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map(item => {
      if (!item || typeof item !== typeNames.object) {
        return null
      }
      const id = Number(item.id)
      if (!Number.isFinite(id)) {
        return null
      }
      const code = String(item.code ?? item.subtenant_code ?? '').trim()
      const name = String(
        item.name
        ?? item.subtenant_name
        ?? item.label
        ?? code
        ?? '',
      ).trim() || `Subtenant ${id}`

      return {
        id,
        name,
        code,
      }
    })
    .filter(Boolean)
}

function findSubtenantsArray(node, depth = 0) {
  if (!node || typeof node !== typeNames.object || depth > 5) {
    return null
  }
  if (Array.isArray(node.subtenants)) {
    return node.subtenants
  }
  if (Array.isArray(node.sub_tenants)) {
    return node.sub_tenants
  }
  if (node.data && typeof node.data === typeNames.object) {
    const nested = findSubtenantsArray(node.data, depth + 1)
    if (nested) {
      return nested
    }
  }

  return null
}

export function extractLoginSubtenants(body) {
  if (!body || typeof body !== typeNames.object) {
    return []
  }
  const raw = findSubtenantsArray(body)
  if (!raw) {
    return []
  }

  return normalizeLoginSubtenants(raw)
}

function findLoginUserInfo(node, depth = 0) {
  if (!node || typeof node !== typeNames.object || depth > 5) {
    return null
  }
  if (node.user_info && typeof node.user_info === typeNames.object) {
    return node.user_info
  }
  if (node.userInfo && typeof node.userInfo === typeNames.object) {
    return node.userInfo
  }
  if (node.data && typeof node.data === typeNames.object) {
    return findLoginUserInfo(node.data, depth + 1)
  }

  return null
}

export function extractLoginUserInfo(body) {
  const raw = findLoginUserInfo(body)
  if (!raw) {
    return null
  }
  const id = Number(raw.id)

  return {
    id: Number.isFinite(id) ? id : null,
    username: String(raw.username ?? '').trim(),
    status: raw.status ?? null,
    description: String(raw.description ?? '').trim(),
    changePassword: Boolean(
      raw.change_password ?? raw.changePassword ?? false,
    ),
  }
}

export function extractLoginModules(body) {
  if (!body || typeof body !== 'object') {
    return []
  }
  const candidates = [body, body.data, body.data?.data]
  for (const root of candidates) {
    if (root && Array.isArray(root.modules)) {
      return normalizeLoginModules(root.modules)
    }
  }

  return []
}

export function extractLoginPermissions(body) {
  if (!body || typeof body !== 'object') {
    return []
  }
  const candidates = [body, body.data, body.data?.data]
  for (const root of candidates) {
    if (root && Array.isArray(root.permissions)) {
      return normalizeLoginPermissions(root.permissions)
    }
  }

  return []
}

export function formatClientListName(firstName, middleName, lastName, suffix) {
  const first = String(firstName ?? '').trim()
  const middle = String(middleName ?? '').trim()
  const last = String(lastName ?? '').trim()
  const suf = String(suffix ?? '').trim()
  if (!last && !first) {
    return ''
  }
  const middlePart = middle ? ` ${middle}` : ''
  const suffixPart = suf ? ` ${suf}` : ''

  return `${last}, ${first}${middlePart}${suffixPart}`.trim()
}

export function buildClientCreateBody(form) {
  return buildClientRegisterBody(form)
}

export { buildClientUpdateBody } from 'src/utils/build-client-update-body.js'
export { mapClientApiToForm } from 'src/utils/map-client-api-to-form.js'

export function extractClientMutationResponse(data) {
  if (!data || typeof data !== typeNames.object) {
    return null
  }
  let root = data.data
  if (root == null || typeof root !== typeNames.object || Array.isArray(root)) {
    root = data
  }
  if (root.client && typeof root.client === typeNames.object) {
    return root.client
  }

  return root
}

export function extractClientWarnings(data) {
  if (!data || typeof data !== typeNames.object) {
    return []
  }
  const root = data.data != null && typeof data.data === typeNames.object
    ? data.data
    : data
  const list = root?.warnings ?? data?.warnings

  return Array.isArray(list) ? list : []
}

function clientPersonalInfo(client) {
  return client.personal_information ?? client.basic_info ?? client
}

function mapGenderLabelForList(value) {
  const token = String(value ?? '').trim().toLowerCase()
  if (token === 'male') {
    return clientGenderValues.male
  }
  if (token === 'female') {
    return clientGenderValues.female
  }
  if (token === 'unknown') {
    return clientGenderValues.unknown
  }

  return String(value ?? '').trim()
}

function resolveClientListClinicianNames(client) {
  const clinicians = client.clinicians
    ?? client.clinician_assignments
    ?? client.assigned_clinicians
  if (!Array.isArray(clinicians) || !clinicians.length) {
    return []
  }

  return clinicians
    .map(item => {
      if (!item || typeof item !== typeNames.object) {
        return ''
      }

      return formatClinicianDisplayLabel(item)
    })
    .filter(Boolean)
}

export function resolveClientListClinicianEntries(client) {
  const clinicians = client.clinicians
    ?? client.clinician_assignments
    ?? client.assigned_clinicians
  if (!Array.isArray(clinicians) || !clinicians.length) {
    return []
  }

  return clinicians
    .map(item => {
      if (!item || typeof item !== typeNames.object) {
        return null
      }
      const personName = formatClinicianPersonName(item)
      const name = formatClinicianDisplayLabel(item)
      if (!name) {
        return null
      }

      return {
        id: item.id ?? item.clinician_id ?? null,
        name,
        personName: personName || name.split(' - ')[0]?.trim() || name,
        specialty: String(item.specialty ?? '').trim(),
        initials: clinicianInitialsFromPersonName(
          personName || name,
        ),
      }
    })
    .filter(Boolean)
}

function resolveClientListClinicians(client) {
  return resolveClientListClinicianNames(client).join(', ')
}

function formatClientListDate(value) {
  return apiDateToDisplay(value) || String(value ?? '').trim()
}

export function resolveClientListStatusVariant(status) {
  const raw = String(status ?? '').trim()
  if (!raw) {
    return ''
  }
  const lower = raw.toLowerCase()
  if (
    lower === 'closed'
    || lower === 'inactive'
    || raw === String(clientStatus.CLOSED)
  ) {
    return lower === 'inactive' ? 'inactive' : 'closed'
  }
  if (
    lower === 'active'
    || lower === 'open'
    || raw === String(clientStatus.OPEN)
  ) {
    return lower === 'active' ? 'active' : 'open'
  }
  if (lower === 'pending') {
    return 'pending'
  }
  if (lower === 'completed') {
    return 'completed'
  }
  if (lower === 'cancelled' || lower === 'canceled') {
    return 'cancelled'
  }
  if (lower === 'discharged') {
    return 'discharged'
  }

  return 'other'
}

function formatClientListStatus(status, t) {
  const raw = String(status ?? '').trim()
  if (!raw) {
    return ''
  }
  const lower = raw.toLowerCase()
  if (lower === 'closed' || raw === String(clientStatus.CLOSED)) {
    return t('closed')
  }
  if (lower === 'inactive') {
    return t('inactive')
  }
  if (lower === 'pending') {
    return t('pending')
  }
  if (lower === 'completed') {
    return t('completed')
  }
  if (lower === 'cancelled' || lower === 'canceled') {
    return t('cancelled')
  }
  if (lower === 'discharged') {
    return t('discharged')
  }
  if (lower === 'active') {
    return t('active')
  }
  if (
    lower === 'open'
    || raw === String(clientStatus.OPEN)
  ) {
    return t('open')
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function mapClient(client, options = {}) {
  if (!client || typeof client !== typeNames.object) {
    return null
  }
  const { suffixSelectOptions = [] } = options
  const ck = clientFieldKeys
  const personal = clientPersonalInfo(client)
  const firstName = String(
    personal.first_name ?? client.first_name ?? client[ck.firstName] ?? '',
  ).trim()
  const middleName = String(
    personal.middle_name ?? client.middle_name ?? client[ck.middleName] ?? '',
  ).trim()
  const lastName = String(
    personal.last_name ?? client.last_name ?? client[ck.lastName] ?? '',
  ).trim()
  const suffixRaw = String(
    personal.suffix ?? client.suffix ?? client[ck.suffix] ?? '',
  ).trim()
  const suffix = resolveCatalogOptionLabel(
    suffixSelectOptions,
    suffixRaw,
  ) || suffixRaw
  const dob = personal.dob ?? client.dob ?? ''
  const idNumberMasked = normalizeIdNumberMaskedDisplay(
    personal.id_number_masked ?? client.id_number_masked ?? '',
  )
  const ssn = personal.id_number
    ?? client.id_number
    ?? client.ssn
    ?? client.social_security_number
  const ssnDigits = normalizeSsnDigits(ssn)
  let taxIdDisplay = ''
  if (idNumberMasked) {
    taxIdDisplay = idNumberMasked
  } else if (ssnDigits) {
    taxIdDisplay = formatSsnMasked(ssnDigits)
  }

  const emailEntries = resolveClientListEmailEntries(client)

  return {
    id: client.id,
    [ck.clientNumber]:
      client.client_number ?? client[ck.clientNumber] ?? '',
    [ck.firstName]: firstName,
    [ck.middleName]: middleName,
    [ck.lastName]: lastName,
    [ck.suffix]: suffix,
    [ck.gender]: mapGenderLabelForList(
      personal.gender ?? personal.sex ?? client.gender ?? client.sex,
    ),
    [ck.age]: personal.age ?? client.age ?? client[ck.age] ?? '',
    [ck.socialSecurityNumber]: taxIdDisplay,
    [ck.name]: formatClientListName(
      firstName,
      middleName,
      lastName,
      suffix,
    ),
    [ck.email]: emailEntries[0]?.email ?? '',
    emailEntries,
    emailSearchText: resolveClientListEmailSearchText(emailEntries),
    [ck.dob]: dob,
    [ck.clinicians]: resolveClientListClinicians(client),
    clinicianEntries: resolveClientListClinicianEntries(client),
    [ck.admissionDate]:
      client.admission_date ?? client[ck.admissionDate] ?? '',
    [ck.status]: client.status ?? '',
  }
}

export function formatClientDisplay(mapped, t) {
  if (!mapped || typeof mapped !== typeNames.object) {
    return null
  }
  const ck = clientFieldKeys
  const out = { ...mapped }

  out[ck.dob] = formatClientListDate(out[ck.dob])
  out[ck.admissionDate] = formatClientListDate(out[ck.admissionDate])
  const rawStatus = out[ck.status]
  out.statusVariant = resolveClientListStatusVariant(rawStatus)
  out[ck.status] = formatClientListStatus(rawStatus, t)

  return out
}

export function extractEnvelopeList(root) {
  if (!root) {
    return []
  }
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root.items)) {
    return root.items
  }
  if (Array.isArray(root.clients)) {
    return root.clients
  }
  if (Array.isArray(root.tenants)) {
    return root.tenants
  }
  if (typeof root === 'object') {
    return Object.values(root).filter(
      v => v && typeof v === 'object'
        && !Array.isArray(v) && v.id != null,
    )
  }

  return []
}

export function extractEnvelopeListPagination(root) {
  if (!root || typeof root !== 'object') {
    return null
  }
  const p = root.pagination
  if (!p || typeof p !== 'object') {
    return null
  }
  const limit = Number(p.limit)
  const offset = Number(p.offset)
  const total = Number(p.total)
  const page = Number(p.page)
  const totalPages = Number(p.total_pages)

  return {
    limit: Number.isFinite(limit) ? limit : 0,
    offset: Number.isFinite(offset) ? offset : 0,
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
  }
}

export function extractOAuthTokenPayload(body) {
  if (!body || typeof body !== 'object') {
    return null
  }
  const fallbackModules = extractLoginModules(body)
  const fallbackPermissions = extractLoginPermissions(body)
  const fallbackSubtenants = extractLoginSubtenants(body)
  const fallbackTenantId = extractLoginTenantId(body)
  const fallbackConfigData = extractLoginConfigData(body)
  const fromEnvelope = extractFromFiCeEnvelope(body)
  if (fromEnvelope) {
    return {
      ...fromEnvelope,
      modules: fromEnvelope.modules?.length
        ? fromEnvelope.modules
        : fallbackModules,
      permissions: fromEnvelope.permissions?.length
        ? fromEnvelope.permissions
        : fallbackPermissions,
      subtenants: fromEnvelope.subtenants?.length
        ? fromEnvelope.subtenants
        : fallbackSubtenants,
      tenantId: fromEnvelope.tenantId ?? fallbackTenantId,
      configData: fromEnvelope.configData ?? fallbackConfigData,
    }
  }

  const fromRoots = extractFromRoots(body)
  if (fromRoots) {
    return {
      ...fromRoots,
      modules: fromRoots.modules?.length
        ? fromRoots.modules
        : fallbackModules,
      permissions: fromRoots.permissions?.length
        ? fromRoots.permissions
        : fallbackPermissions,
      subtenants: fromRoots.subtenants?.length
        ? fromRoots.subtenants
        : fallbackSubtenants,
      tenantId: fromRoots.tenantId ?? fallbackTenantId,
      configData: fromRoots.configData ?? fallbackConfigData,
    }
  }

  return null
}
