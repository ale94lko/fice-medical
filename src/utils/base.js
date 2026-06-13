export function isEmpty(value) {
  return value == null
    || value === ''
}

export function formatRequiredFieldLabel(text) {
  if (!text) {
    return ''
  }

  return `${text} *`
}

export function toTestId(...parts) {
  return parts
    .filter(part => part != null && String(part).trim() !== '')
    .map(part => String(part)
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''))
    .join('-')
}

export function withTestIdPrefix(prefix, ...parts) {
  return toTestId(prefix, ...parts)
}

export function hasSelectValue(value) {
  if (value == null) {
    return false
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (typeof value === 'string') {
    return value.trim() !== ''
  }

  return true
}
