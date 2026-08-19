import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeList } from 'components/helpers.js'
import {
  mapSecureConversations,
  mapSecureMessages,
  normalizeSecureConversation,
  normalizeSecureMessage,
} from 'src/utils/secure-message-normalize.js'

function unwrapData(body) {
  let current = body
  for (let i = 0; i < 3; i += 1) {
    if (current?.data != null
      && typeof current.data === 'object'
      && !Array.isArray(current.data)) {
      current = current.data
      continue
    }
    break
  }

  return current
}

function unwrapList(body) {
  let current = body
  for (let i = 0; i < 3; i += 1) {
    if (Array.isArray(current)) {
      return current
    }
    if (Array.isArray(current?.data)) {
      return current.data
    }
    if (Array.isArray(current?.items)) {
      return current.items
    }
    if (Array.isArray(current?.messages)) {
      return current.messages
    }
    if (Array.isArray(current?.content)) {
      return current.content
    }
    if (current && typeof current === 'object' && 'data' in current
      && current.data != null && typeof current.data === 'object') {
      current = current.data
      continue
    }
    break
  }

  return extractEnvelopeList(current)
}

function unwrapMessage(body) {
  let current = unwrapData(body)
  for (let i = 0; i < 4; i += 1) {
    if (current == null) {
      return null
    }
    if (Array.isArray(current)) {
      return mapSecureMessages(current)[0] ?? null
    }
    const parsed = normalizeSecureMessage(current)
    if (parsed) {
      return parsed
    }
    if (current && typeof current === 'object') {
      if (Array.isArray(current.data)) {
        return mapSecureMessages(current.data)[0] ?? null
      }
      if (current.data != null && typeof current.data === 'object') {
        current = current.data
        continue
      }
    }
    break
  }

  return null
}

export async function listStaffMessageInbox() {
  const { data } = await apiInstance.get(apiPaths.messagesInbox)

  return mapSecureConversations(unwrapList(data))
}

export async function getStaffConversation(conversationId) {
  const { data } = await apiInstance.get(
    apiPaths.messagesConversation(conversationId),
  )

  return normalizeSecureConversation(unwrapData(data))
}

export async function getStaffConversationForClient(clientId) {
  const { data } = await apiInstance.get(
    apiPaths.messagesByClient(clientId),
  )

  return normalizeSecureConversation(unwrapData(data))
}

export async function listStaffMessages(conversationId, afterId) {
  const params = {}
  if (afterId) {
    params['after_id'] = afterId
  }
  const { data } = await apiInstance.get(
    apiPaths.messagesList(conversationId),
    { params },
  )

  return mapSecureMessages(unwrapList(data))
}

export async function sendStaffMessage(conversationId, body) {
  const { data } = await apiInstance.post(
    apiPaths.messagesSend(conversationId),
    { body },
  )

  return unwrapMessage(data)
}

export async function sendStaffMessageFile(
  conversationId,
  file,
  caption,
) {
  const form = new FormData()
  form.append('file', file)
  if (caption) {
    form.append('caption', caption)
  }
  const { data } = await apiInstance.post(
    apiPaths.messagesFiles(conversationId),
    form,
  )

  return unwrapMessage(data)
}

export async function markStaffMessagesRead(conversationId) {
  await apiInstance.post(apiPaths.messagesRead(conversationId))
}

export async function downloadStaffMessageFile(
  conversationId,
  fileId,
) {
  const { data, headers } = await apiInstance.get(
    apiPaths.messagesFile(conversationId, fileId),
    { responseType: 'blob' },
  )

  return {
    blob: data,
    contentType: headers?.['content-type'] ?? '',
    filename: filenameFromHeader(headers?.['content-disposition']),
  }
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'file'
  link.click()
  URL.revokeObjectURL(url)
}

function filenameFromHeader(header) {
  const raw = String(header ?? '')
  const match = raw.match(/filename="?([^"]+)"?/i)

  return match?.[1] ?? ''
}
