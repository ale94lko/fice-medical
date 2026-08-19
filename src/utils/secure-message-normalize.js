import { formatDateTime, formatTime } from 'src/utils/app-datetime.js'

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function trim(value) {
  return String(value ?? '').trim()
}

export function isImageContentType(contentType) {
  return String(contentType ?? '')
    .toLowerCase()
    .startsWith('image/')
}

export function normalizeSecureMessageFile(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }

  return {
    id,
    originalFilename: trim(
      raw.original_filename ?? raw.originalFilename,
    ),
    contentType: trim(
      raw.content_type ?? raw.contentType,
    ).toLowerCase(),
    fileSize: parseOptionalNumber(raw.file_size ?? raw.fileSize),
  }
}

export function normalizeSecureMessage(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }

  return {
    id,
    conversationId: parseOptionalNumber(
      raw.conversation_id ?? raw.conversationId,
    ),
    senderType: trim(raw.sender_type ?? raw.senderType).toUpperCase(),
    senderDisplayName: trim(
      raw.sender_display_name ?? raw.senderDisplayName,
    ),
    mine: Boolean(raw.mine),
    messageType: trim(
      raw.message_type ?? raw.messageType,
    ).toUpperCase(),
    body: trim(raw.body),
    file: normalizeSecureMessageFile(raw.file),
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  }
}

export function mapSecureMessages(list) {
  const rows = Array.isArray(list) ? list : []

  return rows.map(normalizeSecureMessage).filter(Boolean)
}

export function mergeSecureMessages(existing, incoming) {
  const byId = new Map()
  ;[...existing, ...incoming].forEach((row) => {
    if (row?.id != null) {
      byId.set(row.id, row)
    }
  })

  return [...byId.values()].sort((a, b) => {
    const aId = Number(a?.id)
    const bId = Number(b?.id)
    if (Number.isFinite(aId) && Number.isFinite(bId)) {
      return aId - bId
    }

    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
  })
}

export function lastNumericMessageId(rows) {
  const list = Array.isArray(rows) ? rows : []
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const n = Number(list[i]?.id)
    if (Number.isFinite(n) && n > 0) {
      return n
    }
  }

  return null
}

export function normalizeSecureConversation(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }

  return {
    id,
    clientId: parseOptionalNumber(raw.client_id ?? raw.clientId),
    clientNumber: trim(raw.client_number ?? raw.clientNumber),
    clientDisplayName: trim(
      raw.client_display_name ?? raw.clientDisplayName,
    ),
    status: trim(raw.status),
    lastMessageAt: raw.last_message_at ?? raw.lastMessageAt ?? null,
    lastMessagePreview: trim(
      raw.last_message_preview ?? raw.lastMessagePreview,
    ),
    unreadCount: parseOptionalNumber(
      raw.unread_count ?? raw.unreadCount,
    ) ?? 0,
  }
}

export function mapSecureConversations(list) {
  const rows = Array.isArray(list) ? list : []

  return rows.map(normalizeSecureConversation).filter(Boolean)
}

export function formatMessageTime(value) {
  return formatDateTime(value)
}

export function formatMessageClock(value) {
  return formatTime(value)
}

export function conversationMatchesQuery(row, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) {
    return true
  }
  const name = String(row?.clientDisplayName ?? '').toLowerCase()
  const number = String(row?.clientNumber ?? '').toLowerCase()
  const preview = String(row?.lastMessagePreview ?? '').toLowerCase()

  return name.includes(q)
    || number.includes(q)
    || preview.includes(q)
}
