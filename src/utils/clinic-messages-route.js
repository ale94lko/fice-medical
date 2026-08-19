function firstRouteValue(value) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function positiveId(value) {
  const n = Number(firstRouteValue(value))
  if (!Number.isFinite(n) || n <= 0) {
    return null
  }

  return n
}

export function clinicMessagesLocation(conversationId) {
  const id = positiveId(conversationId)
  if (id == null) {
    return { name: 'ClinicMessages' }
  }

  return {
    name: 'ClinicMessagesThread',
    params: { conversationId: String(id) },
  }
}

export function clinicMessagesClientLocation(clientId) {
  const id = String(clientId ?? '').trim()
  if (!id) {
    return { name: 'ClinicMessages' }
  }

  return {
    name: 'ClinicMessages',
    query: { clientId: id },
  }
}

export function conversationIdFromRoute(route) {
  return positiveId(route?.params?.conversationId)
    ?? positiveId(route?.query?.conversationId)
}
