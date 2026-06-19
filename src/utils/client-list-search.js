import { clientFieldKeys } from 'components/constants.js'

const ck = clientFieldKeys

function clientRowSearchValues(row) {
  if (!row || typeof row !== 'object') {
    return []
  }

  const values = [
    row[ck.clientNumber],
    row[ck.name],
    row[ck.email],
    row.emailSearchText,
    row[ck.dob],
    row[ck.clinicians],
    row[ck.admissionDate],
    row[ck.status],
  ]

  for (const entry of row.clinicianEntries ?? []) {
    values.push(entry?.name, entry?.initials)
  }

  return values
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
}

export function clientRowMatchesSearch(row, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return clientRowSearchValues(row).some(value =>
    value.toLowerCase().includes(normalizedQuery),
  )
}

export function splitTextBySearchQuery(text, query) {
  const value = String(text ?? '')
  const normalizedQuery = String(query ?? '').trim()
  if (!normalizedQuery) {
    return [{ text: value, match: false }]
  }

  const lowerValue = value.toLowerCase()
  const lowerQuery = normalizedQuery.toLowerCase()
  const parts = []
  let start = 0
  let index = lowerValue.indexOf(lowerQuery, start)

  while (index !== -1) {
    if (index > start) {
      parts.push({
        text: value.slice(start, index),
        match: false,
      })
    }
    parts.push({
      text: value.slice(index, index + normalizedQuery.length),
      match: true,
    })
    start = index + normalizedQuery.length
    index = lowerValue.indexOf(lowerQuery, start)
  }

  if (start < value.length) {
    parts.push({
      text: value.slice(start),
      match: false,
    })
  }

  return parts.length
    ? parts
    : [{ text: value, match: false }]
}
