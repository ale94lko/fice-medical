import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth-store.js'
import {
  parseGithubPagesStoredRedirect,
  readGithubPagesStoredRedirect,
} from 'src/utils/gh-pages-router.js'

function getRequiredModule(to) {
  return to.matched
    .slice()
    .reverse()
    .find(record => record.meta.requiresModule)
    ?.meta.requiresModule
}

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

function resolveProtectedNavigation(to, authStore) {
  if (!resolveSessionAccess(authStore)) {
    return '/login'
  }

  const requiredModule = getRequiredModule(to)
  if (requiredModule && !authStore.hasModule(requiredModule)) {
    return '/dashboard'
  }

  return true
}

export default defineRouter(function(/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
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

  authStore.router = Router

  return Router
})
