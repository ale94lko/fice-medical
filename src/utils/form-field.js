export function formatRequiredFieldLabel(text) {
  if (!text) {
    return ''
  }
  return `${text} *`
}
