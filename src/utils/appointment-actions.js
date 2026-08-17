import {
  appointmentStatuses,
  appointmentTerminalStatuses,
} from 'components/constants.js'

function statusToken(status) {
  return String(status ?? '').toUpperCase()
}

function isScheduledOrConfirmed(status) {
  const s = statusToken(status)

  return s === appointmentStatuses.scheduled
    || s === appointmentStatuses.confirmed
    || s === appointmentStatuses.pending
    || s === appointmentStatuses.rescheduled
}

export function appointmentCanView() {
  return true
}

export function appointmentCanEdit(status) {
  return !appointmentTerminalStatuses.has(statusToken(status))
}

export function appointmentCanCancel(status) {
  return isScheduledOrConfirmed(status)
}

export function appointmentCanReschedule(status) {
  return isScheduledOrConfirmed(status)
}

export function appointmentCanCheckIn(status) {
  const s = statusToken(status)

  return s === appointmentStatuses.scheduled
    || s === appointmentStatuses.pending
}

export function appointmentCanStartEncounter(status) {
  const s = statusToken(status)

  return s === appointmentStatuses.scheduled
    || s === appointmentStatuses.confirmed
    || s === appointmentStatuses.checkedIn
}

export function appointmentCanOpenWorkspace(status) {
  return statusToken(status) === appointmentStatuses.inProgress
}

export function appointmentCanComplete(status) {
  return statusToken(status) === appointmentStatuses.inProgress
}

export function appointmentCanNoShow(status) {
  const s = statusToken(status)

  return s === appointmentStatuses.scheduled
    || s === appointmentStatuses.confirmed
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
  [appointmentStatuses.confirmed]: 'checked-in',
  [appointmentStatuses.checkedIn]: 'checked-in',
  [appointmentStatuses.inProgress]: 'in-progress',
  [appointmentStatuses.completed]: 'complete',
  [appointmentStatuses.cancelled]: 'cancel',
  [appointmentStatuses.noShow]: 'no-show',
  [appointmentStatuses.rescheduled]: 'rescheduled',
}

export function appointmentStatusVariant(status) {
  const token = statusToken(status)

  return appointmentStatusVariants[token] ?? 'other'
}

export function appointmentStatusBadgeClass(status) {
  return `admin-table-status-badge--${appointmentStatusVariant(status)}`
}
