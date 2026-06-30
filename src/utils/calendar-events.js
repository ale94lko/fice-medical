import { appointmentStatuses } from 'components/constants.js'
import {
  calendarHourStart,
  calendarSourceIds,
  calendarTimeRowHeightPx,
} from 'src/constants/calendar.js'
import {
  formatUtcTime,
  formatUtcTimeRange,
  localDayKeyFromUtc,
  resolveTenantTimeZone,
} from 'src/utils/appointment-datetime.js'
import {
  buildCalendarEventColorStyle,
} from 'src/utils/calendar-clinician-colors.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseUtcDate(iso) {
  const raw = trim(iso)
  if (!raw) {
    return null
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

export function localMinutesFromUtc(iso, timeZone = resolveTenantTimeZone()) {
  const date = parseUtcDate(iso)
  if (!date) {
    return 0
  }

  const tz = trim(timeZone) || resolveTenantTimeZone()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0)

  return hour * 60 + minute
}

function resolveEventDurationMinutes(
  startAtUtc,
  endAtUtc,
  startMinutes,
  durationMinutes,
) {
  const duration = Number(durationMinutes)
  if (Number.isFinite(duration) && duration > 0) {
    return duration
  }

  const startMs = Date.parse(trim(startAtUtc))
  const endMs = Date.parse(trim(endAtUtc))
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    return Math.round((endMs - startMs) / 60000)
  }

  const endMinutes = localMinutesFromUtc(endAtUtc)
  if (endMinutes > startMinutes) {
    return endMinutes - startMinutes
  }

  return 30
}

function resolveEventEndAtUtc(startAtUtc, endAtUtc, durationMinutes) {
  const startMs = Date.parse(trim(startAtUtc))
  const duration = Number(durationMinutes)
  if (Number.isFinite(startMs) && Number.isFinite(duration) && duration > 0) {
    return new Date(startMs + duration * 60 * 1000).toISOString()
  }

  return trim(endAtUtc)
}

export function computeCalendarEventPositionStyle(
  startAtUtc,
  endAtUtc,
  timeZone = resolveTenantTimeZone(),
  durationMinutes = null,
) {
  const tz = trim(timeZone) || resolveTenantTimeZone()
  const gridStart = calendarHourStart * 60
  const start = localMinutesFromUtc(startAtUtc, tz)
  const durationMin = resolveEventDurationMinutes(
    startAtUtc,
    endAtUtc,
    start,
    durationMinutes,
  )
  const topPx = ((start - gridStart) / 60) * calendarTimeRowHeightPx
  const heightPx = Math.max(
    calendarTimeRowHeightPx / 4,
    (durationMin / 60) * calendarTimeRowHeightPx,
  )

  return {
    top: `${topPx}px`,
    height: `${heightPx}px`,
  }
}

export function getCalendarEventMinuteRange(
  event,
  timeZone = resolveTenantTimeZone(),
) {
  const tz = trim(timeZone) || resolveTenantTimeZone()
  const start = localMinutesFromUtc(event.startAtUtc, tz)
  const durationMin = resolveEventDurationMinutes(
    event.startAtUtc,
    event.endAtUtc,
    start,
    event.durationMin ?? event.appointment?.durationMin,
  )

  return {
    start,
    end: start + durationMin,
  }
}

export function eventStatusClass(status) {
  const normalized = trim(status).toUpperCase()

  if (normalized === appointmentStatuses.checkedIn) {
    return 'calendar-event--checked-in'
  }
  if (normalized === appointmentStatuses.completed) {
    return 'calendar-event--completed'
  }
  if (normalized === appointmentStatuses.cancelled) {
    return 'calendar-event--cancelled'
  }
  if (normalized === appointmentStatuses.noShow) {
    return 'calendar-event--no-show'
  }

  return 'calendar-event--confirmed'
}

export function appointmentToCalendarEvent(appointment, options = {}) {
  const sourceId = options.sourceId ?? calendarSourceIds.myAppointments
  const clientName = trim(
    appointment?.clientDisplayName
    ?? appointment?.clientName
    ?? appointment?.patientName,
  )
  const typeName = trim(appointment?.appointmentTypeName) || 'Appointment'
  const title = clientName
    ? `${clientName} – ${typeName}`
    : typeName
  const timeZone = options.timeZone ?? resolveTenantTimeZone()
  const endAtUtc = resolveEventEndAtUtc(
    appointment.startAtUtc,
    appointment.endAtUtc,
    appointment.durationMin,
  )

  return {
    id: `appointment-${appointment.appointmentId}`,
    sourceId,
    kind: 'appointment',
    title,
    typeLabel: typeName,
    startAtUtc: appointment.startAtUtc,
    endAtUtc,
    durationMin: appointment.durationMin,
    dayKey: localDayKeyFromUtc(appointment.startAtUtc, timeZone),
    status: appointment.status,
    statusClass: eventStatusClass(appointment.status),
    timeLabel: formatUtcTimeRange(
      appointment.startAtUtc,
      endAtUtc,
      timeZone,
    ),
    startTimeLabel: formatUtcTime(appointment.startAtUtc, timeZone),
    colorStyle: buildCalendarEventColorStyle(
      sourceId,
      appointment.clinicianId,
      { mySourceId: calendarSourceIds.myAppointments },
    ),
    appointment,
  }
}

export function mapAppointmentsToCalendarEvents(
  appointments,
  options = {},
) {
  return (appointments ?? [])
    .map(row => appointmentToCalendarEvent(row, options))
    .filter(row => row.dayKey && row.startAtUtc)
}

export function groupCalendarEventsByDay(events) {
  const map = new Map()

  for (const event of events ?? []) {
    if (!event.dayKey) {
      continue
    }
    if (!map.has(event.dayKey)) {
      map.set(event.dayKey, [])
    }
    map.get(event.dayKey).push(event)
  }

  for (const list of map.values()) {
    list.sort((a, b) =>
      String(a.startAtUtc).localeCompare(String(b.startAtUtc)),
    )
  }

  return map
}

export function filterEventsInDayRange(events, startDayKey, endDayKey) {
  const start = String(startDayKey ?? '')
  const end = String(endDayKey ?? '')

  return (events ?? []).filter(event => {
    const day = String(event.dayKey ?? '')

    return day && day >= start && day <= end
  })
}

export function filterEventsByEnabledSources(events, enabledSourceIds) {
  const enabled = new Set(enabledSourceIds ?? [])

  return (events ?? []).filter(event => enabled.has(event.sourceId))
}

export function filterCalendarDisplayEvents(
  events,
  {
    enabledSourceIds = [],
    enabledClinicianIds = [],
    mySourceId,
    clinicianSourceId,
    restrictByClinicianSelection = false,
  } = {},
) {
  const enabledSources = new Set(enabledSourceIds)
  const enabledClinicians = new Set(enabledClinicianIds)

  return (events ?? []).filter(event => {
    if (
      restrictByClinicianSelection
      && event.kind === 'appointment'
    ) {
      const clinicianId = event.appointment?.clinicianId
      if (clinicianId == null || !enabledClinicians.has(clinicianId)) {
        return false
      }
    }

    if (event.sourceId === mySourceId) {
      return enabledSources.has(mySourceId)
    }
    if (event.sourceId === clinicianSourceId) {
      const clinicianId = event.appointment?.clinicianId

      if (restrictByClinicianSelection) {
        return clinicianId != null && enabledClinicians.has(clinicianId)
      }

      return clinicianId != null && enabledClinicians.has(clinicianId)
    }

    return enabledSources.has(event.sourceId)
  })
}
