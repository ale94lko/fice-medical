export const chartChatHistoryLimits = {
  maxTurns: 8,
  maxChars: 500,
}

/**
 * Prior chat turns for the API (oldest first), excluding the message
 * just appended as the current user turn.
 */
export function chartChatHistoryPayload(messages) {
  const rows = Array.isArray(messages) ? messages : []
  const prior = rows.slice(0, -1)
  const turns = []
  for (const row of prior) {
    let role = null
    if (row?.role === 'user') {
      role = 'user'
    } else if (row?.role === 'assistant') {
      role = 'assistant'
    }
    if (!role) {
      continue
    }
    const text = String(row.text ?? '').trim()
    if (!text) {
      continue
    }
    turns.push({
      role,
      text: text.slice(0, chartChatHistoryLimits.maxChars),
    })
  }

  return turns.slice(-chartChatHistoryLimits.maxTurns)
}
