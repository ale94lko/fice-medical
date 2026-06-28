import { adminTableStatusVariants } from 'src/constants/admin-table.js'
import { staffStatuses } from 'components/constants.js'

export function normalizeStaffStatusToken(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export function staffStatusLabel(status, t) {
  const token = normalizeStaffStatusToken(status)
  const map = {
    [staffStatuses.active]: t('staffStatusActive'),
    [staffStatuses.inactive]: t('staffStatusInactive'),
    [staffStatuses.onLeave]: t('staffStatusOnLeave'),
    [staffStatuses.terminated]: t('staffStatusTerminated'),
  }

  return map[token] ?? (String(status ?? '').trim() || '—')
}

export function staffStatusVariant(status) {
  const token = normalizeStaffStatusToken(status)
  if (token === staffStatuses.active) {
    return adminTableStatusVariants.active
  }
  if (token === staffStatuses.onLeave) {
    return adminTableStatusVariants.pending
  }
  if (token === staffStatuses.terminated) {
    return adminTableStatusVariants.discharged
  }
  if (token === staffStatuses.inactive) {
    return adminTableStatusVariants.inactive
  }

  return adminTableStatusVariants.other
}

export function staffStatusOptions(t) {
  return [
    {
      value: staffStatuses.active,
      label: t('staffStatusActive'),
    },
    {
      value: staffStatuses.inactive,
      label: t('staffStatusInactive'),
    },
    {
      value: staffStatuses.onLeave,
      label: t('staffStatusOnLeave'),
    },
    {
      value: staffStatuses.terminated,
      label: t('staffStatusTerminated'),
    },
  ]
}
