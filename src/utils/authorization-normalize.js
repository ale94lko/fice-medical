import {
  authorizationEffectiveStatuses,
  authorizationNotesMaxLength,
  authorizationPriorities,
  authorizationQuantityTypes,
  authorizationStatuses,
  authorizationVerificationSources,
} from 'components/constants.js'
import {
  isoDateToUsDateString,
  usDateToIso,
} from 'src/utils/client-form.js'

function trim(value) {
  return String(value ?? '').trim()
}

function toInt(value) {
  if (value == null || value === '') {
    return null
  }
  const parsed = Number.parseInt(String(value), 10)

  return Number.isFinite(parsed) ? parsed : null
}

export function createEmptyAuthorization() {
  return {
    id: null,
    insuranceProfileId: null,
    serviceId: null,
    status: authorizationStatuses.pending,
    effectiveStatus: authorizationStatuses.pending,
    quantityType: authorizationQuantityTypes.visits,
    authorizationNumber: '',
    requestedDate: '',
    requestedQuantity: null,
    approvedQuantity: null,
    usedQuantity: 0,
    remainingQuantity: null,
    startDate: '',
    endDate: '',
    priority: authorizationPriorities.routine,
    notes: '',
    requestingProviderId: null,
    verificationSource: null,
    referenceTrackingNumber: '',
    denialReason: '',
    cancellationReason: '',
    cancelledAt: null,
    overlapWarning: false,
    overlappingAuthorizationIds: [],
    coverageWarning: false,
    files: [],
    insurance: null,
    service: null,
  }
}

export function cloneAuthorization(row) {
  return {
    ...createEmptyAuthorization(),
    ...(row ?? {}),
    files: Array.isArray(row?.files) ? [...row.files] : [],
  }
}

export function isAuthorizationCancelled(status) {
  return String(status ?? '').toUpperCase()
    === authorizationStatuses.cancelled
}

export function isAuthorizationDenied(status) {
  return String(status ?? '').toUpperCase()
    === authorizationStatuses.denied
}

export function isAuthorizationApproved(status) {
  return String(status ?? '').toUpperCase()
    === authorizationStatuses.approved
}

export function isAuthorizationPending(status) {
  return String(status ?? '').toUpperCase()
    === authorizationStatuses.pending
}

export function isAuthorizationEditable(row) {
  const status = String(row?.status ?? '').toUpperCase()

  return status === authorizationStatuses.pending
    || status === authorizationStatuses.approved
}

export function isAuthorizationCancellable(row) {
  const status = String(row?.status ?? '').toUpperCase()

  return status === authorizationStatuses.pending
    || status === authorizationStatuses.approved
}

export function quantityUnitLabel(quantityType, t) {
  const token = String(quantityType ?? '').toUpperCase()
  if (token === authorizationQuantityTypes.units) {
    return t('authorizationQtyUnits')
  }

  return t('authorizationQtyVisits')
}

export function formatQuantityAmount(amount, quantityType, t) {
  if (amount == null || amount === '') {
    return '—'
  }

  return `${amount} ${quantityUnitLabel(quantityType, t)}`
}

export function formatUsedRemaining(row, t) {
  if (row?.approvedQuantity == null) {
    return '—'
  }
  const used = row.usedQuantity ?? 0
  const remaining = row.remainingQuantity
  if (remaining == null) {
    return `${used}`
  }

  return `${used} / ${remaining} ${quantityUnitLabel(row.quantityType, t)}`
}

export function authorizationStatusI18nKey(status) {
  const token = String(status ?? '').toUpperCase()
  const map = {
    [authorizationEffectiveStatuses.pending]:
      'authorizationStatusPending',
    [authorizationEffectiveStatuses.approved]:
      'authorizationStatusApproved',
    [authorizationEffectiveStatuses.denied]:
      'authorizationStatusDenied',
    [authorizationEffectiveStatuses.cancelled]:
      'authorizationStatusCancelled',
    [authorizationEffectiveStatuses.expired]:
      'authorizationStatusExpired',
    [authorizationEffectiveStatuses.exhausted]:
      'authorizationStatusExhausted',
  }

  return map[token] ?? 'authorizationStatusPending'
}

export function authorizationStatusVariant(status) {
  const token = String(status ?? '').toUpperCase()
  if (token === authorizationEffectiveStatuses.approved) {
    return 'active'
  }
  if (token === authorizationEffectiveStatuses.pending) {
    return 'pending'
  }
  if (token === authorizationEffectiveStatuses.denied) {
    return 'archived'
  }
  if (token === authorizationEffectiveStatuses.expired
    || token === authorizationEffectiveStatuses.exhausted
    || token === authorizationEffectiveStatuses.cancelled) {
    return 'cancelled'
  }

  return 'other'
}

function normalizeFile(file) {
  if (!file || file.id == null) {
    return null
  }

  return {
    id: file.id,
    name: file.original_filename
      ?? file.originalFilename
      ?? file.file_name
      ?? file.fileName
      ?? file.name
      ?? '',
  }
}

export function normalizeAuthorizationDetail(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyAuthorization()
  }
  const insurance = raw.insurance ?? null
  const service = raw.service ?? null
  const files = Array.isArray(raw.files)
    ? raw.files.map(normalizeFile).filter(Boolean)
    : []

  return {
    ...createEmptyAuthorization(),
    id: raw.id ?? null,
    insuranceProfileId: raw.insurance_profile_id
      ?? raw.insuranceProfileId
      ?? insurance?.id
      ?? null,
    serviceId: raw.service_id ?? raw.serviceId ?? service?.id ?? null,
    status: String(raw.status ?? authorizationStatuses.pending)
      .toUpperCase(),
    effectiveStatus: String(
      raw.effective_status
        ?? raw.effectiveStatus
        ?? raw.status
        ?? authorizationStatuses.pending,
    ).toUpperCase(),
    quantityType: String(
      raw.quantity_type
        ?? raw.quantityType
        ?? authorizationQuantityTypes.visits,
    ).toUpperCase(),
    authorizationNumber: trim(
      raw.authorization_number ?? raw.authorizationNumber,
    ),
    requestedDate: isoDateToUsDateString(
      raw.requested_date ?? raw.requestedDate,
    ),
    requestedQuantity: toInt(
      raw.requested_quantity ?? raw.requestedQuantity,
    ),
    approvedQuantity: toInt(
      raw.approved_quantity ?? raw.approvedQuantity,
    ),
    usedQuantity: toInt(raw.used_quantity ?? raw.usedQuantity) ?? 0,
    remainingQuantity: toInt(
      raw.remaining_quantity ?? raw.remainingQuantity,
    ),
    startDate: isoDateToUsDateString(raw.start_date ?? raw.startDate),
    endDate: isoDateToUsDateString(raw.end_date ?? raw.endDate),
    priority: String(
      raw.priority ?? authorizationPriorities.routine,
    ).toUpperCase() || authorizationPriorities.routine,
    notes: trim(raw.notes).slice(0, authorizationNotesMaxLength),
    requestingProviderId: raw.requesting_provider_id
      ?? raw.requestingProviderId
      ?? raw.requesting_provider?.id
      ?? raw.requestingProvider?.id
      ?? null,
    verificationSource: raw.verification_source
      ?? raw.verificationSource
      ?? null,
    referenceTrackingNumber: trim(
      raw.reference_tracking_number ?? raw.referenceTrackingNumber,
    ),
    denialReason: trim(raw.denial_reason ?? raw.denialReason),
    cancellationReason: trim(
      raw.cancellation_reason ?? raw.cancellationReason,
    ),
    cancelledAt: raw.cancelled_at ?? raw.cancelledAt ?? null,
    overlapWarning: Boolean(
      raw.overlap_warning ?? raw.overlapWarning,
    ),
    overlappingAuthorizationIds:
      raw.overlapping_authorization_ids
        ?? raw.overlappingAuthorizationIds
        ?? [],
    coverageWarning: Boolean(
      raw.coverage_warning ?? raw.coverageWarning,
    ),
    files,
    insurance,
    service,
  }
}

export function mapAuthorizationsListFromApi(rows) {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows.map(normalizeAuthorizationDetail).filter(row => row.id != null)
}

export function authorizationToApiPayload(form) {
  /* eslint-disable camelcase -- API payloads use snake_case */
  const row = form ?? {}
  const status = trim(row.status).toUpperCase()
    || authorizationStatuses.pending
  const payload = {
    insurance_profile_id: row.insuranceProfileId,
    service_id: row.serviceId,
    status,
    quantity_type: trim(row.quantityType).toUpperCase()
      || authorizationQuantityTypes.visits,
    authorization_number: trim(row.authorizationNumber) || null,
    requested_date: usDateToIso(row.requestedDate) || null,
    requested_quantity: toInt(row.requestedQuantity),
    approved_quantity: toInt(row.approvedQuantity),
    start_date: usDateToIso(row.startDate) || null,
    end_date: usDateToIso(row.endDate) || null,
    priority: trim(row.priority).toUpperCase()
      || authorizationPriorities.routine,
    notes: trim(row.notes) || null,
    requesting_provider_id: row.requestingProviderId ?? null,
    verification_source: trim(row.verificationSource).toUpperCase()
      || null,
    reference_tracking_number: trim(row.referenceTrackingNumber)
      || null,
  }
  if (status === authorizationStatuses.denied) {
    payload.denial_reason = trim(row.denialReason) || null
  }

  return payload
}

export function insuranceOptionLabel(profile) {
  const payer = trim(
    profile?.payer_plan_name
      ?? profile?.payerPlanName
      ?? profile?.payerName
      ?? '',
  )
  const memberId = trim(profile?.member_id ?? profile?.memberId)
  const priority = trim(
    profile?.insurance_priority ?? profile?.insurancePriority,
  )
  const parts = [payer || '—']
  if (priority) {
    parts.push(priority)
  }
  let label = parts.join(' — ')
  if (memberId) {
    label += ` · ID: ${memberId}`
  }

  return label
}

export const authorizationVerificationOptions = [
  authorizationVerificationSources.payerPortal,
  authorizationVerificationSources.phone,
  authorizationVerificationSources.fax,
  authorizationVerificationSources.email,
  authorizationVerificationSources.other,
]

export function validateAuthorizationForm(form, t) {
  const errors = {}
  const row = form ?? {}
  const status = String(row.status ?? '').toUpperCase()
  if (!row.insuranceProfileId) {
    errors.insuranceProfileId = t('authorizationInsuranceRequired')
  }
  if (!row.serviceId) {
    errors.serviceId = t('authorizationServiceRequired')
  }
  if (!status) {
    errors.status = t('authorizationStatusRequired')
  }
  if (!row.quantityType) {
    errors.quantityType = t('authorizationQuantityTypeRequired')
  }
  if (!row.requestingProviderId) {
    errors.requestingProviderId = t('authorizationProviderRequired')
  }
  if (status !== authorizationStatuses.denied) {
    if (!trim(row.requestedDate)) {
      errors.requestedDate = t('authorizationRequestedDateRequired')
    }
    if (toInt(row.requestedQuantity) == null
      || toInt(row.requestedQuantity) < 0) {
      errors.requestedQuantity = t('authorizationRequestedQtyRequired')
    }
    if (!trim(row.startDate)) {
      errors.startDate = t('authorizationStartRequired')
    }
    if (!trim(row.endDate)) {
      errors.endDate = t('authorizationEndRequired')
    }
    const startIso = usDateToIso(row.startDate)
    const endIso = usDateToIso(row.endDate)
    if (startIso && endIso && endIso < startIso) {
      errors.endDate = t('authorizationEndBeforeStart')
    }
  }
  if (status === authorizationStatuses.approved) {
    const approved = toInt(row.approvedQuantity)
    if (approved == null || approved <= 0) {
      errors.approvedQuantity = t('authorizationApprovedQtyRequired')
    }
  }
  if (status === authorizationStatuses.denied && !trim(row.denialReason)) {
    errors.denialReason = t('authorizationDenialRequired')
  }

  return errors
}
