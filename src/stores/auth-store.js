import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import { apiPaths, permissionNames, passwordChangeModes, typeNames }
  from 'components/constants.js'
import {
  hasAnyPermission,
  hasAssignedPermissions,
  hasPermission,
} from 'src/utils/auth-permissions.js'
import {
  extractLoginSubtenants,
  extractLoginUserInfo,
  extractOAuthTokenPayload,
} from 'components/helpers.js'
import {
  clearAuthLocalStorage,
  readStoredActiveSubtenantId,
  readStoredConfigData,
  readStoredExpireAt,
  readStoredModules,
  readStoredMustChangePassword,
  readStoredPasswordChangeMode,
  readStoredPermissions,
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
  writeStoredPasswordChangeMode,
  writeStoredPermissions,
  writeStoredRefreshToken,
  writeStoredSubtenants,
  writeStoredToken,
  writeStoredTenantId,
  writeStoredUserInfo,
} from '../utils/auth-local-storage.js'
import { clearSessionExpiredUiSuppression } from '../utils/api-session-error.js'
import { syncAppDateTimeConfigFromAuth } from
  '../utils/sync-app-datetime-config.js'

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
    _initialized: false,
  }),
  getters: {
    isAuthenticated: state => !!state.token,
    requiresPasswordChange: state => state.mustChangePassword,
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
        permissionNames.viewTenantsUser,
        permissionNames.addTenantsUser,
        permissionNames.editTenantsUser,
        permissionNames.deleteTenantsUser,
      ]),
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
      if (Array.isArray(td.modules)) {
        this.modules = td.modules
        writeStoredModules(td.modules)
      }
      if (Array.isArray(td.permissions)) {
        this.permissions = td.permissions
        writeStoredPermissions(td.permissions)
      }
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
      writeStoredUserInfo(this.userInfo)
      writeStoredMustChangePassword(this.mustChangePassword)
      writeStoredPasswordChangeMode(this.passwordChangeMode)
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
    },
    async login(email, pass, t) {
      try {
        const response = await apiInstance.post(apiPaths.oauthLogin, {
          email: email,
          password: pass,
        })

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

        return true
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('invalidCredentials'))
        }

        throw error
      }
    },
    async logout(router, t) {
      try {
        await apiInstance.post(apiPaths.logout)
      } catch (error) {
        const st = error.response?.status ?? error.status
        switch (st) {
          case 401:
            throw new Error(t('alreadySignOut'))
        }

        throw error
      } finally {
        this.clearSession()
        await router.push('/login')
      }
    },
    restoreSession() {
      const token = readStoredToken()
      const expireAt = readStoredExpireAt()
      const refreshToken = readStoredRefreshToken()
      const modules = readStoredModules()
      const permissions = readStoredPermissions()
      const subtenants = readStoredSubtenants()
      const activeSubtenantId = readStoredActiveSubtenantId()
      const tenantId = readStoredTenantId()
      const configData = readStoredConfigData()
      const userInfo = readStoredUserInfo()
      const mustChangePassword = readStoredMustChangePassword()
      const storedPasswordChangeMode = readStoredPasswordChangeMode()
      if (token) {
        this.token = token
        this.expireAt = expireAt
        this.refreshToken = refreshToken
        this.modules = modules
        this.permissions = permissions
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
        syncAppDateTimeConfigFromAuth(configData)
        this.applySubtenants(subtenants, activeSubtenantId)
      }
    },
    clearSession() {
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
      syncAppDateTimeConfigFromAuth(null)
      clearAuthLocalStorage()
    },
    init() {
      if (this._initialized) {
        return
      }
      this._initialized = true
      if (typeof window !== typeNames.undefined) {
        window.addEventListener('storage', event => {
          if (event.key === 'token' && event.newValue === null) {
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
            syncAppDateTimeConfigFromAuth(null)
            if (this.router) {
              this.router.push('/login')
            }
          }
        })
      }
    },
  },
})
