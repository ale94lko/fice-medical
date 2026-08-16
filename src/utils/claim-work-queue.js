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

  return undefined
}

export function claimQueueEmptyKey(tab) {
  if (tab === claimQueueTabs.needsAttention) {
    return 'claimQueueEmptyNeedsAttention'
  }
  if (tab === claimQueueTabs.ready) {
    return 'claimQueueEmptyReady'
  }

  return 'claimQueueEmptyAll'
}

export function claimWorkQueueRowClass(row) {
  if (row?.status === claimStatuses.draft) {
    return 'billing-queue-row billing-queue-row--attention'
  }

  return 'billing-queue-row'
}
