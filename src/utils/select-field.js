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
