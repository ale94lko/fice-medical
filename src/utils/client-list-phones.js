import { typeNames } from 'components/constants.js'
import {
  formatPhoneUs,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'
import { resolveClientPhoneTypeLabel } from
  'src/utils/client-list-phone-type.js'

function formatClientListPhone(value) {
  let digits = normalizePhoneDigits(value)
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }

  return formatPhoneUs(digits)
}

export function resolveClientListPhoneEntries(phones) {
  const list = Array.isArray(phones) ? phones : []
  if (!list.length) {
    return []
  }

  const seen = new Set()
  const entries = []

  for (const item of list) {
    if (!item || typeof item !== typeNames.object) {
      continue
    }

    const rawPhone = String(item.phone ?? item.phone_number ?? '').trim()
    const phone = formatClientListPhone(rawPhone)
    if (!phone) {
      continue
    }

    const id = item.id
    const typeRaw = item.phone_type ?? item.type ?? ''
    const dedupeKey = id != null && id !== ''
      ? `id:${id}`
      : `${phone}:${String(typeRaw).toLowerCase()}`

    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)

    entries.push({
      key: dedupeKey,
      phone,
      typeLabel: resolveClientPhoneTypeLabel(typeRaw),
    })
  }

  return entries
}
