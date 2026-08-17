import { authStorageKeys as keys } from 'components/constants.js'
import { clearSharedSessionInactivityState } from
  'src/utils/session-inactivity-sync.js'
import {
  AUTH_STORAGE_PACKED_PREFIX,
  AUTH_WRAP_STORAGE_KEY,
  clearAuthWrapMaterial,
  decryptJsonFromStorage,
  encryptJsonForStorage,
  readAuthWrapMaterial,
  readLegacyStoredWrapMaterial,
} from 'src/utils/auth-storage-crypto.js'

let authStorageHydratePromise = null
let tokenMemory = undefined
let refreshTokenMemory = undefined
let tenantIdMemory = undefined
let configDataMemory = undefined
let userInfoMemory = undefined
let subtenantsMemory = null
let activeSubtenantIdMemory = undefined

function isPackedStorageValue(raw) {
  return String(raw || '').startsWith(AUTH_STORAGE_PACKED_PREFIX)
}

async function persistEncryptedValue(store, key, value) {
  const packed = await encryptJsonForStorage(value, readAuthWrapMaterial())
  if (!packed) {
    store.removeItem(key)

    return
  }
  store.setItem(key, packed)
}

async function decryptStoredValue(raw) {
  const fromWrap = await decryptJsonFromStorage(raw, readAuthWrapMaterial())
  if (fromWrap != null) {
    return fromWrap
  }
  const legacyWrap = readLegacyStoredWrapMaterial()
  if (legacyWrap) {
    const fromLegacyWrap = await decryptJsonFromStorage(raw, legacyWrap)
    if (fromLegacyWrap != null) {
      return fromLegacyWrap
    }
  }
  const legacyToken = typeof tokenMemory === 'string' && tokenMemory
    ? tokenMemory
    : ''
  if (!legacyToken) {
    return null
  }

  return decryptJsonFromStorage(raw, legacyToken)
}

export function readStoredToken() {
  if (tokenMemory !== undefined) {
    return tokenMemory
  }
  const raw = sessionStorage.getItem(keys.token)
  if (!raw || isPackedStorageValue(raw)) {
    return ''
  }

  return raw
}

export function writeStoredToken(value) {
  const next = String(value ?? '')
  tokenMemory = next
  if (!next) {
    sessionStorage.removeItem(keys.token)

    return
  }
  void persistEncryptedValue(sessionStorage, keys.token, next)
}

export async function hydrateStoredToken() {
  if (tokenMemory) {
    return tokenMemory
  }
  const raw = sessionStorage.getItem(keys.token)
  if (!raw) {
    tokenMemory = ''

    return ''
  }
  if (!isPackedStorageValue(raw)) {
    tokenMemory = raw
    void persistEncryptedValue(sessionStorage, keys.token, raw)

    return raw
  }
  const parsed = await decryptStoredValue(raw)
  tokenMemory = typeof parsed === 'string' ? parsed : ''

  return tokenMemory
}

export function readStoredExpireAt() {
  return expireAtIsoFromAccessToken(readStoredToken())
    || localStorage.getItem(keys.expireAt)
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
  localStorage.removeItem(keys.expireAt)
  localStorage.removeItem(keys.expireAtLegacy)
}

export function readStoredRefreshToken() {
  if (refreshTokenMemory !== undefined) {
    return refreshTokenMemory
  }
  const raw = sessionStorage.getItem(keys.refresh)
    || sessionStorage.getItem(keys.refreshLegacy)
  if (!raw || isPackedStorageValue(raw)) {
    return ''
  }

  return raw
}

export function writeStoredRefreshToken(value) {
  if (!value) {
    return
  }
  const next = String(value)
  refreshTokenMemory = next
  sessionStorage.removeItem(keys.refreshLegacy)
  void persistEncryptedValue(sessionStorage, keys.refresh, next)
}

export async function hydrateStoredRefreshToken() {
  if (refreshTokenMemory) {
    return refreshTokenMemory
  }
  const raw = sessionStorage.getItem(keys.refresh)
    || sessionStorage.getItem(keys.refreshLegacy)
  if (!raw) {
    refreshTokenMemory = ''

    return ''
  }
  if (!isPackedStorageValue(raw)) {
    refreshTokenMemory = raw
    sessionStorage.removeItem(keys.refreshLegacy)
    void persistEncryptedValue(sessionStorage, keys.refresh, raw)

    return raw
  }
  const parsed = await decryptStoredValue(raw)
  refreshTokenMemory = typeof parsed === 'string' ? parsed : ''

  return refreshTokenMemory
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
  if (!raw || isPackedStorageValue(raw)) {
    return []
  }
  try {
    return normalizeStoredSubtenants(JSON.parse(raw))
  } catch {
    return []
  }
}

export function writeStoredSubtenants(subtenants) {
  const payload = normalizeStoredSubtenants(subtenants)
  subtenantsMemory = payload
  if (!payload.length) {
    localStorage.removeItem(keys.subtenants)

    return
  }
  void persistEncryptedValue(localStorage, keys.subtenants, payload)
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
  const parsed = normalizeStoredSubtenants(await decryptStoredValue(raw))
  subtenantsMemory = parsed
  if (parsed.length && !isPackedStorageValue(raw)) {
    void persistEncryptedValue(localStorage, keys.subtenants, parsed)
  }

  return parsed
}

function normalizeStoredActiveSubtenantId(value) {
  if (value == null || value === '') {
    return null
  }
  const id = Number(
    typeof value === 'object' ? value.id ?? value.activeSubtenantId : value,
  )

  return Number.isFinite(id) ? id : null
}

export function readStoredActiveSubtenantId() {
  if (activeSubtenantIdMemory !== undefined) {
    return activeSubtenantIdMemory
  }
  const raw = localStorage.getItem(keys.activeSubtenantId)
  if (raw == null || raw === '' || isPackedStorageValue(raw)) {
    return null
  }
  const id = Number(raw)

  return Number.isFinite(id) ? id : null
}

export function writeStoredActiveSubtenantId(id) {
  if (id == null || id === '') {
    activeSubtenantIdMemory = null
    localStorage.removeItem(keys.activeSubtenantId)

    return
  }
  const nextId = Number(id)
  if (!Number.isFinite(nextId)) {
    return
  }
  activeSubtenantIdMemory = nextId
  void persistEncryptedValue(localStorage, keys.activeSubtenantId, nextId)
}

export async function hydrateStoredActiveSubtenantId() {
  if (activeSubtenantIdMemory !== undefined) {
    return activeSubtenantIdMemory
  }
  const raw = localStorage.getItem(keys.activeSubtenantId)
  if (raw == null || raw === '') {
    activeSubtenantIdMemory = null

    return null
  }
  const nextId = normalizeStoredActiveSubtenantId(await decryptStoredValue(raw))
  activeSubtenantIdMemory = nextId
  if (nextId != null && !isPackedStorageValue(raw)) {
    void persistEncryptedValue(localStorage, keys.activeSubtenantId, nextId)
  }

  return nextId
}

function normalizeStoredTenantId(value) {
  const id = Number(
    typeof value === 'object' ? value.id ?? value.tenantId : value,
  )

  return Number.isFinite(id) ? id : null
}

export function readStoredTenantId() {
  if (tenantIdMemory !== undefined) {
    return tenantIdMemory
  }
  const raw = localStorage.getItem(keys.tenantId)
  if (raw == null || raw === '' || isPackedStorageValue(raw)) {
    return null
  }
  const id = Number(raw)

  return Number.isFinite(id) ? id : null
}

export function writeStoredTenantId(id) {
  if (id == null || id === '') {
    tenantIdMemory = null
    localStorage.removeItem(keys.tenantId)

    return
  }
  const nextId = Number(id)
  if (!Number.isFinite(nextId)) {
    return
  }
  tenantIdMemory = nextId
  void persistEncryptedValue(localStorage, keys.tenantId, nextId)
}

export async function hydrateStoredTenantId() {
  if (tenantIdMemory !== undefined) {
    return tenantIdMemory
  }
  const raw = localStorage.getItem(keys.tenantId)
  if (raw == null || raw === '') {
    tenantIdMemory = null

    return null
  }
  const nextId = normalizeStoredTenantId(await decryptStoredValue(raw))
  tenantIdMemory = nextId
  if (nextId != null && !isPackedStorageValue(raw)) {
    void persistEncryptedValue(localStorage, keys.tenantId, nextId)
  }

  return nextId
}

function normalizeStoredConfigData(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value
}

export function readStoredConfigData() {
  if (configDataMemory !== undefined) {
    return configDataMemory
  }
  const raw = localStorage.getItem(keys.configData)
  if (!raw || isPackedStorageValue(raw)) {
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
    configDataMemory = null
    localStorage.removeItem(keys.configData)

    return
  }
  configDataMemory = configData
  void persistEncryptedValue(localStorage, keys.configData, configData)
}

export async function hydrateStoredConfigData() {
  if (configDataMemory !== undefined) {
    return configDataMemory
  }
  const raw = localStorage.getItem(keys.configData)
  if (!raw) {
    configDataMemory = null

    return null
  }
  const parsed = normalizeStoredConfigData(await decryptStoredValue(raw))
  configDataMemory = parsed
  if (parsed && !isPackedStorageValue(raw)) {
    void persistEncryptedValue(localStorage, keys.configData, parsed)
  }

  return parsed
}

function normalizeStoredUserInfo(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value
}

export function readStoredUserInfo() {
  if (userInfoMemory !== undefined) {
    return userInfoMemory
  }
  const raw = localStorage.getItem(keys.userInfo)
  if (!raw || isPackedStorageValue(raw)) {
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
    userInfoMemory = null
    localStorage.removeItem(keys.userInfo)

    return
  }
  userInfoMemory = userInfo
  void persistEncryptedValue(localStorage, keys.userInfo, userInfo)
}

export async function hydrateStoredUserInfo() {
  if (userInfoMemory !== undefined) {
    return userInfoMemory
  }
  const raw = localStorage.getItem(keys.userInfo)
  if (!raw) {
    userInfoMemory = null

    return null
  }
  const parsed = normalizeStoredUserInfo(await decryptStoredValue(raw))
  userInfoMemory = parsed
  if (parsed && !isPackedStorageValue(raw)) {
    void persistEncryptedValue(localStorage, keys.userInfo, parsed)
  }

  return parsed
}

export function readStoredMustChangePassword() {
  return Boolean(readStoredUserInfo()?.changePassword)
}

export function writeStoredMustChangePassword() {
  localStorage.removeItem(keys.mustChangePassword)
}

export function readStoredPasswordChangeMode() {
  if (readStoredUserInfo()?.changePassword) {
    return 'initial'
  }

  return null
}

export function writeStoredPasswordChangeMode() {
  localStorage.removeItem(keys.passwordChangeMode)
}

export function readStoredMustEnrollMfa() {
  const userInfo = readStoredUserInfo()

  return Boolean(userInfo?.mfaEnrollmentRequired) && !userInfo?.mfaEnabled
}

export function writeStoredMustEnrollMfa() {
  localStorage.removeItem(keys.mustEnrollMfa)
}

async function hydrateAllAuthStorage() {
  await hydrateStoredToken()
  await hydrateStoredRefreshToken()
  await Promise.all([
    hydrateStoredSubtenants(),
    hydrateStoredActiveSubtenantId(),
    hydrateStoredTenantId(),
    hydrateStoredConfigData(),
    hydrateStoredUserInfo(),
  ])
  if (tokenMemory) {
    await persistEncryptedValue(sessionStorage, keys.token, tokenMemory)
  }
  if (refreshTokenMemory) {
    await persistEncryptedValue(
      sessionStorage,
      keys.refresh,
      refreshTokenMemory,
    )
  }
  if (Array.isArray(subtenantsMemory) && subtenantsMemory.length) {
    await persistEncryptedValue(
      localStorage,
      keys.subtenants,
      subtenantsMemory,
    )
  }
  if (activeSubtenantIdMemory != null) {
    await persistEncryptedValue(
      localStorage,
      keys.activeSubtenantId,
      activeSubtenantIdMemory,
    )
  }
  if (tenantIdMemory != null) {
    await persistEncryptedValue(localStorage, keys.tenantId, tenantIdMemory)
  }
  if (configDataMemory) {
    await persistEncryptedValue(
      localStorage,
      keys.configData,
      configDataMemory,
    )
  }
  if (userInfoMemory) {
    await persistEncryptedValue(localStorage, keys.userInfo, userInfoMemory)
  }
  clearAuthWrapMaterial()
}

export function ensureAuthStorageHydrated() {
  if (!authStorageHydratePromise) {
    authStorageHydratePromise = hydrateAllAuthStorage().catch(error => {
      authStorageHydratePromise = null
      throw error
    })
  }

  return authStorageHydratePromise
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
    AUTH_WRAP_STORAGE_KEY,
  ].forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
  authStorageHydratePromise = null
  tokenMemory = undefined
  refreshTokenMemory = undefined
  tenantIdMemory = undefined
  configDataMemory = undefined
  userInfoMemory = undefined
  subtenantsMemory = null
  activeSubtenantIdMemory = undefined
  clearAuthWrapMaterial()
  clearSharedSessionInactivityState()
}
