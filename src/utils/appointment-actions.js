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
    || s === appointmentStatuses.scheduled
    || s === appointmentStatuses.rescheduled
}

export function appointmentCanReschedule(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.pending
    || s === appointmentStatuses.scheduled
    || s === appointmentStatuses.rescheduled
}

export function appointmentCanCheckIn(status) {
  return String(status ?? '').toUpperCase() === appointmentStatuses.scheduled
}

export function appointmentCanStartEncounter(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.scheduled
    || s === appointmentStatuses.checkedIn
}

export function appointmentCanOpenWorkspace(status) {
  return String(status ?? '').toUpperCase()
    === appointmentStatuses.inProgress
}

export function appointmentCanComplete(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.checkedIn
    || s === appointmentStatuses.inProgress
}

export function appointmentCanNoShow(status) {
  const s = String(status ?? '').toUpperCase()

  return s === appointmentStatuses.scheduled
    || s === appointmentStatuses.checkedIn
}

export function appointmentCanViewEncounter(appointment) {
  const row = appointment ?? {}
  const encounterId = row.encounterId
    ?? row.encounter_id
    ?? row.activeEncounterId

  return encounterId != null && String(encounterId).trim() !== ''
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

const appointmentStatusVariants = {
  [appointmentStatuses.pending]: 'pending',
  [appointmentStatuses.scheduled]: 'scheduled',
  [appointmentStatuses.checkedIn]: 'checked-in',
  [appointmentStatuses.inProgress]: 'in-progress',
  [appointmentStatuses.completed]: 'complete',
  [appointmentStatuses.cancelled]: 'cancel',
  [appointmentStatuses.noShow]: 'no-show',
  [appointmentStatuses.rescheduled]: 'rescheduled',
}

export function appointmentStatusVariant(status) {
  const token = String(status ?? '').toUpperCase()

  return appointmentStatusVariants[token] ?? 'other'
}

export function appointmentStatusBadgeClass(status) {
  return `admin-table-status-badge--${appointmentStatusVariant(status)}`
}
