export function createEmptyUserListFilters() {
  return {
    role: null,
    status: null,
  }
}

export function cloneUserListFilters(filters = {}) {
  const source = filters && typeof filters === 'object'
    ? filters
    : {}

  return {
    role: source.role ?? null,
    status: source.status ?? null,
  }
}

export function countActiveUserListFilters(filters = {}) {
  const f = cloneUserListFilters(filters)
  let count = 0
  if (f.role != null && String(f.role).trim() !== '') {
    count += 1
  }
  if (f.status != null && String(f.status).trim() !== '') {
    count += 1
  }

  return count
}
