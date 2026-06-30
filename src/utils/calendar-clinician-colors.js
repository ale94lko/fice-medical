/**
 * Calendar clinician colors — green ($positive) is reserved for "my" events.
 */
export const calendarMyEventColors = {
  backgroundColor: '#dcfce7',
  color: '#15803d',
}

const clinicianColorPalette = [
  { backgroundColor: '#e0f2fe', color: '#0369a1' },
  { backgroundColor: '#e0e7ff', color: '#4338ca' },
  { backgroundColor: '#ede9fe', color: '#6d28d9' },
  { backgroundColor: '#fce7f3', color: '#be185d' },
  { backgroundColor: '#fef3c7', color: '#b45309' },
  { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  { backgroundColor: '#f3e8ff', color: '#7e22ce' },
  { backgroundColor: '#ffe4e6', color: '#be123c' },
]

const clinicianCheckboxColors = [
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#3b82f6',
  '#a855f7',
  '#f43f5e',
]

function paletteIndexForClinicianId(clinicianId) {
  const id = Number(clinicianId)
  if (!Number.isFinite(id)) {
    return 0
  }

  return Math.abs(id) % clinicianColorPalette.length
}

export function getClinicianCalendarColors(clinicianId) {
  return clinicianColorPalette[paletteIndexForClinicianId(clinicianId)]
}

export function getClinicianCheckboxColor(clinicianId) {
  return clinicianCheckboxColors[paletteIndexForClinicianId(clinicianId)]
}

export function buildCalendarEventColorStyle(sourceId, clinicianId, options) {
  const mySourceId = options?.mySourceId
  if (sourceId === mySourceId) {
    return { ...calendarMyEventColors }
  }

  return { ...getClinicianCalendarColors(clinicianId) }
}
