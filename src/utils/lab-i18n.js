/**
 * Builds camelCase vue-i18n keys for lab enum values.
 * e.g. labI18nKey('labCategory', 'blood_test') → labCategoryBloodTest
 */
export function labI18nKey(prefix, value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return prefix
  }
  const parts = raw.split('_').filter(Boolean)
  const camel = parts
    .map((part, index) => {
      const lower = part.toLowerCase()
      if (index === 0) {
        return lower
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
  const titled = camel.charAt(0).toUpperCase() + camel.slice(1)

  return `${prefix}${titled}`
}
