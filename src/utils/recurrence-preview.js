import { isoDateToUsDateString, parseUsDateString }
  from 'src/utils/client-form.js'
import {
  formatUtcDateTimeDisplay,
  localDayKeyFromUtc,
  localDateTimeToUtcIso,
  localHmFromUtc,
  usDateStringToLocalDayKey,
} from 'src/utils/appointment-datetime.js'

function parseHm(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? '').trim())
  if (!match) {
    return { hour: 0, minute: 0 }
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  }
}

export function mapRecurrencePreviewRow(raw, index) {
  const originalStart = raw?.original_start_at_utc
    ?? raw?.originalStartAtUtc
    ?? ''
  const originalEnd = raw?.original_end_at_utc
    ?? raw?.originalEndAtUtc
    ?? ''
  const proposedStart = raw?.proposed_start_at_utc
    ?? raw?.proposedStartAtUtc
    ?? originalStart
  const adjustment = String(
    raw?.adjustment ?? 'none',
  ).trim() || 'none'
  const unresolved = Boolean(
    raw?.unresolved ?? raw?.isUnresolved,
  )
  const dayKey = localDayKeyFromUtc(proposedStart)

  return {
    index: Number(raw?.index ?? index + 1),
    originalStartAtUtc: originalStart,
    originalEndAtUtc: originalEnd,
    originalLabel: formatUtcDateTimeDisplay(
      originalStart,
      originalEnd,
    ),
    proposedStartAtUtc: proposedStart,
    dateUs: isoDateToUsDateString(dayKey),
    timeHm: localHmFromUtc(proposedStart),
    overlapping: false,
    userEdited: false,
    adjustment,
    unresolved,
    reason: String(raw?.reason ?? '').trim(),
  }
}

export function mapRecurrencePreviewResponse(raw) {
  const root = raw ?? {}
  const list = Array.isArray(root.occurrences) ? root.occurrences : []

  return {
    durationMinutes: Number(root.duration_minutes
      ?? root.durationMinutes
      ?? 0),
    rows: list.map((row, index) => mapRecurrencePreviewRow(row, index)),
  }
}

export function rebuildProposedStart(row) {
  const dayKey = usDateStringToLocalDayKey(row?.dateUs)
  const { hour, minute } = parseHm(row?.timeHm)
  if (!dayKey) {
    return row?.proposedStartAtUtc ?? ''
  }

  return localDateTimeToUtcIso(dayKey, hour, minute)
}

export function isPreviewRowFlagged(row) {
  if (row?.unresolved || row?.overlapping) {
    return true
  }

  return row?.adjustment === 'same_day'
    || row?.adjustment === 'next_day'
    || row?.adjustment === 'unavailable'
}

const WEEKDAY_I18N_KEYS = [
  'weekdaySun',
  'weekdayMon',
  'weekdayTue',
  'weekdayWed',
  'weekdayThu',
  'weekdayFri',
  'weekdaySat',
]

export function weekdayI18nKeyFromUsDate(dateUs) {
  const parsed = parseUsDateString(dateUs)
  if (!parsed) {
    return ''
  }

  return WEEKDAY_I18N_KEYS[parsed.getDay()] || ''
}

export function buildOccurrenceOverrides(rows) {
  /* eslint-disable camelcase -- API payload */
  return (Array.isArray(rows) ? rows : []).map(row => {
    const start = rebuildProposedStart(row)
    const item = { start_at_utc: start }
    if (row?.overlapping) {
      item.allow_over_schedule_blocks = true
    }

    return item
  })
  /* eslint-enable camelcase */
}
