import {
  ensureUtcIsoString,
} from 'src/utils/appointment-datetime.js'

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

export function normalizeWeeklyScheduleBreak(raw) {
  const row = raw ?? {}

  return {
    startAtUtc: ensureUtcIsoString(
      row.start_at_utc ?? row.startAtUtc,
    ),
    endAtUtc: ensureUtcIsoString(
      row.end_at_utc ?? row.endAtUtc,
    ),
  }
}

export function normalizeWeeklyScheduleResponse(raw) {
  const row = raw ?? {}

  return {
    scheduleId: parseOptionalNumber(row.schedule_id ?? row.scheduleId),
    dayOfWeek: parseOptionalNumber(row.day_of_week ?? row.dayOfWeek),
    openAtUtc: ensureUtcIsoString(row.open_at_utc ?? row.openAtUtc),
    closeAtUtc: ensureUtcIsoString(row.close_at_utc ?? row.closeAtUtc),
    lunchStartAtUtc: ensureUtcIsoString(
      row.lunch_start_at_utc ?? row.lunchStartAtUtc,
    ) || null,
    lunchEndAtUtc: ensureUtcIsoString(
      row.lunch_end_at_utc ?? row.lunchEndAtUtc,
    ) || null,
    breaks: (row.breaks ?? []).map(normalizeWeeklyScheduleBreak),
    effectiveFromUtc: ensureUtcIsoString(
      row.effective_from_utc ?? row.effectiveFromUtc,
    ),
    effectiveToUtc: ensureUtcIsoString(
      row.effective_to_utc ?? row.effectiveToUtc,
    ) || null,
  }
}

export function mapWeeklyScheduleList(rawList = []) {
  const list = Array.isArray(rawList) ? rawList : []

  return list
    .map(normalizeWeeklyScheduleResponse)
    .filter(row => row.scheduleId != null || row.dayOfWeek != null)
}
