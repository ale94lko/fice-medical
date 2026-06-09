import { useAuthStore } from 'stores/auth-store.js'

function auditPayload(eventType, payload) {
  const auth = useAuthStore()
  const subtenant = auth?.activeSubtenant ?? null

  return {
    eventType,
    timestamp: new Date().toISOString(),
    userSubtenantId: subtenant?.id ?? null,
    userSubtenantCode: subtenant?.code ?? null,
    ...payload,
  }
}

/**
 * Client-side audit trail for duplicate-match decisions.
 * Dispatches a DOM event for future backend wiring; always logs in dev tools.
 */
export function emitClientDuplicateAudit(eventType, payload = {}) {
  const record = auditPayload(eventType, payload)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('fice-client-audit', { detail: record }),
    )
  }
  console.info('[CLIENT_AUDIT]', record)
}
