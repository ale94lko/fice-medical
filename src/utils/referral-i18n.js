export function referralI18nKey(prefix, token) {
  const safe = String(token ?? '')
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  return `${prefix}${safe}`
}
