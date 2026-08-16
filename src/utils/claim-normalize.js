import {
  claimRequirementActions,
  claimStatuses,
} from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import {
  formatSuperbillMoney,
  maskMemberId,
} from 'src/utils/superbill-normalize.js'

function trim(value) {
  return String(value ?? '').trim()
}

function asObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function parseOptionalBool(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function claimStatusVariant(status) {
  if (status === claimStatuses.ready) {
    return 'completed'
  }
  if (status === claimStatuses.voided) {
    return 'cancelled'
  }

  return 'pending'
}

function joinName(first, middle, last, fallback = '') {
  const full = [first, middle, last].filter(Boolean).join(' ')

  return full || fallback
}

function normalizePerson(raw = {}) {
  const row = asObject(raw)
  const first = trim(row.first_name ?? row.firstName)
  const middle = trim(row.middle_name ?? row.middleName)
  const last = trim(row.last_name ?? row.lastName)
  const fullName = trim(row.full_name ?? row.fullName)
    || joinName(first, middle, last)

  return {
    id: parseOptionalNumber(row.id),
    clientNumber: trim(row.client_number ?? row.clientNumber),
    firstName: first,
    middleName: middle,
    lastName: last,
    fullName,
    dob: trim(row.dob),
    dobDisplay: apiDateToDisplay(row.dob),
    sex: trim(row.sex),
    addressLine1: trim(row.address_line_1 ?? row.addressLine1),
    addressLine2: trim(row.address_line_2 ?? row.addressLine2),
    city: trim(row.city),
    state: trim(row.state),
    postalCode: trim(row.postal_code ?? row.postalCode),
    relationship: trim(row.relationship),
    memberId: trim(row.member_id ?? row.memberId),
    memberIdMasked: maskMemberId(row.member_id ?? row.memberId),
    groupNumber: trim(row.group_number ?? row.groupNumber),
    self: parseOptionalBool(row.self),
  }
}

function normalizeProvider(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    name: trim(row.name),
    npi: trim(row.npi),
    taxonomy: trim(row.taxonomy),
    taxId: trim(row.tax_id ?? row.taxId),
    address: trim(row.address),
  }
}

function normalizeLine(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    superbillLineId: parseOptionalNumber(
      row.superbill_line_id ?? row.superbillLineId,
    ),
    sequence: parseOptionalNumber(row.sequence) ?? 0,
    serviceName: trim(row.service_name ?? row.serviceName),
    procedureCodeSystem: trim(
      row.procedure_code_system ?? row.procedureCodeSystem,
    ),
    procedureCode: trim(row.procedure_code ?? row.procedureCode),
    dateOfServiceFrom: trim(
      row.date_of_service_from ?? row.dateOfServiceFrom,
    ),
    dateOfServiceTo: trim(
      row.date_of_service_to ?? row.dateOfServiceTo,
    ),
    placeOfServiceCode: trim(
      row.place_of_service_code ?? row.placeOfServiceCode,
    ),
    units: parseOptionalNumber(row.units),
    durationMinutes: parseOptionalNumber(
      row.duration_minutes ?? row.durationMinutes,
    ),
    chargeAmount: parseOptionalNumber(
      row.charge_amount ?? row.chargeAmount,
    ),
    chargeAmountLabel: formatSuperbillMoney(
      row.charge_amount ?? row.chargeAmount,
    ),
    renderingProviderId: parseOptionalNumber(
      row.rendering_provider_id ?? row.renderingProviderId,
    ),
    renderingProviderName: trim(
      row.rendering_provider_name ?? row.renderingProviderName,
    ),
    renderingProviderNpi: trim(
      row.rendering_provider_npi ?? row.renderingProviderNpi,
    ),
    authorizationId: parseOptionalNumber(
      row.authorization_id ?? row.authorizationId,
    ),
    authorizationNumber: trim(
      row.authorization_number ?? row.authorizationNumber,
    ),
    modifiers: asArray(row.modifiers).map(item => trim(item))
      .filter(Boolean),
    diagnosisPointers: asArray(
      row.diagnosis_pointers ?? row.diagnosisPointers,
    ).map(item => Number(item)).filter(Number.isFinite),
    diagnosisCodes: asArray(
      row.diagnosis_codes ?? row.diagnosisCodes,
    ).map(item => trim(item)).filter(Boolean),
  }
}

function normalizeDiagnosis(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    diagnosisCode: trim(row.diagnosis_code ?? row.diagnosisCode),
    diagnosisDescription: trim(
      row.diagnosis_description ?? row.diagnosisDescription,
    ),
    sequence: parseOptionalNumber(row.sequence) ?? 0,
    primary: parseOptionalBool(row.primary),
  }
}

function normalizeCheck(raw = {}) {
  const row = asObject(raw)
  const met = parseOptionalBool(row.met)
  const evidence = asObject(row.evidence)

  return {
    code: trim(row.code ?? row.type).toUpperCase(),
    type: trim(row.type ?? row.code).toUpperCase(),
    status: trim(row.status).toUpperCase(),
    passed: met,
    severity: trim(row.severity).toUpperCase() || 'BLOCKING',
    category: trim(row.category).toUpperCase(),
    title: trim(row.title),
    message: trim(row.message ?? row.detail),
    summary: trim(row.summary),
    detail: trim(row.detail ?? row.message),
    claimLineId: parseOptionalNumber(
      row.claim_line_id ?? row.claimLineId,
    ),
    serviceName: trim(row.service_name ?? row.serviceName),
    procedureCode: trim(row.procedure_code ?? row.procedureCode),
    sourceType: trim(row.source_type ?? row.sourceType).toUpperCase(),
    sourceId: parseOptionalNumber(row.source_id ?? row.sourceId),
    action: trim(row.action).toUpperCase(),
    actionLabel: trim(row.action_label ?? row.actionLabel),
    evidence,
  }
}

function normalizeReadiness(raw = {}) {
  const row = asObject(raw)
  const checks = asArray(row.checks).map(normalizeCheck)

  return {
    purpose: trim(row.purpose).toUpperCase(),
    ready: parseOptionalBool(row.ready),
    blockingCount: parseOptionalNumber(
      row.blocking_count ?? row.blockingCount,
    ) ?? checks.filter(item => !item.passed
      && item.severity === 'BLOCKING').length,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? checks.filter(item => !item.passed
      && item.severity !== 'BLOCKING').length,
    checks,
  }
}

export function normalizeClaim(raw = {}) {
  const row = asObject(raw)
  const status = trim(row.status).toUpperCase() || claimStatuses.draft
  const patient = normalizePerson(row.patient)
  const subscriber = normalizePerson(row.subscriber)
  const insurance = asObject(row.insurance)
  const location = asObject(row.location)
  const readiness = normalizeReadiness(
    row.claim_readiness ?? row.claimReadiness ?? {},
  )
  const totalCharge = parseOptionalNumber(
    row.total_charge ?? row.totalCharge,
  )
  const lines = asArray(row.lines)
    .map(normalizeLine)
    .sort((a, b) => a.sequence - b.sequence)
  const diagnoses = asArray(row.diagnoses)
    .map(normalizeDiagnosis)
    .sort((a, b) => a.sequence - b.sequence)

  return {
    id: parseOptionalNumber(row.id),
    claimNumber: trim(row.claim_number ?? row.claimNumber),
    claimType: trim(row.claim_type ?? row.claimType).toUpperCase()
      || 'PROFESSIONAL',
    status,
    statusVariant: claimStatusVariant(status),
    billingResponsibility: trim(
      row.billing_responsibility ?? row.billingResponsibility,
    ).toUpperCase(),
    superbillId: parseOptionalNumber(
      row.superbill_id ?? row.superbillId,
    ),
    superbillNumber: trim(
      row.superbill_number ?? row.superbillNumber,
    ),
    sourceSuperbillVersion: parseOptionalNumber(
      row.source_superbill_version ?? row.sourceSuperbillVersion,
    ),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId)
      ?? patient.id,
    dateOfServiceFrom: trim(
      row.date_of_service_from ?? row.dateOfServiceFrom,
    ),
    dateOfServiceTo: trim(
      row.date_of_service_to ?? row.dateOfServiceTo,
    ),
    dateOfServiceDisplay: apiDateToDisplay(
      row.date_of_service_from ?? row.dateOfServiceFrom,
    ),
    totalCharge,
    totalChargeLabel: formatSuperbillMoney(totalCharge),
    blockingCount: parseOptionalNumber(
      row.blocking_count ?? row.blockingCount,
    ) ?? readiness.blockingCount ?? 0,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? readiness.warningCount ?? 0,
    version: parseOptionalNumber(row.version),
    createdAt: trim(row.created_at ?? row.createdAt),
    createdBy: parseOptionalNumber(row.created_by ?? row.createdBy),
    updatedAt: trim(row.updated_at ?? row.updatedAt),
    voidedAt: trim(row.voided_at ?? row.voidedAt),
    voidedBy: parseOptionalNumber(row.voided_by ?? row.voidedBy),
    voidReason: trim(row.void_reason ?? row.voidReason),
    voidNotes: trim(row.void_notes ?? row.voidNotes),
    patient,
    subscriber,
    insurance: {
      insuranceProfileId: parseOptionalNumber(
        insurance.insurance_profile_id
          ?? insurance.insuranceProfileId,
      ),
      payerName: trim(insurance.payer_name ?? insurance.payerName),
      planName: trim(insurance.plan_name ?? insurance.planName),
      insuranceType: trim(
        insurance.insurance_type ?? insurance.insuranceType,
      ),
    },
    billingProvider: normalizeProvider(
      row.billing_provider ?? row.billingProvider,
    ),
    renderingProvider: normalizeProvider(
      row.rendering_provider ?? row.renderingProvider,
    ),
    location: {
      locationId: parseOptionalNumber(
        location.location_id ?? location.locationId,
      ),
      name: trim(location.name),
      placeOfServiceCode: trim(
        location.place_of_service_code
          ?? location.placeOfServiceCode,
      ),
      placeOfServiceDescription: trim(
        location.place_of_service_description
          ?? location.placeOfServiceDescription,
      ),
    },
    lines,
    diagnoses,
    claimReadiness: readiness,
    isDraft: status === claimStatuses.draft,
    isReady: status === claimStatuses.ready,
    isVoided: status === claimStatuses.voided,
  }
}

export function normalizeClaimWorkQueueItem(raw = {}) {
  const row = asObject(raw)
  const status = trim(row.status).toUpperCase() || claimStatuses.draft
  const totalCharge = parseOptionalNumber(
    row.total_charge ?? row.totalCharge,
  )
  const clientName = trim(row.client_name ?? row.clientName)
  const services = asArray(row.services).map(item => {
    const service = asObject(item)

    return {
      code: trim(service.code),
      name: trim(service.name),
    }
  })

  return {
    id: parseOptionalNumber(row.id),
    claimNumber: trim(row.claim_number ?? row.claimNumber),
    superbillId: parseOptionalNumber(
      row.superbill_id ?? row.superbillId,
    ),
    superbillNumber: trim(
      row.superbill_number ?? row.superbillNumber,
    ),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    clientName,
    dateOfService: trim(row.date_of_service ?? row.dateOfService),
    dateOfServiceDisplay: apiDateToDisplay(
      row.date_of_service ?? row.dateOfService,
    ),
    payerName: trim(row.payer_name ?? row.payerName),
    renderingProviderName: trim(
      row.rendering_provider_name ?? row.renderingProviderName,
    ),
    totalCharge,
    totalChargeLabel: formatSuperbillMoney(totalCharge),
    status,
    statusVariant: claimStatusVariant(status),
    blockingCount: parseOptionalNumber(
      row.blocking_count ?? row.blockingCount,
    ) ?? 0,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? 0,
    version: parseOptionalNumber(row.version),
    services,
  }
}

export function normalizeClaimWorkQueueOption(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    name: trim(row.name),
  }
}

export function normalizeClaimHistoryItem(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    action: trim(row.action).toUpperCase(),
    previousValue: trim(
      row.previous_value ?? row.previousValue,
    ),
    newValue: trim(row.new_value ?? row.newValue),
    reason: trim(row.reason ?? row.details),
    createdAt: trim(row.created_at ?? row.createdAt),
    changedByName: trim(
      row.changed_by_name ?? row.changedByName,
    ),
  }
}

export function claimRequirementActionLabelKey(action) {
  if (action === claimRequirementActions.viewSuperbill) {
    return 'claimViewSuperbill'
  }
  if (action === claimRequirementActions.viewInsurance) {
    return 'claimViewInsurance'
  }
  if (action === claimRequirementActions.viewProvider) {
    return 'claimViewProvider'
  }
  if (action === claimRequirementActions.viewClient) {
    return 'claimViewClient'
  }

  return ''
}

export { formatSuperbillMoney, maskMemberId }
