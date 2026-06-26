/* eslint-disable camelcase -- API payloads use snake_case */
import {
  referralPriorities,
  referralStatuses,
  referralTypes,
} from 'components/constants.js'
import {
  isoDateToUsDateString,
  parseUsDateString,
  usDateToIso,
} from 'src/utils/client-form.js'
import {
  formatPhoneUs,
  normalizePhoneDigits,
} from 'src/utils/client-contact-form.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

function parseBool(value, fallback = false) {
  if (value == null || value === '') {
    return fallback
  }
  if (typeof value === 'boolean') {
    return value
  }

  return String(value).toLowerCase() === 'true'
}

import {
  mapStoredFilesList,
  normalizeStoredFile,
} from 'src/utils/stored-file-normalize.js'

export function normalizeReferralFile(raw) {
  return normalizeStoredFile(raw)
}

/** @deprecated use normalizeReferralFile */
export function normalizeReferralDocument(raw) {
  return normalizeReferralFile(raw)
}

export function normalizeReferralSummary(raw) {
  const row = raw ?? {}
  const type = trim(row.type).toUpperCase()
  const referredBy = trim(
    row.referring_provider ?? row.referringProvider,
  )
  const referredByOrg = trim(
    row.referring_organization ?? row.referringOrganization,
  )
  const referredTo = trim(
    row.referred_to_provider ?? row.referredToProvider,
  )
  const referredToOrg = trim(
    row.referred_to_organization ?? row.referredToOrganization,
  )

  return {
    id: parseOptionalNumber(row.id),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    referralNumber: trim(row.referral_number ?? row.referralNumber),
    type,
    status: trim(row.status).toUpperCase() || referralStatuses.received,
    priority: trim(row.priority).toUpperCase() || referralPriorities.routine,
    referralDate: isoDateToUsDateString(
      row.referral_date ?? row.referralDate,
    ),
    sourceCategory: trim(row.source_category ?? row.sourceCategory) || null,
    referringProvider: referredBy || null,
    referringOrganization: referredByOrg || null,
    referredToProvider: referredTo || null,
    referredToOrganization: referredToOrg || null,
    specialty: trim(row.specialty) || null,
    phone: formatPhoneUs(row.phone) || null,
    email: trim(row.email) || null,
    reason: trim(row.reason),
    diagnosisProblem: trim(
      row.diagnosis_problem ?? row.diagnosisProblem,
    ) || null,
    assignedClinicianId: parseOptionalNumber(
      row.assigned_clinician_id ?? row.assignedClinicianId,
    ),
    assignedClinician: row.assigned_clinician ?? row.assignedClinician ?? null,
    followUpRequired: parseBool(
      row.follow_up_required ?? row.followUpRequired,
      false,
    ),
    appointmentId: parseOptionalNumber(
      row.appointment_id ?? row.appointmentId,
    ),
    schedulingLabel: trim(
      row.scheduling_label ?? row.schedulingLabel,
    ).toUpperCase() || null,
    notes: trim(row.notes) || null,
    closedAt: trim(row.closed_at ?? row.closedAt) || null,
    closedBy: parseOptionalNumber(row.closed_by ?? row.closedBy),
    files: mapStoredFilesList(row.files ?? row.documents ?? []),
    documents: mapStoredFilesList(row.files ?? row.documents ?? []),
    createdAt: trim(row.created_at ?? row.createdAt) || null,
    updatedAt: trim(row.updated_at ?? row.updatedAt) || null,
    referredByLabel: buildReferredPartyLabel(type, referredBy, referredByOrg),
    referredToLabel: buildReferredPartyLabel(
      referralTypes.outgoing,
      referredTo,
      referredToOrg,
    ),
  }
}

export function normalizeReferralDetail(raw) {
  return normalizeReferralSummary(raw)
}

export function mapReferralsListFromApi(rows = []) {
  return (rows ?? []).map(normalizeReferralSummary)
}

function buildReferredPartyLabel(type, provider, organization) {
  const parts = [provider, organization].filter(Boolean)
  if (parts.length) {
    return parts.join(' / ')
  }

  return '—'
}

export function referralToApiPayload(referral) {
  const row = referral ?? {}
  const type = trim(row.type).toUpperCase()
  const payload = {
    type,
    referral_date: usDateToIso(row.referralDate) || row.referralDate,
    reason: trim(row.reason),
    priority: trim(row.priority).toUpperCase() || referralPriorities.routine,
    follow_up_required: Boolean(row.followUpRequired),
    notes: trim(row.notes) || null,
    diagnosis_problem: trim(row.diagnosisProblem) || null,
    assigned_clinician_id: row.assignedClinicianId ?? null,
    phone: normalizePhoneDigits(row.phone) || null,
    email: trim(row.email) || null,
  }
  if (row.status) {
    payload.status = trim(row.status).toUpperCase()
  }
  if (type === referralTypes.incoming) {
    payload.source_category = trim(row.sourceCategory) || 'PROVIDER_REFERRAL'
    payload.referring_provider = trim(row.referringProvider) || null
    payload.referring_organization = trim(row.referringOrganization) || null
    payload.specialty = trim(row.specialty) || null
  }
  if (type === referralTypes.outgoing) {
    payload.referred_to_provider = trim(row.referredToProvider) || null
    payload.referred_to_organization = trim(
      row.referredToOrganization,
    ) || null
    payload.specialty = trim(row.specialty) || null
  }

  return payload
}

export function formatReferralListDate(value) {
  const d = parseUsDateString(value)
  if (!d) {
    return String(value ?? '').trim() || '—'
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isReferralSchedulable(row) {
  const status = String(row?.status ?? '').toUpperCase()
  if (
    status === referralStatuses.closed
    || status === referralStatuses.declined
  ) {
    return false
  }
  if (!row?.followUpRequired) {
    return false
  }
  if (row?.appointmentId) {
    return false
  }

  return true
}

export function normalizeReferralOption(raw) {
  const row = normalizeReferralSummary(raw)
  const id = row.id
  if (id == null) {
    return { label: '', value: null }
  }
  const party = row.type === referralTypes.incoming
    ? row.referredByLabel
    : row.referredToLabel
  const label = [
    row.referralNumber || `#${id}`,
    party !== '—' ? party : null,
  ].filter(Boolean).join(' – ')

  return {
    label: label || String(id),
    value: id,
    schedulingLabel: row.schedulingLabel,
    followUpRequired: row.followUpRequired,
    appointmentId: row.appointmentId,
    status: row.status,
  }
}

export function referralNeedsAttention(row) {
  if (!row) {
    return false
  }
  const status = trim(row.status).toUpperCase()
  if (
    status === referralStatuses.closed
    || status === referralStatuses.declined
  ) {
    return false
  }
  const priority = trim(row.priority).toUpperCase()
  if (
    priority === referralPriorities.urgent
    || priority === referralPriorities.stat
  ) {
    return true
  }
  if (status === referralStatuses.pendingReview) {
    return true
  }
  const scheduling = trim(row.schedulingLabel).toUpperCase()

  return scheduling === 'NEEDS_SCHEDULING'
}
