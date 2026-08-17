export const denialQueueTabs = {
  needsReview: 'NEEDS_REVIEW',
  inProgress: 'IN_PROGRESS',
  waiting: 'WAITING',
  readyForResubmission: 'READY_FOR_RESUBMISSION',
  appeal: 'APPEAL',
  resolved: 'RESOLVED',
  all: 'ALL',
}

export function denialQueueEmptyKey(tab) {
  if (tab === denialQueueTabs.needsReview) {
    return 'denialQueueEmptyNeedsReview'
  }
  if (tab === denialQueueTabs.inProgress) {
    return 'denialQueueEmptyInProgress'
  }
  if (tab === denialQueueTabs.waiting) {
    return 'denialQueueEmptyWaiting'
  }
  if (tab === denialQueueTabs.readyForResubmission) {
    return 'denialQueueEmptyReady'
  }
  if (tab === denialQueueTabs.appeal) {
    return 'denialQueueEmptyAppeal'
  }
  if (tab === denialQueueTabs.resolved) {
    return 'denialQueueEmptyResolved'
  }

  return 'denialQueueEmptyAll'
}

export function denialStatusVariant(status) {
  if (status === 'RESOLVED' || status === 'CLOSED_NO_ACTION') {
    return 'completed'
  }
  if (status === 'IN_PROGRESS'
    || status === 'READY_FOR_RESUBMISSION'
    || status === 'APPEAL_REQUIRED') {
    return 'in-progress'
  }
  if (status === 'WAITING') {
    return 'pending'
  }

  return 'cancelled'
}

export function denialRowClass(row) {
  if (row?.priority === 'URGENT' || row?.priority === 'HIGH') {
    return 'billing-queue-row billing-queue-row--attention'
  }

  return 'billing-queue-row'
}
