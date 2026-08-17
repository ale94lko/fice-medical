import { authStorageKeys as keys } from 'components/constants.js'
import { clearSharedSessionInactivityState } from
  'src/utils/session-inactivity-sync.js'
import {
  decryptJsonFromStorage,
  encryptJsonForStorage,
} from 'src/utils/auth-storage-crypto.js'

export function readStoredToken() {
  return sessionStorage.getItem(keys.token)
}

export function writeStoredToken(value) {
  sessionStorage.setItem(keys.token, value ?? '')
}

export function readStoredExpireAt() {
  return localStorage.getItem(keys.expireAt)
    || localStorage.getItem(keys.expireAtLegacy)
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.')
  if (parts.length < 2) {
    return null
  }
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  try {
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function expireAtIsoFromAccessToken(token) {
  const exp = Number(decodeJwtPayload(token)?.exp)
  if (!Number.isFinite(exp) || exp <= 0) {
    return ''
  }

  return new Date(exp * 1000).toISOString()
}

export function writeStoredExpireAt() {
  const iso = expireAtIsoFromAccessToken(readStoredToken())
  if (!iso) {
    localStorage.removeItem(keys.expireAt)
    localStorage.removeItem(keys.expireAtLegacy)

    return
  }
  localStorage.setItem(keys.expireAt, iso)
  localStorage.setItem(keys.expireAtLegacy, iso)
}

export function readStoredRefreshToken() {
  return sessionStorage.getItem(keys.refresh)
    || sessionStorage.getItem(keys.refreshLegacy)
}

export function writeStoredRefreshToken(value) {
  if (!value) {
    return
  }
  sessionStorage.setItem(keys.refresh, value)
  sessionStorage.setItem(keys.refreshLegacy, value)
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

export function writeStoredModules() {
  localStorage.removeItem(keys.modules)
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

export function writeStoredPermissions() {
  localStorage.removeItem(keys.permissions)
}

let subtenantsMemory = null

function normalizeStoredSubtenants(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
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
}

export function readStoredSubtenants() {
  if (Array.isArray(subtenantsMemory)) {
    return subtenantsMemory
  }
  const raw = localStorage.getItem(keys.subtenants)
  if (!raw || String(raw).startsWith('enc.v1:')) {
    return []
  }
  try {
    return normalizeStoredSubtenants(JSON.parse(raw))
  } catch {
    return []
  }
}

async function persistEncryptedSubtenants(payload) {
  const packed = await encryptJsonForStorage(payload, readStoredToken())
  if (!packed) {
    localStorage.removeItem(keys.subtenants)

    return
  }
  localStorage.setItem(keys.subtenants, packed)
}

export function writeStoredSubtenants(subtenants) {
  const payload = normalizeStoredSubtenants(subtenants)
  subtenantsMemory = payload
  if (!payload.length) {
    localStorage.removeItem(keys.subtenants)

    return
  }
  void persistEncryptedSubtenants(payload)
}

export async function hydrateStoredSubtenants() {
  if (Array.isArray(subtenantsMemory) && subtenantsMemory.length) {
    return subtenantsMemory
  }
  const raw = localStorage.getItem(keys.subtenants)
  if (!raw) {
    subtenantsMemory = []

    return subtenantsMemory
  }
  const parsed = normalizeStoredSubtenants(
    await decryptJsonFromStorage(raw, readStoredToken()),
  )
  subtenantsMemory = parsed
  if (parsed.length && !String(raw).startsWith('enc.v1:')) {
    void persistEncryptedSubtenants(parsed)
  }

  return parsed
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

export function readStoredTenantId() {
  const raw = localStorage.getItem(keys.tenantId)
  if (raw == null || raw === '') {
    return null
  }
  const id = Number(raw)

  return Number.isFinite(id) ? id : null
}

export function writeStoredTenantId(id) {
  if (id == null || id === '') {
    localStorage.removeItem(keys.tenantId)

    return
  }
  localStorage.setItem(keys.tenantId, String(id))
}

export function readStoredConfigData() {
  const raw = localStorage.getItem(keys.configData)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)

    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredConfigData(configData) {
  if (!configData || typeof configData !== 'object') {
    localStorage.removeItem(keys.configData)

    return
  }
  localStorage.setItem(keys.configData, JSON.stringify(configData))
}

export function readStoredUserInfo() {
  const raw = localStorage.getItem(keys.userInfo)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)

    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') {
    localStorage.removeItem(keys.userInfo)

    return
  }
  localStorage.setItem(keys.userInfo, JSON.stringify(userInfo))
}

export function readStoredMustChangePassword() {
  return localStorage.getItem(keys.mustChangePassword) === 'true'
}

export function writeStoredMustChangePassword(value) {
  if (value) {
    localStorage.setItem(keys.mustChangePassword, 'true')

    return
  }
  localStorage.removeItem(keys.mustChangePassword)
}

export function readStoredPasswordChangeMode() {
  const raw = localStorage.getItem(keys.passwordChangeMode)
  if (raw === 'initial' || raw === 'current') {
    return raw
  }

  return null
}

export function writeStoredPasswordChangeMode(mode) {
  if (mode === 'initial' || mode === 'current') {
    localStorage.setItem(keys.passwordChangeMode, mode)

    return
  }
  localStorage.removeItem(keys.passwordChangeMode)
}

export function readStoredMustEnrollMfa() {
  return localStorage.getItem(keys.mustEnrollMfa) === 'true'
}

export function writeStoredMustEnrollMfa(value) {
  if (value) {
    localStorage.setItem(keys.mustEnrollMfa, 'true')

    return
  }
  localStorage.removeItem(keys.mustEnrollMfa)
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
    keys.tenantId,
    keys.configData,
    keys.userInfo,
    keys.mustChangePassword,
    keys.passwordChangeMode,
    keys.mustEnrollMfa,
  ].forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
  subtenantsMemory = null
  clearSharedSessionInactivityState()
}
