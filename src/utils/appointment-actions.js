import {
  appointmentStatuses,
  appointmentTerminalStatuses,
} from 'components/constants.js'

export function appointmentCanView() {
  return true
}

export function appointmentCanEdit(status) {
  return !appointmentTerminalStatuses.has(String(status ?? '').toUpperCase())
}

export function appointmentCanCancel(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.pending
    || s === appointmentStatuses.confirmed
    || s === appointmentStatuses.rescheduled
}

export function appointmentCanReschedule(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.pending
    || s === appointmentStatuses.confirmed
    || s === appointmentStatuses.rescheduled
}

export function appointmentCanCheckIn(status) {
  return String(status ?? '').toUpperCase() === appointmentStatuses.confirmed
}

export function appointmentCanComplete(status) {
  return String(status ?? '').toUpperCase() === appointmentStatuses.checkedIn
}

export function appointmentCanNoShow(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.confirmed
    || s === appointmentStatuses.checkedIn
}

/**
 * Soft UI gate matching backend delete rules:
 * not checked out, no clinical note, not billed.
 */
export function appointmentCanDelete(appointment) {
  const row = appointment ?? {}
  if (row.checkedOut || row.hasNote || row.billed) {
    return false
  }

  return true
}

export function appointmentStatusBadgeClass(status) {
  return `appointment-status-badge--${String(status ?? '')
    .toLowerCase()
    .replace(/_/g, '-')}`
}
