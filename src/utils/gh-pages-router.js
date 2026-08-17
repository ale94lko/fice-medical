/** Parse path saved by public/404.html for GitHub Pages SPA hosting. */
export function parseGithubPagesStoredRedirect(stored, router) {
  const raw = String(stored ?? '').trim()
  if (!raw) {
    return null
  }

  const base = router.options.history.base || '/'
  const basePath = base.endsWith('/') ? base.slice(0, -1) : base
  let path = raw
  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length) || '/'
  }

  return path.startsWith('/') ? path : `/${path}`
}

export function readGithubPagesStoredRedirect() {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  const stored = sessionStorage.getItem('redirect')
  if (!stored) {
    return null
  }
  sessionStorage.removeItem('redirect')

  return stored
}

const CHUNK_RELOAD_SESSION_PREFIX = 'fice-medical:chunk-reload:'

/** True when a lazy route chunk failed to load (stale deploy / cache). */
export function isStaleChunkLoadError(error) {
  const message = String(error?.message ?? error ?? '')

  return /Failed to fetch dynamically imported module/i.test(message)
    || /error loading dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message)
}

function githubPagesAppBase(routerBase) {
  const fromRouter = String(routerBase ?? '').replace(/\/$/, '')
  if (fromRouter) {
    return fromRouter
  }

  const path = String(window.location.pathname || '/')
  const known = ['/fice-medical', '/fice-medical-admin', '/fice-medical-client']
  const match = known.find(base =>
    path === base || path.startsWith(`${base}/`))

  return match || ''
}

function assignWithinGithubPages(path, routerBase) {
  const base = githubPagesAppBase(routerBase)
  const routePath = String(path || '/').startsWith('/')
    ? path
    : `/${path}`

  window.location.assign(`${window.location.origin}${base}${routePath}`)
}

/**
 * After a deploy, hashed JS chunks change. Reload once so index.html
 * picks up the new entry bundle.
 */
export function reloadRouteAfterStaleChunk(to, router) {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false
  }

  const fullPath = to?.fullPath || window.location.pathname || '/'
  const reloadKey = `${CHUNK_RELOAD_SESSION_PREFIX}${fullPath}`
  if (sessionStorage.getItem(reloadKey)) {
    sessionStorage.removeItem(reloadKey)

    return false
  }

  sessionStorage.setItem(reloadKey, '1')
  assignWithinGithubPages(
    to?.fullPath || '/',
    router?.options?.history?.base,
  )

  return true
}

/** Prefetch/lazy imports outside the router also 404 after a deploy. */
export function installUnhandledStaleChunkReload(router) {
  if (typeof window === 'undefined') {
    return
  }

  window.addEventListener('unhandledrejection', event => {
    if (!isStaleChunkLoadError(event.reason)) {
      return
    }
    event.preventDefault()
    reloadRouteAfterStaleChunk(
      router?.currentRoute?.value,
      router,
    )
  })
}
