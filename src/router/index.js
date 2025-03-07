import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'
import authStore from 'stores/auth-store.js'

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to, from, next) => {
    const store = authStore()
    console.log(store)
    if (to.meta.requiresAuth && !store.isAuthenticated) {
      try {
        await store.initializeAuth()
        if (store.isAuthenticated) {
          next()
        } else {
          next('/login')
        }
      } catch (error) {
        console.log(error)
        next('/login')
      }
    } else {
      next()
    }

    next()
    })
  return Router
})
