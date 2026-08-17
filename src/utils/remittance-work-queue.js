export const remittanceQueueTabs = {
  needsReview: 'NEEDS_REVIEW',
  readyToPost: 'READY_TO_POST',
  posted: 'POSTED',
  all: 'ALL',
}

export function remittanceQueueEmptyKey(tab) {
  if (tab === remittanceQueueTabs.needsReview) {
    return 'remittanceQueueEmptyNeedsReview'
  }
  if (tab === remittanceQueueTabs.readyToPost) {
    return 'remittanceQueueEmptyReady'
  }
  if (tab === remittanceQueueTabs.posted) {
    return 'remittanceQueueEmptyPosted'
  }

  return 'remittanceQueueEmptyAll'
}

export function remittanceRowClass(row) {
  if ((row?.unmatchedClaimCount ?? 0) > 0
    || row?.processingStatus === 'PARTIALLY_MATCHED'
    || row?.processingStatus === 'FAILED') {
    return 'billing-queue-row billing-queue-row--attention'
  }

  return 'billing-queue-row'
}

export function paymentPostingVariant(status) {
  if (status === 'POSTED') {
    return 'completed'
  }
  if (status === 'PARTIALLY_POSTED') {
    return 'in-progress'
  }

  return 'pending'
}
