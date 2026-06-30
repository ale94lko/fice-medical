/**
 * UTC ↔ tenant-local display helpers for appointments.
 */
import {
  getAppDateTimeConfig,
  resolveIntlTimeZone,
} from 'src/utils/app-datetime.js'

export function resolveTenantTimeZone() {
  const configured = resolveIntlTimeZone(getAppDateTimeConfig().timezone)
  if (configured) {
    return configured
  }
  try {
    // eslint-disable-next-line new-cap
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function parseUtcDate(iso) {
  const raw = String(iso ?? '').trim()
  if (!raw) {
    return null
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatUtcDateLong(iso, timeZone = resolveTenantTimeZone()) {
  const date = parseUtcDate(iso)
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatUtcTime(iso, timeZone = resolveTenantTimeZone()) {
  const date = parseUtcDate(iso)
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatUtcTimeRange(
  startIso,
  endIso,
  timeZone = resolveTenantTimeZone(),
) {
  const start = formatUtcTime(startIso, timeZone)
  const end = formatUtcTime(endIso, timeZone)
  if (!start || !end) {
    return start || end || ''
  }

  return `${start} - ${end}`
}

export function formatUtcDateTimeDisplay(
  startIso,
  endIso,
  timeZone = resolveTenantTimeZone(),
) {
  const date = formatUtcDateLong(startIso, timeZone)
  const time = formatUtcTimeRange(startIso, endIso, timeZone)
  if (!date) {
    return time
  }
  if (!time) {
    return date
  }

  return `${date}\n${time}`
}

export function localDayKeyFromUtc(iso, timeZone = resolveTenantTimeZone()) {
  const date = parseUtcDate(iso)
  if (!date) {
    return ''
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = parts.find(p => p.type === 'year')?.value ?? ''
  const m = parts.find(p => p.type === 'month')?.value ?? ''
  const d = parts.find(p => p.type === 'day')?.value ?? ''

  return `${y}-${m}-${d}`
}

export function localDateTimeToUtcIso(
  dayKey,
  hour,
  minute = 0,
  timeZone = resolveTenantTimeZone(),
) {
  const { fromUtc } = utcRangeForLocalDay(dayKey, timeZone)
  const startMs = Date.parse(fromUtc)
  if (!Number.isFinite(startMs)) {
    return ''
  }

  const offsetMinutes = Number(hour) * 60 + Number(minute)

  return new Date(startMs + offsetMinutes * 60 * 1000).toISOString()
}

export function utcRangeForLocalDay(
  dayKey,
  timeZone = resolveTenantTimeZone(),
) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey ?? ''))
  if (!match) {
    return { fromUtc: '', toUtc: '' }
  }
  const [, y, m, d] = match
  const noonUtc = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12))
  const offsetMs = getTimeZoneOffsetMs(noonUtc, timeZone)
  const startLocalAsUtc = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0),
  )
  const fromUtc = new Date(startLocalAsUtc.getTime() + offsetMs)
  const endLocalAsUtc = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), 23, 59, 59, 999),
  )
  const toUtc = new Date(endLocalAsUtc.getTime() + offsetMs)

  return {
    fromUtc: fromUtc.toISOString(),
    toUtc: toUtc.toISOString(),
  }
}

function getTimeZoneOffsetMs(date, timeZone) {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(date.toLocaleString('en-US', { timeZone }))

  return utc.getTime() - local.getTime()
}

export function formatTimeZoneLabel(timeZone = resolveTenantTimeZone()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    const offset = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    const name = timeZone.replace(/_/g, ' ')

    return `(GMT${offset.replace('GMT', '')}) ${name}`.trim()
  } catch {
    return timeZone
  }
}

export function addDaysToDayKey(dayKey, delta) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey ?? ''))
  if (!match) {
    return ''
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  date.setDate(date.getDate() + delta)

  return localDayKeyFromParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
}

export function isDayKeyInRange(dayKey, startDayKey, endDayKey) {
  const day = String(dayKey ?? '')
  const start = String(startDayKey ?? '')
  const end = String(endDayKey ?? '')
  if (!day || !start || !end) {
    return false
  }

  return day >= start && day <= end
}

export function addMonthsToMonthKey(monthKey, delta) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey ?? ''))
  if (!match) {
    return monthKey
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function appointmentSlotQueryRange(
  lookaheadDays,
  timeZone = resolveTenantTimeZone(),
) {
  const startDayKey = todayLocalDayKey(timeZone)
  const endDayKey = addDaysToDayKey(startDayKey, lookaheadDays)
  const fromUtc = utcRangeForLocalDay(startDayKey, timeZone).fromUtc
  const toUtc = utcRangeForLocalDay(endDayKey, timeZone).toUtc

  return {
    startDayKey,
    endDayKey,
    fromUtc,
    toUtc,
  }
}

export function addMonthsToDayKey(dayKey, delta) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey ?? ''))
  if (!match) {
    return dayKey
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1 + delta,
    Number(match[3]),
  )

  return localDayKeyFromParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
}

export function localDayKeyFromParts(year, month, day) {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')

  return `${year}-${mm}-${dd}`
}

export function calendarDaysForMonth(monthKey) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey ?? ''))
  if (!match) {
    return []
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const last = new Date(year, month, 0)
  const days = []
  for (let d = 1; d <= last.getDate(); d += 1) {
    days.push(localDayKeyFromParts(year, month, d))
  }

  return days
}

export function monthKeyFromDayKey(dayKey) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(String(dayKey ?? ''))

  return match ? `${match[1]}-${match[2]}` : ''
}

export function formatMonthYear(monthKey, timeZone = resolveTenantTimeZone()) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey ?? ''))
  if (!match) {
    return ''
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 15)

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function todayLocalDayKey(timeZone = resolveTenantTimeZone()) {
  return localDayKeyFromUtc(new Date().toISOString(), timeZone)
}

export function groupSlotsByLocalDay(
  slots,
  timeZone = resolveTenantTimeZone(),
) {
  const map = new Map()
  for (const slot of slots ?? []) {
    const key = localDayKeyFromUtc(slot.startAtUtc, timeZone)
    if (!key) {
      continue
    }
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key).push(slot)
  }
  for (const list of map.values()) {
    list.sort((a, b) =>
      String(a.startAtUtc).localeCompare(String(b.startAtUtc)),
    )
  }

  return map
}

export function firstAvailableDayKey(
  slots,
  timeZone = resolveTenantTimeZone(),
) {
  const grouped = groupSlotsByLocalDay(slots, timeZone)
  const keys = [...grouped.keys()].sort()

  return keys[0] ?? ''
}
