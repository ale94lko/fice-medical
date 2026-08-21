function asObject(value) {
  if (value == null || value === '') {
    return null
  }
  if (typeof value === 'object') {
    return value
  }
  try {
    const parsed = JSON.parse(String(value))
    if (parsed != null && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

function stringifyValue(value) {
  if (value == null || value === '') {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function flatten(source, prefix = '', target = {}) {
  if (source == null || typeof source !== 'object' || Array.isArray(source)) {
    if (prefix) {
      target[prefix] = source
    }

    return target
  }
  const keys = Object.keys(source)
  if (!keys.length && prefix) {
    target[prefix] = source

    return target
  }
  keys.forEach(key => {
    const path = prefix ? `${prefix}.${key}` : key
    const value = source[key]
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, target)

      return
    }
    target[path] = value
  })

  return target
}

export function diffClinicalAuditPayloads(beforeRaw, afterRaw) {
  const beforeObj = asObject(beforeRaw)
  const afterObj = asObject(afterRaw)
  if (!beforeObj && !afterObj) {
    return []
  }
  const beforeMap = flatten(beforeObj || {})
  const afterMap = flatten(afterObj || {})
  const paths = [...new Set([
    ...Object.keys(beforeMap),
    ...Object.keys(afterMap),
  ])].sort()

  return paths.map(path => {
    const hasBefore = Object.prototype.hasOwnProperty.call(beforeMap, path)
    const hasAfter = Object.prototype.hasOwnProperty.call(afterMap, path)
    const before = hasBefore ? beforeMap[path] : undefined
    const after = hasAfter ? afterMap[path] : undefined
    const beforeText = stringifyValue(before)
    const afterText = stringifyValue(after)
    let kind = 'unchanged'
    if (!hasBefore && hasAfter) {
      kind = 'added'
    } else if (hasBefore && !hasAfter) {
      kind = 'removed'
    } else if (beforeText !== afterText) {
      kind = 'changed'
    }

    return {
      path,
      kind,
      before: beforeText,
      after: afterText,
    }
  })
}

export function isClinicalAuditAccessOnly(record) {
  const action = String(record?.action ?? '').trim().toUpperCase()
  if (action === 'VIEWED') {
    return true
  }
  const after = asObject(record?.afterJson)
  if (!after || typeof after !== 'object' || Array.isArray(after)) {
    return false
  }
  const keys = Object.keys(after)
  return keys.length === 1 && keys[0] === 'access'
}

export function clinicalAuditChangeKindClass(kind) {
  const token = String(kind ?? '').trim()
  if (token === 'added') {
    return 'clinical-audit-diff__row--added'
  }
  if (token === 'changed') {
    return 'clinical-audit-diff__row--changed'
  }
  if (token === 'removed') {
    return 'clinical-audit-diff__row--removed'
  }

  return 'clinical-audit-diff__row--unchanged'
}
