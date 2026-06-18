/* eslint-disable camelcase -- mock API rows use snake_case */
import {
  referralPriorities,
  referralSchedulingLabels,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'

let nextReferralId = 200
let nextDocumentId = 50

const SEED_REFERRALS = [
  {
    id: 12,
    referral_number: 'REF-000123',
    type: referralTypes.incoming,
    status: referralStatuses.scheduled,
    priority: referralPriorities.urgent,
    referral_date: '2026-06-15',
    source_category: 'PROVIDER_REFERRAL',
    referring_provider: 'Dr. James Wilson',
    referring_organization: 'Downtown Medical Center',
    reason: 'Anxiety Symptoms',
    diagnosis_problem: 'Generalized Anxiety Disorder',
    assigned_clinician_id: 5,
    follow_up_required: true,
    appointment_id: 99,
    scheduling_label: referralSchedulingLabels.appointmentScheduled,
    specialty: 'Primary Care',
    documents: [],
  },
  {
    id: 13,
    referral_number: 'REF-000124',
    type: referralTypes.incoming,
    status: referralStatuses.pendingReview,
    priority: referralPriorities.routine,
    referral_date: '2026-06-10',
    referring_provider: 'Dr. Sarah Chen',
    referring_organization: 'Valley Health Clinic',
    reason: 'PTSD Evaluation',
    follow_up_required: true,
    scheduling_label: referralSchedulingLabels.needsScheduling,
    documents: [],
  },
  {
    id: 14,
    referral_number: 'REF-000125',
    type: referralTypes.outgoing,
    status: referralStatuses.accepted,
    priority: referralPriorities.urgent,
    referral_date: '2026-05-28',
    referred_to_provider: 'Dr. Smith',
    referred_to_organization: 'Heart Center',
    specialty: 'Cardiology',
    reason: 'Specialist cardiology consult',
    follow_up_required: false,
    scheduling_label: referralSchedulingLabels.noAppointmentRequired,
    documents: [],
  },
  {
    id: 15,
    referral_number: 'REF-000126',
    type: referralTypes.incoming,
    status: referralStatuses.completed,
    priority: referralPriorities.routine,
    referral_date: '2026-05-15',
    referring_provider: 'Dr. Alan Grant',
    referring_organization: 'City Hospital',
    reason: 'Depression screening',
    follow_up_required: false,
    scheduling_label: referralSchedulingLabels.noAppointmentRequired,
    documents: [],
  },
  {
    id: 16,
    referral_number: 'REF-000127',
    type: referralTypes.outgoing,
    status: referralStatuses.closed,
    priority: referralPriorities.routine,
    referral_date: '2026-04-20',
    referred_to_provider: 'Dr. Lee',
    referred_to_organization: 'Neurology Center',
    reason: 'Neurology consult',
    follow_up_required: false,
    scheduling_label: referralSchedulingLabels.noAppointmentRequired,
    documents: [],
  },
  {
    id: 17,
    referral_number: 'REF-000128',
    type: referralTypes.incoming,
    status: referralStatuses.declined,
    priority: referralPriorities.stat,
    referral_date: '2026-04-01',
    referring_provider: 'Dr. Brown',
    referring_organization: 'Regional Medical',
    reason: 'Crisis intervention',
    follow_up_required: true,
    scheduling_label: referralSchedulingLabels.needsScheduling,
    documents: [],
  },
  {
    id: 18,
    referral_number: 'REF-000129',
    type: referralTypes.incoming,
    status: referralStatuses.received,
    priority: referralPriorities.urgent,
    referral_date: '2026-03-18',
    referring_provider: 'Dr. Patel',
    referring_organization: 'Community Health',
    reason: 'Medication management',
    follow_up_required: true,
    scheduling_label: referralSchedulingLabels.needsScheduling,
    documents: [],
  },
]

const mockReferralsByClient = {}

function clientKey(clientId) {
  return String(clientId ?? '').trim()
}

function ensureClientBucket(clientId) {
  const key = clientKey(clientId)
  if (!mockReferralsByClient[key]?.length) {
    mockReferralsByClient[key] = SEED_REFERRALS.map(row => ({
      ...row,
      client_id: Number(clientId) || clientId,
      documents: [...(row.documents ?? [])],
      created_at: '2026-06-15T09:00:00',
      updated_at: '2026-06-15T09:00:00',
    }))
  }

  return mockReferralsByClient[key]
}

function matchesFilters(row, params = {}) {
  const type = String(params.type ?? '').trim().toUpperCase()
  if (type && row.type !== type) {
    return false
  }
  const status = String(params.status ?? '').trim().toUpperCase()
  if (status && row.status !== status) {
    return false
  }
  const referredBy = String(params.referred_by ?? '').trim().toLowerCase()
  if (referredBy) {
    const hay = [
      row.referring_provider,
      row.referring_organization,
    ].join(' ').toLowerCase()
    if (!hay.includes(referredBy)) {
      return false
    }
  }
  const referredTo = String(params.referred_to ?? '').trim().toLowerCase()
  if (referredTo) {
    const hay = [
      row.referred_to_provider,
      row.referred_to_organization,
    ].join(' ').toLowerCase()
    if (!hay.includes(referredTo)) {
      return false
    }
  }

  return true
}

export function mockListClientReferrals(clientId, params = {}) {
  const rows = ensureClientBucket(clientId)
    .filter(row => matchesFilters(row, params))
    .sort((a, b) => String(b.referral_date)
      .localeCompare(String(a.referral_date)))

  return rows.map(row => ({ ...row, documents: [...(row.documents ?? [])] }))
}

export function mockGetClientReferral(clientId, referralId) {
  const row = ensureClientBucket(clientId)
    .find(item => Number(item.id) === Number(referralId))
  if (!row) {
    return null
  }

  return { ...row, documents: [...(row.documents ?? [])] }
}

export function mockCreateClientReferral(clientId, body) {
  const id = nextReferralId
  nextReferralId += 1
  const row = {
    id,
    client_id: Number(clientId),
    referral_number: `REF-${Date.now()}${id}`,
    status: referralStatuses.received,
    scheduling_label: body.follow_up_required
      ? referralSchedulingLabels.needsScheduling
      : referralSchedulingLabels.noAppointmentRequired,
    documents: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...body,
  }
  ensureClientBucket(clientId).unshift(row)

  return { ...row, documents: [] }
}

export function mockUpdateClientReferral(clientId, referralId, body) {
  const bucket = ensureClientBucket(clientId)
  const index = bucket.findIndex(item => Number(item.id) === Number(referralId))
  if (index < 0) {
    throw new Error('Referral not found')
  }
  const current = bucket[index]
  if (current.status === referralStatuses.closed) {
    throw new Error('Closed referral must be reopened explicitly')
  }
  const next = {
    ...current,
    ...body,
    updated_at: new Date().toISOString(),
  }
  if (body.follow_up_required === false) {
    next.scheduling_label = referralSchedulingLabels.noAppointmentRequired
  } else if (!next.appointment_id) {
    next.scheduling_label = referralSchedulingLabels.needsScheduling
  }
  bucket[index] = next

  return { ...next, documents: [...(next.documents ?? [])] }
}

export function mockCloseClientReferral(clientId, referralId) {
  return mockUpdateClientReferral(clientId, referralId, {
    status: referralStatuses.closed,
    closed_at: new Date().toISOString(),
    closed_by: 1,
    scheduling_label: referralSchedulingLabels.noAppointmentRequired,
  })
}

export function mockDeleteClientReferral(clientId, referralId) {
  const bucket = ensureClientBucket(clientId)
  const index = bucket.findIndex(item => Number(item.id) === Number(referralId))
  if (index < 0) {
    throw new Error('Referral not found')
  }
  bucket.splice(index, 1)

  return true
}

export function mockUploadReferralDocument(clientId, referralId, file) {
  const row = mockGetClientReferral(clientId, referralId)
  if (!row) {
    throw new Error('Referral not found')
  }
  const doc = {
    id: nextDocumentId,
    referral_id: Number(referralId),
    file_name: file?.name || 'document.pdf',
    file_type: file?.type || 'application/pdf',
    file_size: file?.size ?? 0,
    uploaded_by: 1,
    uploaded_at: new Date().toISOString(),
  }
  nextDocumentId += 1
  row.documents.push(doc)

  return doc
}

export function mockDeleteReferralDocument(clientId, referralId, documentId) {
  const row = mockGetClientReferral(clientId, referralId)
  if (!row) {
    throw new Error('Referral not found')
  }
  const index = (row.documents ?? [])
    .findIndex(doc => Number(doc.id) === Number(documentId))
  if (index < 0) {
    throw new Error('Document not found')
  }
  row.documents.splice(index, 1)

  return true
}

export function mockListClientReferralOptions(clientId) {
  return mockListClientReferrals(clientId)
}
