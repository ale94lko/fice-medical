import {
  billingDosPresets,
  billingQueuePollMs,
  compactServices,
  dosRangeForPreset,
} from 'src/utils/billing-work-queue.js'
import { claimStatuses } from 'components/constants.js'

export const claimQueueTabs = {
  needsAttention: 'needsAttention',
  ready: 'ready',
  submitted: 'submitted',
  accepted: 'accepted',
  rejected: 'rejected',
  paid: 'paid',
  partiallyPaid: 'partiallyPaid',
  denied: 'denied',
  all: 'all',
}

export const claimDosPresets = billingDosPresets
export const claimQueuePollMs = billingQueuePollMs

export { compactServices, dosRangeForPreset }

export function claimQueueStatusParam(tab) {
  if (tab === claimQueueTabs.needsAttention) {
    return claimStatuses.draft
  }
  if (tab === claimQueueTabs.ready) {
    return claimStatuses.ready
  }
  if (tab === claimQueueTabs.submitted) {
    return claimStatuses.submitted
  }
  if (tab === claimQueueTabs.accepted) {
    return claimStatuses.accepted
  }
  if (tab === claimQueueTabs.rejected) {
    return claimStatuses.rejected
  }
  if (tab === claimQueueTabs.paid) {
    return claimStatuses.paid
  }
  if (tab === claimQueueTabs.partiallyPaid) {
    return claimStatuses.partiallyPaid
  }
  if (tab === claimQueueTabs.denied) {
    return claimStatuses.denied
  }

  return undefined
}

export function claimQueueEmptyKey(tab) {
  if (tab === claimQueueTabs.needsAttention) {
    return 'claimQueueEmptyNeedsAttention'
  }
  if (tab === claimQueueTabs.ready) {
    return 'claimQueueEmptyReady'
  }
  if (tab === claimQueueTabs.submitted) {
    return 'claimQueueEmptySubmitted'
  }
  if (tab === claimQueueTabs.accepted) {
    return 'claimQueueEmptyAccepted'
  }
  if (tab === claimQueueTabs.rejected) {
    return 'claimQueueEmptyRejected'
  }
  if (tab === claimQueueTabs.paid) {
    return 'claimQueueEmptyPaid'
  }
  if (tab === claimQueueTabs.partiallyPaid) {
    return 'claimQueueEmptyPartiallyPaid'
  }
  if (tab === claimQueueTabs.denied) {
    return 'claimQueueEmptyDenied'
  }

  return 'claimQueueEmptyAll'
}

export function claimWorkQueueRowClass(row) {
  if (row?.status === claimStatuses.draft
    || row?.status === claimStatuses.rejected
    || row?.status === claimStatuses.denied
    || row?.status === claimStatuses.partiallyPaid) {
    return 'billing-queue-row billing-queue-row--attention'
  }

  return 'billing-queue-row'
}

export function isTechnicalSubmissionFailure(status) {
  const value = String(status ?? '').toUpperCase()

  return value === 'FAILED'
    || value === 'FAILED_GENERATION'
    || value === 'FAILED_VALIDATION'
    || value === 'FAILED_TRANSPORT'
}
