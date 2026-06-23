import { authStorageKeys as keys } from 'components/constants.js'
import { clearSharedSessionInactivityState } from
  'src/utils/session-inactivity-sync.js'

export function readStoredToken() {
  return localStorage.getItem(keys.token)
}

export function writeStoredToken(value) {
  localStorage.setItem(keys.token, value ?? '')
}

export function readStoredExpireAt() {
  return localStorage.getItem(keys.expireAt)
    || localStorage.getItem(keys.expireAtLegacy)
}

export function writeStoredExpireAt(value) {
  const v = value ?? ''
  localStorage.setItem(keys.expireAt, v)
  localStorage.setItem(keys.expireAtLegacy, v)
}

export function readStoredRefreshToken() {
  return localStorage.getItem(keys.refresh)
    || localStorage.getItem(keys.refreshLegacy)
}

export function writeStoredRefreshToken(value) {
  if (!value) {
    return
  }
  localStorage.setItem(keys.refresh, value)
  localStorage.setItem(keys.refreshLegacy, value)
}

export function readStoredModules() {
  const raw = localStorage.getItem(keys.modules)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.map(m => String(m)).filter(Boolean)
      : []
  } catch {
    return []
  }
}

export function writeStoredModules(modules) {
  const list = Array.isArray(modules) ? modules : []
  localStorage.setItem(keys.modules, JSON.stringify(list))
}

export function readStoredPermissions() {
  const raw = localStorage.getItem(keys.permissions)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.map(p => String(p).trim()).filter(Boolean)
      : []
  } catch {
    return []
  }
}

export function writeStoredPermissions(permissions) {
  const list = Array.isArray(permissions) ? permissions : []
  localStorage.setItem(keys.permissions, JSON.stringify(list))
}

export function readStoredSubtenants() {
  const raw = localStorage.getItem(keys.subtenants)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(item => {
        const id = Number(item?.id)
        if (!Number.isFinite(id)) {
          return null
        }

        return {
          id,
          name: String(item?.name ?? '').trim(),
          code: String(item?.code ?? '').trim(),
        }
      })
      .filter(item => item?.name)
  } catch {
    return []
  }
}

export function writeStoredSubtenants(subtenants) {
  const list = Array.isArray(subtenants) ? subtenants : []
  localStorage.setItem(keys.subtenants, JSON.stringify(list))
}

export function readStoredActiveSubtenantId() {
  const raw = localStorage.getItem(keys.activeSubtenantId)
  if (raw == null || raw === '') {
    return null
  }
  const id = Number(raw)

  return Number.isFinite(id) ? id : null
}

export function writeStoredActiveSubtenantId(id) {
  if (id == null || id === '') {
    localStorage.removeItem(keys.activeSubtenantId)

    return
  }
  localStorage.setItem(keys.activeSubtenantId, String(id))
}

export function clearAuthLocalStorage() {
  [
    keys.token,
    keys.expireAt,
    keys.expireAtLegacy,
    keys.refresh,
    keys.refreshLegacy,
    keys.modules,
    keys.permissions,
    keys.subtenants,
    keys.activeSubtenantId,
  ].forEach(k => localStorage.removeItem(k))
  clearSharedSessionInactivityState()
}
