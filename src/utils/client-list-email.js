import { typeNames } from 'components/constants.js'
import { resolveClientEmailTypeLabel } from
  'src/utils/map-client-api-to-form.js'

function clientPersonalInfo(client) {
  return client?.personal_information ?? client?.basic_info ?? client ?? {}
}

function resolveEmailList(client) {
  const personal = clientPersonalInfo(client)
  const emails = personal.emails ?? client?.emails

  return Array.isArray(emails) ? emails : []
}

export function resolveClientListEmailEntries(client) {
  const emails = resolveEmailList(client)
  if (!emails.length) {
    return []
  }

  const seen = new Set()
  const entries = []

  for (const item of emails) {
    if (!item || typeof item !== typeNames.object) {
      continue
    }

    const email = String(item.email ?? item.address ?? '').trim()
    if (!email) {
      continue
    }

    const id = item.id
    const typeRaw = item.email_type ?? item.type ?? ''
    const dedupeKey = id != null && id !== ''
      ? `id:${id}`
      : `${email.toLowerCase()}:${String(typeRaw).toLowerCase()}`

    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)

    const typeLabel = resolveClientEmailTypeLabel(typeRaw)

    entries.push({
      key: dedupeKey,
      email,
      typeLabel,
    })
  }

  return entries
}

export function resolveClientListEmailSearchText(entries = []) {
  return entries
    .flatMap(entry => [entry.email, entry.typeLabel])
    .filter(Boolean)
    .join(' ')
}
