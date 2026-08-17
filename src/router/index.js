import { defineRouter } from '#q-app'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth-store.js'
import {
  isStaleChunkLoadError,
  parseGithubPagesStoredRedirect,
  readGithubPagesStoredRedirect,
  reloadRouteAfterStaleChunk,
  installUnhandledStaleChunkReload,
} from 'src/utils/gh-pages-router.js'

import { canAccessRoute } from 'src/composables/useMainNavPermissions.js'
import { clearSharedSessionInactivityState } from
  'src/utils/session-inactivity-sync.js'

function resolveSessionAccess(authStore) {
  let expireAt = new Date(authStore.expireAt)
  let token = authStore.token

  if (authStore.token == null) {
    authStore.restoreSession()
    expireAt = new Date(authStore.expireAt)
    token = authStore.token
  }

  const now = new Date()
  const accessValid = token != null && expireAt
    && !Number.isNaN(expireAt.getTime())
    && now < expireAt
  const canUseRefresh = token != null && authStore.refreshToken != null

  return accessValid || canUseRefresh
}

function getRouteAccessMeta(to) {
  return to.matched
    .slice()
    .reverse()
    .find(record =>
      record.meta.requiresPermission
      || record.meta.requiresAnyPermission
      || record.meta.requiresModule,
    )?.meta
}

function resolveProtectedNavigation(to, authStore) {
  if (!resolveSessionAccess(authStore)) {
    clearSharedSessionInactivityState()

    return '/login'
  }

  const meta = getRouteAccessMeta(to)
  if (meta && !canAccessRoute(authStore.permissions, meta)) {
    return '/dashboard'
  }

  return true
}

export default defineRouter(function(/* { store, ssrContext } */) {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  const authStore = useAuthStore()
  authStore.init()

  let githubPagesRedirectHandled = false

  Router.beforeEach(async(to, from, next) => {
    if (!githubPagesRedirectHandled) {
      githubPagesRedirectHandled = true
      const stored = readGithubPagesStoredRedirect()
      if (stored) {
        const target = parseGithubPagesStoredRedirect(stored, Router)
        if (target && target !== to.fullPath) {
          next(target)
          return
        }
      }
    }

    if (authStore.token == null) {
      authStore.restoreSession()
    }
    if (authStore.token) {
      await authStore.hydrateAuthorization()
    }

    const holdOnLogin = to.path === '/login'
      || to.path === '/reset-password'
      || to.path.startsWith('/meet')
      || to.path.startsWith('/consent-sign')
    if (authStore.needsPostLoginSetup && !holdOnLogin) {
      next('/login')
      return
    }

    if (!to.meta.requiresAuth) {
      next()
      return
    }

    try {
      const result = resolveProtectedNavigation(to, authStore)
      if (result === true) {
        next()
      } else {
        next(result)
      }
    } catch (error) {
      console.log(error)
      next('/login')
    }
  })

  Router.onError((error, to) => {
    if (isStaleChunkLoadError(error)
      && reloadRouteAfterStaleChunk(to, Router)) {
      return
    }

    throw error
  })

  installUnhandledStaleChunkReload(Router)

  authStore.router = Router

  return Router
})
