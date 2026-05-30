import {
  clientFieldKeys,
  clientSexValues,
  clientStatus,
  typeNames,
} from 'components/constants.js'
import {
  buildClientRegisterBody,
} from 'src/utils/build-client-register-body.js'

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
    subtenants: normalizeLoginSubtenants(envelope.subtenants),
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
      subtenants: normalizeLoginSubtenants(root.subtenants),
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

function clientPersonalInfo(client) {
  return client.personal_information ?? client.basic_info ?? client
}

function mapSexLabelForList(value) {
  const token = String(value ?? '').trim().toLowerCase()
  if (token === 'male') {
    return clientSexValues.male
  }
  if (token === 'female') {
    return clientSexValues.female
  }
  if (token === 'unknown') {
    return clientSexValues.unknown
  }

  return String(value ?? '').trim()
}

function firstEmailFromList(emails) {
  if (!Array.isArray(emails) || !emails.length) {
    return ''
  }
  const first = emails[0]
  if (!first || typeof first !== typeNames.object) {
    return ''
  }

  return String(first.email ?? first.address ?? '').trim()
}

function firstClientListEmail(client) {
  const personal = clientPersonalInfo(client)
  const fromPersonal = firstEmailFromList(personal.emails)
  if (fromPersonal) {
    return fromPersonal
  }

  return firstEmailFromList(client.emails)
}

function resolveClientListClinicians(client) {
  const clinicians = client.clinicians
    ?? client.clinician_assignments
    ?? client.assigned_clinicians
  if (!Array.isArray(clinicians) || !clinicians.length) {
    return ''
  }

  return clinicians
    .map(item => {
      if (!item || typeof item !== typeNames.object) {
        return ''
      }

      return String(
        item.name
        ?? item.full_name
        ?? item.clinician_name
        ?? '',
      ).trim()
    })
    .filter(Boolean)
    .join(', ')
}

function formatClientListDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    return raw
  }

  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatClientListStatus(status, t) {
  const raw = String(status ?? '').trim()
  if (!raw) {
    return ''
  }
  const lower = raw.toLowerCase()
  if (lower === 'closed' || raw === clientStatus.CLOSED) {
    return t('closed')
  }
  if (lower === 'active' || lower === 'open' || raw === clientStatus.OPEN) {
    return t('open')
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function mapClient(client) {
  if (!client || typeof client !== typeNames.object) {
    return null
  }
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
  const suffix = String(
    personal.suffix ?? client.suffix ?? client[ck.suffix] ?? '',
  ).trim()
  const dob = personal.dob ?? client.dob ?? ''
  const ssn = client.ssn ?? client.social_security_number

  return {
    id: client.id,
    [ck.clientNumber]:
      client.client_number ?? client[ck.clientNumber] ?? '',
    [ck.firstName]: firstName,
    [ck.middleName]: middleName,
    [ck.lastName]: lastName,
    [ck.suffix]: suffix,
    [ck.sex]: mapSexLabelForList(personal.sex ?? client.sex ?? client[ck.sex]),
    [ck.age]: personal.age ?? client.age ?? client[ck.age] ?? '',
    [ck.socialSecurityNumber]:
      ssn != null && ssn !== '' ? String(ssn) : '',
    [ck.name]: formatClientListName(
      firstName,
      middleName,
      lastName,
      suffix,
    ),
    [ck.email]: firstClientListEmail(client),
    [ck.dob]: dob,
    [ck.clinicians]: resolveClientListClinicians(client),
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
  out[ck.status] = formatClientListStatus(out[ck.status], t)

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
  const fallbackSubtenants = extractLoginSubtenants(body)
  const fromEnvelope = extractFromFiCeEnvelope(body)
  if (fromEnvelope) {
    return {
      ...fromEnvelope,
      modules: fromEnvelope.modules?.length
        ? fromEnvelope.modules
        : fallbackModules,
      subtenants: fromEnvelope.subtenants?.length
        ? fromEnvelope.subtenants
        : fallbackSubtenants,
    }
  }

  const fromRoots = extractFromRoots(body)
  if (fromRoots) {
    return {
      ...fromRoots,
      modules: fromRoots.modules?.length
        ? fromRoots.modules
        : fallbackModules,
      subtenants: fromRoots.subtenants?.length
        ? fromRoots.subtenants
        : fallbackSubtenants,
    }
  }

  return null
}
