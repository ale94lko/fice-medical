import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import {
  apiPaths,
  quasarNotifyTypes,
  typeNames,
} from 'components/constants.js'
import {
  extractLoginSubtenants,
  extractOAuthTokenPayload,
} from 'components/helpers.js'
import {
  readStoredActiveSubtenantId,
  readStoredExpireAt,
  readStoredRefreshToken,
  readStoredSubtenants,
  readStoredToken,
  writeStoredActiveSubtenantId,
  writeStoredExpireAt,
  writeStoredRefreshToken,
  writeStoredToken,
} from '../utils/auth-local-storage.js'
import {
  beginSessionExpiredUiSuppression,
  isInvalidRefreshTokenError,
  markErrorAsSessionLogoutHandled,
} from '../utils/api-session-error.js'
import {
  applyPasswordChangeRequiredFromApiError,
  applyPasswordChangeRequiredFromApiResponse,
  createPasswordChangeRequiredRejection,
} from '../utils/api-password-change-required.js'
import { deepMapRequestKeysToSnakeCase } from '../utils/request-key-case.js'
//import { resolveTenantKeyFromHost } from '../utils/tenant-from-host.js'
import { i18nGlobalT } from './i18n.js'

let lastSessionExpiredNotifyAt = 0

function resolveApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return ''
  }

  return ''
}

export { resolveApiBaseUrl }

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
})

let refreshInFlight = null

function isUnauthorizedError(error) {
  const status = error.response?.status

  return status === 401 || status === '401'
}

function subtenantCodeForActiveId(subtenants, activeId) {
  if (!Array.isArray(subtenants) || !subtenants.length) {
    return null
  }
  const id = activeId ?? subtenants[0]?.id
  const match = subtenants.find(item => item.id === id) ?? subtenants[0]
  const code = String(match?.code ?? '').trim()

  return code || null
}

async function resolveActiveSubtenantCode() {
  const activeId = readStoredActiveSubtenantId()
  const fromStorage = readStoredSubtenants()
  const storedCode = subtenantCodeForActiveId(fromStorage, activeId)
  if (storedCode) {
    return storedCode
  }
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    const store = useAuthStore()
    if (store.activeSubtenantId != null) {
      writeStoredActiveSubtenantId(store.activeSubtenantId)
    }

    return subtenantCodeForActiveId(store.subtenants, store.activeSubtenantId)
  } catch {
    // Pinia may be unavailable during very early boot
  }

  return null
}

async function getRefreshJwtForRequest() {
  let rt = readStoredRefreshToken()
  if (rt) {
    return rt
  }
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    rt = useAuthStore().refreshToken
    if (typeof rt === 'string' && rt.length > 0) {
      writeStoredRefreshToken(rt)

      return rt
    }
  } catch {
    // Pinia may be unavailable during very early boot
  }

  return null
}

function isPublicAuthUrl(url) {
  const u = url || ''

  return u.includes(apiPaths.oauthLogin)
    || u.includes(apiPaths.oauthRefresh)
    || u.includes(apiPaths.oauthForgotPassword)
    || u.includes(apiPaths.oauthResetPassword)
}

function getRefreshInFlight() {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null
    })
  }

  return refreshInFlight
}

async function persistTokensFromResponse(body) {
  const td = extractOAuthTokenPayload(body)
  if (!td?.token) {
    throw new Error('refresh: missing token')
  }
  writeStoredToken(td.token)
  writeStoredExpireAt(td.expiration ?? '')
  const { useAuthStore } = await import('stores/auth-store.js')
  const authStore = useAuthStore()
  authStore.applyTokensFromApi(td)
  const subtenants = extractLoginSubtenants(body)
  if (subtenants.length) {
    authStore.applySubtenants(subtenants)
  }
}

function stripAuthorizationHeader(cfg) {
  const h = cfg?.headers
  if (!h) {
    return
  }
  if (typeof h.delete === 'function') {
    h.delete('Authorization')
    h.delete('authorization')
  } else {
    delete h.Authorization
    delete h.authorization
  }
}

async function performRefresh() {
  const refreshJwt = await getRefreshJwtForRequest()
  if (!refreshJwt) {
    throw new Error('no refresh token')
  }
  const body = { refreshToken: refreshJwt }
  const res = await api.post(
    apiPaths.oauthRefresh,
    body,
    { __refreshCall: true }
  )
  await persistTokensFromResponse(res.data)
}

async function maybeRefreshAccessToken() {
  const token = readStoredToken()
  const exp = readStoredExpireAt()
  if (!token || !exp) {
    return
  }
  if (new Date() < new Date(exp)) {
    return
  }
  const rt = await getRefreshJwtForRequest()
  if (!rt) {
    return
  }
  try {
    await getRefreshInFlight()
  } catch {
    // request may 401; response interceptor will refresh or logout
  }
}

async function clearSessionFromApi() {
  const { useAuthStore } = await import('stores/auth-store.js')
  useAuthStore().clearSession()
}

async function clearSessionAndRedirectToLogin() {
  beginSessionExpiredUiSuppression()
  const now = Date.now()
  if (now - lastSessionExpiredNotifyAt > 600) {
    lastSessionExpiredNotifyAt = now
    Notify.create({
      type: quasarNotifyTypes.negative,
      message: i18nGlobalT('sessionExpiredRelogin'),
      position: 'top',
      timeout: 6000,
    })
  }
  await clearSessionFromApi()
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    const r = useAuthStore().router
    if (r && typeof r.replace === 'function') {
      await r.replace({ path: '/login' }).catch(() => {})
    }
  } catch {
    // Router may not be mounted yet
  }
}

api.interceptors.request.use(
  async config => {
    config.headers = config.headers || {}
    config.headers['X-Tenant-Key'] = 'pruebas'//resolveTenantKeyFromHost()

    // TODO(producción): quitar — header provisional ngrok (desarrollo).
    // axios.get('https://…ngrok-free.dev/api', {
    //   headers: { 'ngrok-skip-browser-warning': 'true' },
    // })
    config.headers['ngrok-skip-browser-warning'] = 'true'

    const url = config.url || ''
    const publicAuth = isPublicAuthUrl(url) || config.__refreshCall

    if (publicAuth) {
      stripAuthorizationHeader(config)
    } else {
      await maybeRefreshAccessToken()
      const t2 = readStoredToken()
      if (t2) {
        config.headers.Authorization = `Bearer ${t2}`
      }
      const subtenantCode = await resolveActiveSubtenantCode()
      if (subtenantCode) {
        config.headers['X-Subtenant-Key'] = subtenantCode
      }
    }

    if (
      config.data != null
      && typeof config.data === typeNames.object
      && !(config.data instanceof FormData)
      && !(config.data instanceof URLSearchParams)
      && !(config.data instanceof Blob)
      && !(config.data instanceof ArrayBuffer)
    ) {
      config.data = deepMapRequestKeysToSnakeCase(config.data)
    }

    return config
  },
  error => Promise.reject(error),
)

api.interceptors.response.use(
  async response => {
    if (await applyPasswordChangeRequiredFromApiResponse(response)) {
      return createPasswordChangeRequiredRejection(response)
    }

    return response
  },
  async error => {
    if (await applyPasswordChangeRequiredFromApiError(error)) {
      return Promise.reject(error)
    }

    const cfg = error.config
    if (cfg?.__refreshCall) {
      if (isInvalidRefreshTokenError(error)) {
        await clearSessionAndRedirectToLogin()
      }

      return Promise.reject(error)
    }
    if (!isUnauthorizedError(error) || !cfg || cfg.__retryAfterRefresh) {
      return Promise.reject(error)
    }
    if (
      cfg.url?.includes(apiPaths.oauthLogin)
      || cfg.url?.includes(apiPaths.oauthForgotPassword)
      || cfg.url?.includes(apiPaths.oauthResetPassword)
    ) {
      return Promise.reject(error)
    }

    const refreshJwt = await getRefreshJwtForRequest()
    if (!refreshJwt) {
      return Promise.reject(error)
    }

    cfg.__retryAfterRefresh = true
    try {
      await getRefreshInFlight()
      stripAuthorizationHeader(cfg)

      return api(cfg)
    } catch (refreshErr) {
      if (isInvalidRefreshTokenError(refreshErr)) {
        markErrorAsSessionLogoutHandled(error)
      }

      return Promise.reject(error)
    }
  },
)

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
  app.provide('api', api)
})

export const apiInstance = api

export function refreshAccessToken() {
  return getRefreshInFlight()
}

export { clearSessionAndRedirectToLogin }
