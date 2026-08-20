import { parseUsDateString } from 'src/utils/client-form.js'

export function createEmptyClinicalAuditFilters() {
  return {
    entityType: null,
    action: null,
    from: '',
    to: '',
    clientNumber: null,
    clientOption: null,
    changedBy: null,
    changedByOption: null,
  }
}

export function cloneClinicalAuditFilters(filters = {}) {
  const source = filters && typeof filters === 'object'
    ? filters
    : {}

  return {
    entityType: source.entityType ?? null,
    action: source.action ?? null,
    from: String(source.from ?? '').trim(),
    to: String(source.to ?? '').trim(),
    clientNumber: source.clientNumber ?? source.clientId ?? null,
    clientOption: source.clientOption
      ? { ...source.clientOption }
      : null,
    changedBy: source.changedBy ?? null,
    changedByOption: source.changedByOption
      ? { ...source.changedByOption }
      : null,
  }
}

export function countActiveClinicalAuditFilters(filters = {}) {
  const f = cloneClinicalAuditFilters(filters)
  let count = 0
  if (f.entityType) {
    count += 1
  }
  if (f.action) {
    count += 1
  }
  if (f.from) {
    count += 1
  }
  if (f.to) {
    count += 1
  }
  if (f.clientNumber != null && String(f.clientNumber).trim() !== '') {
    count += 1
  }
  if (f.changedBy != null && String(f.changedBy).trim() !== '') {
    count += 1
  }

  return count
}

/**
 * True when from/to are empty, incomplete, or from <= to.
 * Only enforces order when both dates parse successfully.
 */
export function isClinicalAuditDateRangeValid(filters = {}) {
  const from = String(filters?.from ?? '').trim()
  const to = String(filters?.to ?? '').trim()
  if (!from || !to) {
    return true
  }
  const fromDate = parseUsDateString(from)
  const toDate = parseUsDateString(to)
  if (!fromDate || !toDate) {
    return true
  }

  return fromDate.getTime() <= toDate.getTime()
}
