/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapData(body) {
  if (body?.data != null) {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(data?.items)) {
    return data.items
  }

  return []
}

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

export function normalizeNotification(raw = {}) {
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }

  return {
    id,
    type: trim(raw.notification_type ?? raw.notificationType),
    title: trim(raw.title),
    body: trim(raw.body),
    entityType: trim(raw.entity_type ?? raw.entityType).toUpperCase(),
    entityId: parseOptionalNumber(raw.entity_id ?? raw.entityId),
    readAt: trim(raw.read_at ?? raw.readAt),
    createdAt: trim(raw.created_at ?? raw.createdAt),
    unread: !trim(raw.read_at ?? raw.readAt),
  }
}

export async function listNotifications({ unreadOnly = false } = {}) {
  const response = await apiInstance.get(apiPaths.notifications, {
    params: { unread_only: unreadOnly },
  })

  return unwrapList(response.data)
    .map(normalizeNotification)
    .filter(Boolean)
}

export async function markNotificationRead(notificationId) {
  const response = await apiInstance.post(
    apiPaths.notificationRead(notificationId),
  )

  return normalizeNotification(unwrapData(response.data))
}

export async function markAllNotificationsRead() {
  await apiInstance.post(apiPaths.notificationsReadAll)
}

export async function deleteNotification(notificationId) {
  await apiInstance.delete(apiPaths.notificationById(notificationId))
}
