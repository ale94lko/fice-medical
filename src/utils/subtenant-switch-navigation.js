/**
 * When switching subtenant, entity-specific routes (edit/detail/add)
 * should not keep the same :id — redirect to the module list instead.
 */
const SUBTENANT_SWITCH_FALLBACKS = [
  { prefix: '/clients/', fallback: '/clients' },
  { prefix: '/staff/', fallback: '/staff' },
]

export function resolveSubtenantSwitchRoute(path) {
  const normalized = String(path ?? '').trim() || '/'
  const match = SUBTENANT_SWITCH_FALLBACKS.find(
    rule => normalized.startsWith(rule.prefix),
  )

  return match?.fallback ?? null
}
