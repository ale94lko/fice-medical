import { billingResponsibilityValues, superbillStatuses }
  from 'components/constants.js'

export const billingQueueTabs = {
  needsAttention: 'needsAttention',
  readyForReview: 'readyForReview',
  onHold: 'onHold',
  reviewed: 'reviewed',
  all: 'all',
}

export const billingDosPresets = {
  all: 'all',
  today: 'today',
  last7: 'last7',
  last30: 'last30',
  custom: 'custom',
}

export const billingQueuePollMs = 30000

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-')
}

export function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)

  return next
}

export function dosRangeForPreset(preset, customFrom, customTo) {
  const today = new Date()
  const todayIso = toIsoDate(today)
  if (preset === billingDosPresets.all) {
    return { from: undefined, to: undefined }
  }
  if (preset === billingDosPresets.today) {
    return { from: todayIso, to: todayIso }
  }
  if (preset === billingDosPresets.last7) {
    return { from: toIsoDate(addDays(today, -6)), to: todayIso }
  }
  if (preset === billingDosPresets.last30) {
    return { from: toIsoDate(addDays(today, -29)), to: todayIso }
  }
  if (preset === billingDosPresets.custom) {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    }
  }

  return { from: undefined, to: undefined }
}

export function queueStatusParam(tab) {
  if (tab === billingQueueTabs.needsAttention) {
    return superbillStatuses.notReady
  }
  if (tab === billingQueueTabs.readyForReview) {
    return superbillStatuses.ready
  }
  if (tab === billingQueueTabs.onHold) {
    return 'ON_HOLD'
  }
  if (tab === billingQueueTabs.reviewed) {
    return superbillStatuses.reviewed
  }

  return undefined
}

export function queueEmptyKey(tab) {
  if (tab === billingQueueTabs.needsAttention) {
    return 'billingQueueEmptyNeedsAttention'
  }
  if (tab === billingQueueTabs.readyForReview) {
    return 'billingQueueEmptyReady'
  }
  if (tab === billingQueueTabs.onHold) {
    return 'billingQueueEmptyOnHold'
  }
  if (tab === billingQueueTabs.reviewed) {
    return 'billingQueueEmptyReviewed'
  }

  return 'billingQueueEmptyAll'
}

export function compactServices(services = []) {
  const list = Array.isArray(services) ? services : []
  const first = list[0] || {}
  const extraCount = Math.max(0, list.length - 1)
  const codes = list.map(item => item.code).filter(Boolean)

  return {
    code: first.code || '',
    name: first.name || '',
    extraCount,
    extraLabel: extraCount > 0 ? `+${extraCount}` : '',
    codesLabel: codes.join(' + '),
  }
}

export function payerFilterValue(row) {
  if (row?.billingResponsibility === billingResponsibilityValues.selfPay) {
    return billingResponsibilityValues.selfPay
  }

  return row?.payerName || ''
}

export function workQueueRowClass(row) {
  if (row?.onHold) {
    return 'billing-queue-row billing-queue-row--hold'
  }
  if (row?.status === superbillStatuses.notReady) {
    return 'billing-queue-row billing-queue-row--attention'
  }

  return 'billing-queue-row'
}
