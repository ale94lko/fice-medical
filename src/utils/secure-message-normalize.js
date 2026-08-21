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
    senderStaffUserId: parseOptionalNumber(
      raw.sender_staff_user_id ?? raw.senderStaffUserId,
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

export function isPendingSecureMessage(row) {
  return Boolean(row?.pending)
    || String(row?.id ?? '').startsWith('pending-')
}

function messageSortTime(row) {
  const time = Date.parse(String(row?.createdAt ?? ''))

  return Number.isFinite(time) ? time : 0
}

function compareSecureMessages(a, b) {
  const aPending = isPendingSecureMessage(a) ? 1 : 0
  const bPending = isPendingSecureMessage(b) ? 1 : 0
  const aId = Number(a?.id)
  const bId = Number(b?.id)
  if (!aPending && !bPending
    && Number.isFinite(aId) && Number.isFinite(bId)) {
    return aId - bId
  }
  const aTime = messageSortTime(a)
  const bTime = messageSortTime(b)
  if (aTime !== bTime) {
    return aTime - bTime
  }
  if (aPending !== bPending) {
    return aPending - bPending
  }

  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
}

export function mergeSecureMessages(existing, incoming) {
  const byId = new Map()
  ;[...existing, ...incoming].forEach((row) => {
    if (row?.id != null) {
      byId.set(row.id, row)
    }
  })

  return [...byId.values()].sort(compareSecureMessages)
}

function pendingMatchesSaved(pending, saved) {
  if (!saved || isPendingSecureMessage(saved) || !saved.mine) {
    return false
  }
  if (pending.body && pending.body === saved.body) {
    return true
  }
  const pendingName = pending.file?.originalFilename
  const savedName = saved.file?.originalFilename

  return Boolean(pendingName) && pendingName === savedName
}

export function dropMatchedPendingMessages(list, incoming) {
  const incomingList = Array.isArray(incoming) ? incoming : []
  const current = Array.isArray(list) ? list : []
  if (!incomingList.length) {
    return current
  }

  return current.filter((row) => {
    if (!isPendingSecureMessage(row)) {
      return true
    }

    return !incomingList.some(saved =>
      pendingMatchesSaved(row, saved),
    )
  })
}

export function replacePendingSecureMessage(
  list,
  pendingId,
  saved,
) {
  const without = (Array.isArray(list) ? list : [])
    .filter(row => row?.id !== pendingId)
  if (!saved) {
    return without
  }

  return mergeSecureMessages(without, [saved])
}

let pendingSeq = 0

function pendingMessageFile(pendingId, file) {
  if (!file) {
    return null
  }

  return {
    id: `pending-file-${pendingId}`,
    originalFilename: trim(file.name),
    contentType: trim(file.type).toLowerCase(),
    fileSize: parseOptionalNumber(file.size),
  }
}

export function createPendingSecureMessage({
  conversationId,
  body,
  file,
  senderStaffUserId,
} = {}) {
  pendingSeq += 1
  const id = `pending-${Date.now()}-${pendingSeq}`
  const hasFile = Boolean(file)

  return {
    id,
    conversationId: parseOptionalNumber(conversationId),
    senderType: 'STAFF',
    senderDisplayName: '',
    senderStaffUserId: parseOptionalNumber(senderStaffUserId),
    mine: true,
    messageType: hasFile ? 'FILE' : 'TEXT',
    body: trim(body),
    file: pendingMessageFile(id, file),
    createdAt: new Date().toISOString(),
    pending: true,
  }
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
    clientPhotoFileId: parseOptionalNumber(
      raw.client_photo_file_id ?? raw.clientPhotoFileId,
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
