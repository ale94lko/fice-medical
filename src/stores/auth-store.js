import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  authStorageKeys,
  permissionNames,
  passwordChangeModes,
  typeNames,
} from 'components/constants.js'
import {
  hasAnyPermission,
  hasAssignedPermissions,
  hasPermission,
} from 'src/utils/auth-permissions.js'
import {
  extractLoginSubtenants,
  extractLoginUserInfo,
  extractMfaChallenge,
  extractOAuthTokenPayload,
} from 'components/helpers.js'
import {
  clearAuthLocalStorage,
  ensureAuthStorageHydrated,
  readStoredActiveSubtenantId,
  readStoredConfigData,
  readStoredExpireAt,
  readStoredMustChangePassword,
  readStoredMustEnrollMfa,
  readStoredPasswordChangeMode,
  readStoredRefreshToken,
  readStoredSubtenants,
  readStoredToken,
  readStoredTenantId,
  readStoredUserInfo,
  writeStoredActiveSubtenantId,
  writeStoredConfigData,
  writeStoredExpireAt,
  writeStoredModules,
  writeStoredMustChangePassword,
  writeStoredMustEnrollMfa,
  writeStoredPasswordChangeMode,
  writeStoredPermissions,
  writeStoredRefreshToken,
  writeStoredSubtenants,
  writeStoredToken,
  writeStoredTenantId,
  writeStoredUserInfo,
} from '../utils/auth-local-storage.js'
import { fetchCurrentUserPermissionCodes } from
  '../utils/tenant-permissions-api.js'
import { completeMfaChallenge as postMfaChallenge } from
  '../utils/mfa-api.js'
import { clearSessionExpiredUiSuppression } from '../utils/api-session-error.js'
import { beginFreshSessionInactivityClock } from
  '../utils/session-inactivity-sync.js'
import { clearClinicalResourceUserRolesCache } from
  '../utils/clinical-resource-user-roles.js'
import { syncAppDateTimeConfigFromAuth } from
  '../utils/sync-app-datetime-config.js'
import { clearSessionDisplayTimezone, bumpDisplayTimezoneTick } from
  '../composables/useSessionDisplayTimezone.js'

function resolveRestoredPasswordChangeMode(storedMode, userInfo) {
  if (
    storedMode === passwordChangeModes.initial
    || storedMode === passwordChangeModes.current
  ) {
    return storedMode
  }

  return userInfo?.changePassword
    ? passwordChangeModes.initial
    : passwordChangeModes.current
}

let authorizationHydratePromise = null
let authorizationHydrated = false

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    expireAt: null,
    refreshToken: null,
    /** Feature module names from login (e.g. Client, Referrals). */
    modules: [],
    /** Permission grants from login (e.g. VIEW_CLIENT, EDIT_ALLERGIES). */
    permissions: [],
    subtenants: [],
    activeSubtenantId: null,
    tenantId: null,
    configData: null,
    userInfo: null,
    mustChangePassword: false,
    passwordChangeMode: null,
    mustEnrollMfa: false,
    _initialized: false,
  }),
  getters: {
    isAuthenticated: state => !!state.token,
    requiresPasswordChange: state => state.mustChangePassword,
    needsPostLoginSetup: state =>
      state.mustChangePassword || state.mustEnrollMfa,
    requiresCurrentPasswordForChange: state =>
      state.passwordChangeMode === passwordChangeModes.current,
    activeSubtenant(state) {
      if (!state.subtenants.length) {
        return null
      }
      const match = state.subtenants.find(
        item => item.id === state.activeSubtenantId,
      )

      return match ?? state.subtenants[0] ?? null
    },
    hasMultipleSubtenants: state => state.subtenants.length > 1,
    hasModule: state => moduleName => {
      const key = String(moduleName ?? '').trim()
      if (!key) {
        return false
      }

      return state.modules.some(m => String(m) === key)
    },
    hasAssignedPermissions: state =>
      hasAssignedPermissions(state.permissions),
    hasPermission: state => permission =>
      hasPermission(state.permissions, permission),
    hasAnyPermission: state => permissionList =>
      hasAnyPermission(state.permissions, permissionList),
    showClientMenu: state =>
      hasAnyPermission(
        state.permissions,
        [permissionNames.viewClient, permissionNames.addClient],
      ),
    showAdministrationMenu: state =>
      hasAnyPermission(state.permissions, [
        permissionNames.viewStaffMembers,
        permissionNames.viewConfig,
        permissionNames.editConfig,
        permissionNames.viewModules,
        permissionNames.viewPermissions,
        permissionNames.viewRoles,
        permissionNames.viewCatalog,
        permissionNames.viewPlans,
        permissionNames.viewTenants,
        permissionNames.viewAuditLog,
        permissionNames.viewSubtenants,
        permissionNames.manageClinicalResources,
        permissionNames.viewTenantsUser,
        permissionNames.addTenantsUser,
        permissionNames.editTenantsUser,
        permissionNames.deleteTenantsUser,
      ]),
    linkedStaffProfile(state) {
      const profile = state.userInfo?.staffMember
      if (!profile || typeof profile !== 'object') {
        return null
      }
      if (!profile.name && !profile.position) {
        return null
      }

      return profile
    },
  },
  actions: {
    applySubtenants(subtenants, preferredId = null) {
      const list = Array.isArray(subtenants) ? subtenants : []
      this.subtenants = list
      writeStoredSubtenants(list)

      if (!list.length) {
        this.activeSubtenantId = null
        writeStoredActiveSubtenantId(null)

        return
      }

      const storedId = preferredId ?? readStoredActiveSubtenantId()
      const match = list.find(item => item.id === storedId)

      this.activeSubtenantId = match?.id ?? list[0].id
      writeStoredActiveSubtenantId(this.activeSubtenantId)
      void this.refreshDateTimeConfig()
    },
    setActiveSubtenant(id) {
      const nextId = Number(id)
      if (!Number.isFinite(nextId)) {
        return
      }
      const match = this.subtenants.find(item => item.id === nextId)
      if (!match) {
        return
      }
      this.activeSubtenantId = nextId
      writeStoredActiveSubtenantId(nextId)
      void this.refreshDateTimeConfig()
    },
    async refreshDateTimeConfig() {
      try {
        const response = await apiInstance.get(apiPaths.datetimeConfig)
        const payload = response?.data?.data ?? response?.data
        if (!payload || typeof payload !== typeNames.object) {
          return
        }
        writeStoredConfigData(payload)
        syncAppDateTimeConfigFromAuth(payload)
        this.configData = payload
        bumpDisplayTimezoneTick()
      } catch {
        // Keep login config_data if the endpoint is unavailable.
      }
    },
    applyTokensFromApi(td) {
      if (!td) {
        return
      }
      this.token = td.token || td.access_token || ''
      this.expireAt = td.expiration || td.expires_at || td.expiresAt || ''
      const nextRefresh = td.refreshToken || td.refresh_token
      if (nextRefresh) {
        this.refreshToken = nextRefresh
        writeStoredRefreshToken(nextRefresh)
      }
      if (Array.isArray(td.modules) && td.modules.length) {
        this.modules = td.modules
      }
      if (Array.isArray(td.permissions) && td.permissions.length) {
        this.permissions = td.permissions
      }
      writeStoredModules()
      writeStoredPermissions()
      if (td.tenantId != null) {
        this.tenantId = td.tenantId
        writeStoredTenantId(td.tenantId)
      }
      if (td.configData) {
        this.configData = td.configData
        writeStoredConfigData(td.configData)
        syncAppDateTimeConfigFromAuth(td.configData)
      }
      writeStoredToken(this.token)
      writeStoredExpireAt(this.expireAt)
    },
    applyUserInfo(userInfo) {
      if (!userInfo || typeof userInfo !== 'object') {
        this.userInfo = null
        this.mustChangePassword = false
        this.passwordChangeMode = null
        writeStoredUserInfo(null)
        writeStoredMustChangePassword(false)
        writeStoredPasswordChangeMode(null)

        return
      }

      this.userInfo = { ...userInfo }
      this.mustChangePassword = Boolean(userInfo.changePassword)
      this.passwordChangeMode = this.mustChangePassword
        ? passwordChangeModes.initial
        : null
      this.mustEnrollMfa = Boolean(userInfo.mfaEnrollmentRequired)
        && !userInfo.mfaEnabled
      writeStoredUserInfo(this.userInfo)
      writeStoredMustChangePassword(this.mustChangePassword)
      writeStoredPasswordChangeMode(this.passwordChangeMode)
      writeStoredMustEnrollMfa(this.mustEnrollMfa)
    },
    completePasswordChange() {
      this.mustChangePassword = false
      this.passwordChangeMode = null
      if (this.userInfo) {
        this.userInfo = {
          ...this.userInfo,
          changePassword: false,
        }
        writeStoredUserInfo(this.userInfo)
      }
      writeStoredMustChangePassword(false)
      writeStoredPasswordChangeMode(null)
      void this.enterAppIfReady()
    },
    completeMfaEnrollment() {
      this.mustEnrollMfa = false
      if (this.userInfo) {
        this.userInfo = {
          ...this.userInfo,
          mfaEnabled: true,
          mfaEnrollmentRequired: false,
        }
        writeStoredUserInfo(this.userInfo)
      }
      writeStoredMustEnrollMfa(false)
      void this.enterAppIfReady()
    },
    requireMfaEnrollment() {
      this.mustEnrollMfa = true
      if (this.userInfo) {
        this.userInfo = {
          ...this.userInfo,
          mfaEnrollmentRequired: true,
        }
        writeStoredUserInfo(this.userInfo)
      }
      writeStoredMustEnrollMfa(true)
      void this.holdOnLoginIfNeeded()
    },
    requirePasswordChange() {
      this.mustChangePassword = true
      this.passwordChangeMode = passwordChangeModes.current
      if (this.userInfo) {
        this.userInfo = {
          ...this.userInfo,
          changePassword: true,
        }
        writeStoredUserInfo(this.userInfo)
      }
      writeStoredMustChangePassword(true)
      writeStoredPasswordChangeMode(passwordChangeModes.current)
      void this.holdOnLoginIfNeeded()
    },
    holdOnLoginIfNeeded() {
      if (!this.mustChangePassword && !this.mustEnrollMfa) {
        return
      }
      const path = String(this.router?.currentRoute?.value?.path ?? '')
      const stay = path === '/login'
        || path === '/reset-password'
        || path.startsWith('/meet')
        || path.startsWith('/consent-sign')
      if (!stay && this.router) {
        void this.router.replace('/login').catch(() => {})
      }
    },
    async enterAppIfReady() {
      if (this.mustChangePassword || this.mustEnrollMfa) {
        return false
      }
      const path = String(this.router?.currentRoute?.value?.path ?? '')
      if (path === '/login' || path === '/reset-password') {
        await this.router.replace('/dashboard').catch(() => {})
      }

      return true
    },
    async login(email, pass, t) {
      try {
        const response = await apiInstance.post(apiPaths.oauthLogin, {
          email: email,
          password: pass,
        })

        const challenge = extractMfaChallenge(response.data)
        if (challenge) {
          return {
            mfaRequired: true,
            token: challenge.token,
            expires: challenge.expires,
          }
        }

        const td = extractOAuthTokenPayload(response.data)
        this.applyTokensFromApi(td)
        this.applyUserInfo(extractLoginUserInfo(response.data))
        const subtenants = extractLoginSubtenants(response.data)
        if (subtenants.length) {
          this.applySubtenants(subtenants)
        } else if (Array.isArray(td?.subtenants) && td.subtenants.length) {
          this.applySubtenants(td.subtenants)
        }
        clearSessionExpiredUiSuppression()
        beginFreshSessionInactivityClock()

        return { mfaRequired: false }
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('invalidCredentials'), { cause: error })
          case 423:
            throw new Error(t('loginAccountLocked'), { cause: error })
          case 429:
            throw new Error(t('loginTooManyRequests'), { cause: error })
        }

        throw error
      }
    },
    async completeMfaLogin(challengeToken, code, t) {
      try {
        const response = await postMfaChallenge({
          mfaChallengeToken: challengeToken,
          code,
        })
        const td = extractOAuthTokenPayload(response)
        this.applyTokensFromApi(td)
        this.applyUserInfo(extractLoginUserInfo(response))
        const subtenants = extractLoginSubtenants(response)
        if (subtenants.length) {
          this.applySubtenants(subtenants)
        } else if (Array.isArray(td?.subtenants) && td.subtenants.length) {
          this.applySubtenants(td.subtenants)
        }
        clearSessionExpiredUiSuppression()
        beginFreshSessionInactivityClock()

        return true
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('loginMfaInvalidCode'), { cause: error })
          case 423:
            throw new Error(t('loginAccountLocked'), { cause: error })
          case 429:
            throw new Error(t('loginTooManyRequests'), { cause: error })
        }

        throw error
      }
    },
    async logout(router) {
      try {
        await apiInstance.post(apiPaths.logout)
      } catch {
        // Best-effort server revoke. Local session still ends.
      } finally {
        this.clearSession()
        await router.push('/login')
      }
    },
    async restoreSession() {
      await ensureAuthStorageHydrated()
      const token = readStoredToken()
      const expireAt = readStoredExpireAt()
      const refreshToken = readStoredRefreshToken()
      const subtenants = readStoredSubtenants()
      const activeSubtenantId = readStoredActiveSubtenantId()
      const tenantId = readStoredTenantId()
      const configData = readStoredConfigData()
      const userInfo = readStoredUserInfo()
      const mustChangePassword = readStoredMustChangePassword()
      const storedPasswordChangeMode = readStoredPasswordChangeMode()
      const mustEnrollMfa = readStoredMustEnrollMfa()
      if (token) {
        this.token = token
        this.expireAt = expireAt
        this.refreshToken = refreshToken
        this.tenantId = tenantId
        this.configData = configData
        this.userInfo = userInfo
        this.mustChangePassword = mustChangePassword
          || Boolean(userInfo?.changePassword)
        this.passwordChangeMode = this.mustChangePassword
          ? resolveRestoredPasswordChangeMode(
            storedPasswordChangeMode,
            userInfo,
          )
          : null
        this.mustEnrollMfa = mustEnrollMfa
          || (
            Boolean(userInfo?.mfaEnrollmentRequired)
            && !userInfo?.mfaEnabled
          )
        syncAppDateTimeConfigFromAuth(configData)
        if (subtenants.length) {
          this.applySubtenants(subtenants, activeSubtenantId)
        } else if (activeSubtenantId != null) {
          this.activeSubtenantId = activeSubtenantId
          void this.refreshDateTimeConfig()
        } else {
          void this.refreshDateTimeConfig()
        }
        writeStoredModules()
        writeStoredPermissions()
      }
    },
    async hydrateAuthorization() {
      if (!this.token) {
        return
      }
      if (authorizationHydrated) {
        return
      }
      if (!authorizationHydratePromise) {
        authorizationHydratePromise = this.loadAuthorizationFromApi()
          .finally(() => {
            authorizationHydrated = true
            authorizationHydratePromise = null
          })
      }
      await authorizationHydratePromise
    },
    async loadAuthorizationFromApi() {
      const tokenAtStart = this.token
      try {
        const codes = await fetchCurrentUserPermissionCodes()
        if (this.token !== tokenAtStart) {
          return
        }
        if (codes.length) {
          this.permissions = codes
        }
      } catch {
        // Route guards fall back to the in-memory grants from login.
      }
    },
    clearSession() {
      authorizationHydratePromise = null
      authorizationHydrated = false
      this.token = null
      this.expireAt = null
      this.refreshToken = null
      this.modules = []
      this.permissions = []
      this.subtenants = []
      this.activeSubtenantId = null
      this.tenantId = null
      this.configData = null
      this.userInfo = null
      this.mustChangePassword = false
      this.passwordChangeMode = null
      this.mustEnrollMfa = false
      syncAppDateTimeConfigFromAuth(null)
      clearSessionDisplayTimezone()
      clearClinicalResourceUserRolesCache()
      clearAuthLocalStorage()
    },
    init() {
      if (this._initialized) {
        return
      }
      this._initialized = true
      if (typeof window !== typeNames.undefined) {
        window.addEventListener('storage', event => {
          if (event.key === authStorageKeys.token && event.newValue === null) {
            this.token = null
            this.expireAt = null
            this.refreshToken = null
            this.modules = []
            this.permissions = []
            this.subtenants = []
            this.activeSubtenantId = null
            this.tenantId = null
            this.configData = null
            this.userInfo = null
            this.mustChangePassword = false
            this.passwordChangeMode = null
            this.mustEnrollMfa = false
            authorizationHydratePromise = null
            authorizationHydrated = false
            syncAppDateTimeConfigFromAuth(null)
            clearSessionDisplayTimezone()
            if (this.router) {
              this.router.push('/login')
            }
          }
        })
      }
    },
  },
})
