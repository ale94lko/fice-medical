import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { apiPaths } from 'components/constants.js'
import { resolveApiBaseUrl } from 'boot/axios.js'
import {
  readStoredToken,
  readStoredActiveSubtenantId,
  readStoredSubtenants,
} from 'src/utils/auth-local-storage.js'
import { deepMapRequestKeysToSnakeCase } from
  'src/utils/request-key-case.js'

function resolveSubtenantCode() {
  const activeId = readStoredActiveSubtenantId()
  const subtenants = readStoredSubtenants()
  if (!Array.isArray(subtenants) || !subtenants.length) {
    return ''
  }
  const match = subtenants.find(item => item.id === activeId) ?? subtenants[0]

  return String(match?.code ?? '').trim()
}

/**
 * SockJS endpoint URL must be http(s), never ws://.
 * Client probes GET /telehealth/info then picks a SockJS transport.
 *
 * Dev: same-origin `/telehealth` (Quasar → API_PROXY_TARGET).
 * Absolute VITE_API_BASE_URL + SockJS credentials breaks CORS
 * when the API returns Access-Control-Allow-Origin: *.
 *
 * Prod: absolute API base when set (GitHub Pages → API host).
 */
function sockJsUrl() {
  const path = apiPaths.telehealthSockJs
  // Dev: relative URL so Quasar proxy handles SockJS (no CORS).
  if (import.meta.env.DEV) {
    return path
  }
  const base = resolveApiBaseUrl().replace(/\/$/, '')
  if (base) {
    // Ensure http(s); never rewrite to ws for SockJS.
    const httpBase = base.replace(/^ws/i, 'http')

    return `${httpBase}${path}`
  }
  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}

// SockJS XHR uses withCredentials; off — auth is STOMP CONNECT.
const SOCKJS_OPTIONS = {
  transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
  transportOptions: {
    'xhr-streaming': { noCredentials: true },
    'xhr-polling': { noCredentials: true },
  },
}

function parseBody(message) {
  const raw = message?.body
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function stompFrameMessage(frame) {
  const headers = frame?.headers || {}
  const message = String(
    headers.message
    ?? headers['status-message']
    ?? frame?.body
    ?? '',
  ).trim()

  return message || 'Telehealth realtime connection was rejected'
}

/**
 * Create a STOMP-over-SockJS client for a single telehealth session.
 *
 * Destinations are always scoped to that sessionId:
 *   /topic/telehealth/{sessionId}/…
 *   /app/telehealth/{sessionId}/…
 *
 * guestAuth / getGuestAuth:
 *   { meetingToken, guestKey, tenantKey, subtenantKey }
 * Staff (no guest): Authorization Bearer + X-Subtenant-Key.
 */
export function createTelehealthStompClient({
  sessionId,
  guestAuth = null,
  getGuestAuth = null,
  onSignal,
  onWaiting,
  onChat,
  onFiles,
  onConnect,
  onDisconnect,
  onError,
} = {}) {
  const id = String(sessionId ?? '').trim()
  if (!id) {
    throw new Error('Telehealth session id is required for STOMP')
  }

  const subscriptions = []
  let client = null

  function resolveGuestAuth() {
    if (typeof getGuestAuth === 'function') {
      return getGuestAuth()
    }

    return guestAuth
  }

  function authHeaders() {
    const guest = resolveGuestAuth()
    if (guest) {
      const meetingToken = String(
        guest.meetingToken ?? guest.meeting_token ?? '',
      ).trim()
      const guestKey = String(
        guest.guestKey ?? guest.guest_key ?? '',
      ).trim()
      const tenantKey = String(
        guest.tenantKey ?? guest.tenant_key ?? '',
      ).trim()
      const subtenantKey = String(
        guest.subtenantKey ?? guest.subtenant_key ?? '',
      ).trim()
      if (!meetingToken || !guestKey || !tenantKey || !subtenantKey) {
        throw new Error(
          'Incomplete guest STOMP headers '
          + '(need meeting token, guest key, tenant, subtenant)',
        )
      }

      return {
        'X-Meeting-Token': meetingToken,
        'X-Guest-Key': guestKey,
        'X-Tenant-Key': tenantKey,
        'X-Subtenant-Key': subtenantKey,
      }
    }

    const token = readStoredToken()
    const subtenant = resolveSubtenantCode()
    if (!token) {
      throw new Error('Missing Authorization for telehealth STOMP')
    }
    if (!subtenant) {
      throw new Error('Missing X-Subtenant-Key for telehealth STOMP')
    }

    return {
      Authorization: `Bearer ${token}`,
      'X-Subtenant-Key': subtenant,
    }
  }

  function publish(destination, body) {
    if (!client?.connected) {
      return false
    }
    // Guard: never publish outside this session's app prefix.
    const prefix = `/app/telehealth/${id}/`
    if (!String(destination).startsWith(prefix)) {
      onError?.(new Error('STOMP publish blocked: wrong session destination'))

      return false
    }
    const payload = body != null && typeof body === 'object'
      ? deepMapRequestKeysToSnakeCase(body)
      : body
    client.publish({
      destination,
      body: JSON.stringify(payload ?? {}),
      headers: { 'content-type': 'application/json' },
    })

    return true
  }

  function connect() {
    if (client) {
      return client
    }
    let headers
    try {
      headers = authHeaders()
    } catch (error) {
      onError?.(error)
      throw error
    }
    client = new Client({
      // Backend exposes SockJS only — do not use brokerURL/ws://.
      webSocketFactory: () => new SockJS(
        sockJsUrl(),
        undefined,
        SOCKJS_OPTIONS,
      ),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: headers,
      beforeConnect: () => {
        try {
          client.connectHeaders = authHeaders()
        } catch (error) {
          onError?.(error)
          throw error
        }
      },
      onConnect: () => {
        // Subscribe only to this sessionId topics.
        const signalDest = `/topic/telehealth/${id}/signal`
        const waitingDest = `/topic/telehealth/${id}/waiting`
        const chatDest = `/topic/telehealth/${id}/chat`
        const filesDest = `/topic/telehealth/${id}/files`

        if (typeof onSignal === 'function') {
          subscriptions.push(
            client.subscribe(signalDest, message => {
              onSignal(parseBody(message))
            }),
          )
        }
        if (typeof onWaiting === 'function') {
          subscriptions.push(
            client.subscribe(waitingDest, message => {
              onWaiting(parseBody(message))
            }),
          )
        }
        if (typeof onChat === 'function') {
          subscriptions.push(
            client.subscribe(chatDest, message => {
              onChat(parseBody(message))
            }),
          )
        }
        if (typeof onFiles === 'function') {
          subscriptions.push(
            client.subscribe(filesDest, message => {
              onFiles(parseBody(message))
            }),
          )
        }
        onConnect?.()
      },
      onDisconnect: () => {
        onDisconnect?.()
      },
      onStompError: frame => {
        onError?.(new Error(stompFrameMessage(frame)))
      },
      onWebSocketError: event => {
        onError?.(event instanceof Error
          ? event
          : new Error('Telehealth websocket error'))
      },
    })
    client.activate()

    return client
  }

  function disconnect() {
    while (subscriptions.length) {
      const sub = subscriptions.pop()
      try {
        sub?.unsubscribe?.()
      } catch {
        // ignore
      }
    }
    if (client) {
      try {
        client.deactivate()
      } catch {
        // ignore
      }
      client = null
    }
  }

  return {
    connect,
    disconnect,
    isConnected: () => Boolean(client?.connected),
    sendSignal: payload => publish(`/app/telehealth/${id}/signal`, payload),
    sendWaiting: payload => publish(`/app/telehealth/${id}/waiting`, payload),
    sendChat: payload => publish(`/app/telehealth/${id}/chat`, payload),
  }
}
