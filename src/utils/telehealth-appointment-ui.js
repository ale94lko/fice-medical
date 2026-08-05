import { copyToClipboard } from 'quasar'

/**
 * Primary appointment from book/reschedule response (single or series).
 */
export function pickBookedAppointment(result) {
  if (result?.appointment) {
    return result.appointment
  }
  const list = Array.isArray(result?.appointments)
    ? result.appointments
    : []

  return list[0] ?? null
}

export async function copyTelehealthInviteUrl(url, $q, t) {
  const value = String(url ?? '').trim()
  if (!value) {
    return false
  }
  try {
    await copyToClipboard(value)
    $q.notify({
      type: 'positive',
      message: t('telehealthInviteCopied'),
    })

    return true
  } catch {
    $q.notify({
      type: 'negative',
      message: t('telehealthInviteCopyFailed'),
    })

    return false
  }
}

export function openTelehealthInviteUrl(url) {
  const value = String(url ?? '').trim()
  if (!value || typeof window === 'undefined') {
    return
  }
  window.open(value, '_blank', 'noopener,noreferrer')
}

/**
 * Success notify after book; adds copy/open when invite is present.
 */
export function notifyBookedAppointment($q, t, result, baseMessage) {
  const appointment = pickBookedAppointment(result)
  if (!appointment?.telemedicine) {
    $q.notify({ type: 'positive', message: baseMessage })

    return
  }
  const inviteUrl = String(appointment.telehealthInviteUrl ?? '').trim()
  if (!inviteUrl) {
    $q.notify({
      type: 'warning',
      message: `${baseMessage} ${t('telehealthInvitePending')}`,
      timeout: 7000,
    })

    return
  }
  $q.notify({
    type: 'positive',
    message: baseMessage,
    timeout: 9000,
    actions: [
      {
        label: t('telehealthCopyInvite'),
        color: 'white',
        handler: () => {
          void copyTelehealthInviteUrl(inviteUrl, $q, t)
        },
      },
      {
        label: t('telehealthOpenMeet'),
        color: 'white',
        handler: () => openTelehealthInviteUrl(inviteUrl),
      },
    ],
  })
}
