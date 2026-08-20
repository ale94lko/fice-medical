import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  clientEmailTypeValues,
  clientFieldKeys,
  clientFormSections,
  clientPhoneTypeValues,
} from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'

const ck = clientFieldKeys

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (root && typeof root === 'object' && Array.isArray(root.data)) {
    return root.data
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }

  return []
}

function trim(value) {
  return String(value ?? '').trim()
}

function asBool(value) {
  return value === true || value === 'true'
}

function asId(value) {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function portalAccountIdFromQuery(query = {}) {
  const raw = query?.portalAccountId
  const token = Array.isArray(raw) ? raw[0] : raw

  return asId(token)
}

export function normalizeStaffPortalAccount(raw = {}) {
  const firstName = trim(raw.first_name ?? raw.firstName)
  const lastName = trim(raw.last_name ?? raw.lastName)
  const displayName = trim(raw.display_name ?? raw.displayName)

  return {
    id: asId(raw.id),
    email: trim(raw.email),
    firstName,
    lastName,
    displayName: displayName || `${firstName} ${lastName}`.trim(),
    dateOfBirth: raw.date_of_birth ?? raw.dateOfBirth ?? null,
    phone: trim(raw.phone),
    status: trim(raw.status).toUpperCase(),
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    profileComplete: asBool(
      raw.profile_complete ?? raw.profileComplete,
    ),
    canCreateClient: asBool(
      raw.can_create_client ?? raw.canCreateClient,
    ),
  }
}

export function portalAccountApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.message
    ?? data?.error_description
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export function portalAccountMatchesQuery(row, query) {
  const needle = String(query ?? '').trim().toLowerCase()
  if (!needle) {
    return true
  }
  const haystack = [
    row.displayName,
    row.firstName,
    row.lastName,
    row.email,
    row.phone,
  ].join(' ').toLowerCase()

  return haystack.includes(needle)
}

export function applyPortalAccountToAddClientForm(form, account) {
  if (!form || !account) {
    return
  }
  form[ck.firstName] = account.firstName || ''
  form[ck.lastName] = account.lastName || ''
  form[ck.dob] = apiDateToDisplay(account.dateOfBirth) || ''
  const contact = form[clientFormSections.contact]
  if (!contact) {
    return
  }
  if (account.phone) {
    contact.phones = [{
      number: formatPhoneUs(account.phone) || account.phone,
      type: clientPhoneTypeValues.mobile,
    }]
  }
  if (account.email) {
    contact.emails = [{
      address: account.email,
      type: clientEmailTypeValues.personal,
    }]
  }
}

export async function listUnlinkedPortalAccounts() {
  const response = await apiInstance.get(apiPaths.portalAccounts)

  return unwrapList(response.data).map(normalizeStaffPortalAccount)
}

export async function getPortalAccount(accountId) {
  const id = asId(accountId)
  if (!id) {
    return null
  }
  const response = await apiInstance.get(apiPaths.portalAccountById(id))

  return normalizeStaffPortalAccount(unwrapData(response.data))
}

export async function linkPortalAccount(accountId, {
  clientNumber = null,
} = {}) {
  const id = asId(accountId)
  if (!id) {
    throw new Error('portal account id is required')
  }
  const body = {}
  const chartKey = trim(clientNumber)
  if (chartKey) {
    body['client_number'] = chartKey
  }
  const response = await apiInstance.post(
    apiPaths.portalAccountLink(id),
    body,
  )

  return normalizeStaffPortalAccount(unwrapData(response.data))
}
