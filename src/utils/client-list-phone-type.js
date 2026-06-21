function formatPhoneTypeLabel(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function resolveClientPhoneTypeLabel(value) {
  return formatPhoneTypeLabel(value)
}
