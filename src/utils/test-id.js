/**
 * Builds stable kebab-case data-testid values for QA automation.
 */
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
