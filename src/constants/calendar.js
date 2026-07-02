export const calendarViewModes = {
  month: 'month',
  week: 'week',
  day: 'day',
  agenda: 'agenda',
}

export const calendarSourceIds = {
  myAppointments: 'my_appointments',
  clinicianAppointments: 'clinician_appointments',
  followUps: 'follow_ups',
  tasks: 'tasks',
}

export const calendarHourStart = 0
export const calendarHourEnd = 23
export const calendarSlotMinutes = 30
export const appointmentBookingGridSlotMinutes = 1
export const calendarHourCount = calendarHourEnd - calendarHourStart + 1
export const calendarTimeRowHeightPx = 48
export const calendarTimeGridHeightPx =
  calendarHourCount * calendarTimeRowHeightPx
export const appointmentAvailabilityScrollFocusHour = 8
