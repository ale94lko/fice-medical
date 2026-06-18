import {
  referralPriorities,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'

export function createEmptyReferral(overrides = {}) {
  return {
    id: null,
    clientId: null,
    referralNumber: '',
    type: referralTypes.incoming,
    status: referralStatuses.pendingReview,
    priority: referralPriorities.routine,
    referralDate: todayDateUs(),
    sourceCategory: null,
    referringProvider: '',
    referringOrganization: '',
    referredToProvider: '',
    referredToOrganization: '',
    specialty: '',
    phone: '',
    email: '',
    reason: '',
    diagnosisProblem: '',
    assignedClinicianId: null,
    followUpRequired: false,
    appointmentId: null,
    schedulingLabel: null,
    notes: '',
    closedAt: null,
    closedBy: null,
    documents: [],
    createdAt: null,
    updatedAt: null,
    referredByLabel: '—',
    referredToLabel: '—',
    ...overrides,
  }
}

export function cloneReferral(referral) {
  if (!referral) {
    return createEmptyReferral()
  }

  return {
    ...createEmptyReferral(),
    ...referral,
    documents: (referral.documents ?? []).map(doc => ({ ...doc })),
  }
}

export function isReferralReadOnly(referral) {
  const status = String(referral?.status ?? '').toUpperCase()

  return status === referralStatuses.closed
    || status === referralStatuses.declined
}

export function isReferralEditable(referral) {
  return !isReferralReadOnly(referral)
}
