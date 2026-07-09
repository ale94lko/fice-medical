import { clinicalResourcePinRoleNames } from 'components/constants.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import { fetchTenantUser } from 'src/utils/user-list-api.js'

const PIN_ROLE_SET = new Set(
  Object.values(clinicalResourcePinRoleNames).map(role => role.toUpperCase()),
)

let cachedRoleNames = null
let cachedUserId = null
let loadPromise = null

function normalizeRoleToken(role) {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

function normalizeRoleNames(roles = []) {
  return roles
    .map(role => normalizeRoleToken(role))
    .filter(Boolean)
}

function resolveRoleNamesFromTenantUser(user) {
  if (!user) {
    return []
  }

  const fromRoles = Array.isArray(user.roles) ? user.roles : []
  if (fromRoles.length) {
    return normalizeRoleNames(fromRoles)
  }

  const roleCode = String(user.roleCode ?? '').trim()
  if (roleCode) {
    return normalizeRoleNames([roleCode])
  }

  const fromCodes = Array.isArray(user.rolesCodes) ? user.rolesCodes : []
  const nameLikeCodes = fromCodes
    .map(code => String(code ?? '').trim())
    .filter(code => code && !/^\d+$/.test(code))

  return normalizeRoleNames(nameLikeCodes)
}

export function hasClinicalResourcePinRole(roleNames = []) {
  return normalizeRoleNames(roleNames).some(role => PIN_ROLE_SET.has(role))
}

export function clearClinicalResourceUserRolesCache() {
  cachedRoleNames = null
  cachedUserId = null
  loadPromise = null
}

export async function resolveCurrentUserRoleNames(t) {
  const authStore = useAuthStore()
  const userId = authStore.userInfo?.id
  if (!userId) {
    return []
  }

  if (cachedRoleNames && cachedUserId === userId) {
    return cachedRoleNames
  }

  if (!loadPromise) {
    loadPromise = fetchTenantUser(userId, t)
      .then(user => {
        cachedUserId = userId
        cachedRoleNames = resolveRoleNamesFromTenantUser(user)

        return cachedRoleNames
      })
      .catch(() => [])
      .finally(() => {
        loadPromise = null
      })
  }

  return loadPromise
}
