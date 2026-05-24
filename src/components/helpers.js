import {
  clientFieldKeys,
  clientFormSections,
  clientStatus,
  typeNames,
} from 'components/constants.js'
import { buildContactPayload } from 'src/utils/client-contact-form.js'

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
    }
  }

  return null
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
  if (!form || typeof form !== typeNames.object) {
    return {}
  }
  const ck = clientFieldKeys
  const admissionUs = String(form[ck.admissionDate] ?? '').trim()
  const body = {
    [ck.clientNumber]: form[ck.clientNumber],
    [ck.firstName]: String(form[ck.firstName] ?? '').trim(),
    [ck.middleName]: String(form[ck.middleName] ?? '').trim(),
    [ck.lastName]: String(form[ck.lastName] ?? '').trim(),
    [ck.suffix]: String(form[ck.suffix] ?? '').trim(),
    [ck.sex]: form[ck.sex] || null,
    [ck.admissionDate]: admissionUs,
    [ck.status]: clientStatus.OPEN,
  }
  const dob = String(form[ck.dob] ?? '').trim()
  if (dob) {
    body[ck.dob] = dob
  }
  const ageRaw = form[ck.age]
  if (ageRaw !== '' && ageRaw != null) {
    body[ck.age] = Number(ageRaw)
  }
  const ssn = String(form[ck.socialSecurityNumber] ?? '').replace(/\D/g, '')
  if (ssn) {
    body[ck.socialSecurityNumber] = ssn
  }
  const clinician = String(form[ck.assignedClinician] ?? '').trim()
  if (clinician) {
    body[ck.clinicians] = clinician
  }

  const contactPayload = buildContactPayload(
    form[clientFormSections.contact],
  )
  if (contactPayload) {
    body[clientFormSections.contact] = contactPayload
  }

  return body
}

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

export function mapClient(client) {
  if (!client || typeof client !== typeNames.object) {
    return null
  }
  const ck = clientFieldKeys
  const firstName = String(
    client.first_name ?? client[ck.firstName] ?? '',
  ).trim()
  const middleName = String(
    client.middle_name ?? client[ck.middleName] ?? '',
  ).trim()
  const lastName = String(
    client.last_name ?? client[ck.lastName] ?? '',
  ).trim()
  const suffix = String(client.suffix ?? client[ck.suffix] ?? '').trim()

  return {
    id: client.id,
    [ck.clientNumber]:
      client.client_number ?? client[ck.clientNumber] ?? '',
    [ck.firstName]: firstName,
    [ck.middleName]: middleName,
    [ck.lastName]: lastName,
    [ck.suffix]: suffix,
    [ck.sex]: client.sex ?? client[ck.sex] ?? '',
    [ck.age]: client.age ?? client[ck.age] ?? '',
    [ck.socialSecurityNumber]:
      client.social_security_number
      ?? client[ck.socialSecurityNumber]
      ?? '',
    [ck.name]: formatClientListName(
      firstName,
      middleName,
      lastName,
      suffix,
    ),
    [ck.email]: client.email ?? '',
    [ck.dob]: client.dob ?? '',
    [ck.clinicians]: client.clinicians ?? '',
    [ck.admissionDate]:
      client.admission_date ?? client[ck.admissionDate] ?? '',
    [ck.status]: client.status,
  }
}

export function formatClientDisplay(mapped, t) {
  if (!mapped || typeof mapped !== typeNames.object) {
    return null
  }
  const ck = clientFieldKeys
  const out = { ...mapped }

  if (out[ck.dob]) {
    out[ck.dob] = new Date(out[ck.dob]).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const admissionRaw = out[ck.admissionDate]
  if (admissionRaw) {
    out[ck.admissionDate] = new Date(admissionRaw).toLocaleDateString(
      'en-US',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    )
  }

  switch (out[ck.status]) {
    case clientStatus.CLOSED:
      out[ck.status] = t('closed')
      break
    case clientStatus.OPEN:
      out[ck.status] = t('open')
      break
    default:
      out[ck.status] = 'unknown'
  }

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
  const fromEnvelope = extractFromFiCeEnvelope(body)
  if (fromEnvelope) {
    return {
      ...fromEnvelope,
      modules: fromEnvelope.modules?.length
        ? fromEnvelope.modules
        : fallbackModules,
    }
  }

  const fromRoots = extractFromRoots(body)
  if (fromRoots) {
    return {
      ...fromRoots,
      modules: fromRoots.modules?.length
        ? fromRoots.modules
        : fallbackModules,
    }
  }

  return null
}
