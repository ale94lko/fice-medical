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
