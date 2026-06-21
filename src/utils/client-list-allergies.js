import { typeNames } from 'components/constants.js'
import {
  resolveClientListAllergySeverityLabel,
  resolveClientListAllergySeverityModifier,
} from 'src/utils/client-list-allergy-severity.js'

function resolveClientListAllergyYear(item) {
  const year = item?.year
  if (year != null && year !== '') {
    const numeric = Number(year)
    if (Number.isFinite(numeric) && numeric > 0) {
      return String(Math.trunc(numeric))
    }

    return String(year).trim()
  }

  const startDate = String(item?.start_date ?? '').trim()
  if (!startDate) {
    return ''
  }

  const match = startDate.match(/^(\d{4})/)
  return match?.[1] ?? ''
}

export function buildClientListAllergyBadgeLabel(
  name,
  year,
  severityLabel,
) {
  const parts = [String(name ?? '').trim()]
  const yearText = String(year ?? '').trim()
  const severityText = String(severityLabel ?? '').trim()

  if (yearText) {
    parts.push(yearText)
  }
  if (severityText) {
    parts.push(severityText)
  }

  return parts.filter(Boolean).join(' · ')
}

export function resolveClientListAllergyEntries(allergies) {
  const list = Array.isArray(allergies) ? allergies : []
  if (!list.length) {
    return []
  }

  const seen = new Set()
  const entries = []

  for (const item of list) {
    if (!item || typeof item !== typeNames.object) {
      continue
    }

    const name = String(item?.name ?? '').trim()
    if (!name) {
      continue
    }

    const year = resolveClientListAllergyYear(item)
    const severityRaw = String(item?.severity ?? '').trim()
    const severityModifier = resolveClientListAllergySeverityModifier(
      severityRaw,
    ) ?? 'mild'
    const severityLabel = resolveClientListAllergySeverityLabel(
      severityRaw,
      severityModifier,
    )
    const badgeLabel = buildClientListAllergyBadgeLabel(
      name,
      year,
      severityLabel,
    )

    const id = item.id
    const dedupeKey = id != null && id !== ''
      ? `id:${id}`
      : badgeLabel.toLowerCase()

    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)

    entries.push({
      key: dedupeKey,
      name,
      year,
      severity: severityRaw,
      severityLabel,
      severityModifier,
      badgeLabel,
    })
  }

  return entries
}
