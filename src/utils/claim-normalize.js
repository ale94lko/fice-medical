import {
  claimDisplayStatuses,
  claimRequirementActions,
  claimStatuses,
} from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import {
  formatSuperbillMoney,
  maskMemberId,
} from 'src/utils/superbill-normalize.js'
import {
  normalizeAdjudication,
  normalizeInsurancePayment,
} from 'src/utils/remittance-normalize.js'

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
  if (status === claimStatuses.ready
    || status === claimDisplayStatuses.paid
    || status === claimStatuses.accepted) {
    return 'completed'
  }
  if (status === claimStatuses.submitted
    || status === claimDisplayStatuses.partiallyPaid
    || status === claimDisplayStatuses.awaitingAdjudication) {
    return 'in-progress'
  }
  if (status === claimStatuses.rejected
    || status === claimDisplayStatuses.denied
    || status === claimStatuses.voided) {
    return 'cancelled'
  }

  return 'pending'
}

function resolveDisplayStatus(row, processingStatus) {
  return trim(row.display_status ?? row.displayStatus).toUpperCase()
    || processingStatus
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
    ) ?? 0,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? 0,
    checks,
  }
}

function normalizeAcknowledgment(raw = {}) {
  const row = asObject(raw)
  if (!Object.keys(row).length) {
    return null
  }

  return {
    id: parseOptionalNumber(row.id),
    responseType: trim(
      row.response_type ?? row.responseType,
    ).toUpperCase(),
    result: trim(row.result).toUpperCase(),
    receivedAt: trim(row.received_at ?? row.receivedAt),
    externalReference: trim(
      row.external_reference ?? row.externalReference,
    ),
    parsedCode: trim(row.parsed_code ?? row.parsedCode),
    parsedCategory: trim(
      row.parsed_category ?? row.parsedCategory,
    ),
    parsedMessage: trim(row.parsed_message ?? row.parsedMessage),
    parsedLineRef: trim(row.parsed_line_ref ?? row.parsedLineRef),
  }
}

function normalizeSubmission(raw = {}) {
  const row = asObject(raw)
  if (row.id == null && !trim(row.status)) {
    return null
  }

  return {
    id: parseOptionalNumber(row.id),
    attemptNumber: parseOptionalNumber(
      row.attempt_number ?? row.attemptNumber,
    ) ?? 0,
    status: trim(row.status).toUpperCase(),
    format: trim(row.format),
    implementationVersion: trim(
      row.implementation_version ?? row.implementationVersion,
    ),
    claimVersion: parseOptionalNumber(
      row.claim_version ?? row.claimVersion,
    ),
    routeName: trim(row.route_name ?? row.routeName),
    clearinghouseName: trim(
      row.clearinghouse_name ?? row.clearinghouseName,
    ),
    electronicPayerId: trim(
      row.electronic_payer_id ?? row.electronicPayerId,
    ),
    submitterName: trim(row.submitter_name ?? row.submitterName),
    receiverName: trim(row.receiver_name ?? row.receiverName),
    generatedAt: trim(row.generated_at ?? row.generatedAt),
    submittedAt: trim(row.submitted_at ?? row.submittedAt),
    externalTrackingId: trim(
      row.external_tracking_id ?? row.externalTrackingId,
    ),
    failureCode: trim(row.failure_code ?? row.failureCode),
    failureMessage: trim(row.failure_message ?? row.failureMessage),
    ack999: normalizeAcknowledgment(row.ack_999 ?? row.ack999),
    ack277ca: normalizeAcknowledgment(row.ack_277ca ?? row.ack277ca),
    acknowledgments: asArray(
      row.acknowledgments,
    ).map(normalizeAcknowledgment).filter(Boolean),
  }
}

export function normalizeClaim(raw = {}) {
  const row = asObject(raw)
  const status = trim(row.status).toUpperCase() || claimStatuses.draft
  const displayStatus = resolveDisplayStatus(row, status)
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
    displayStatus,
    adjudicationStatus: trim(
      row.adjudication_status ?? row.adjudicationStatus,
    ).toUpperCase(),
    denialStatus: trim(
      row.denial_status ?? row.denialStatus,
    ).toUpperCase(),
    payerPaymentStatus: trim(
      row.payer_payment_status ?? row.payerPaymentStatus,
    ).toUpperCase(),
    statusVariant: claimStatusVariant(displayStatus),
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
    submittedAt: trim(row.submitted_at ?? row.submittedAt),
    acceptedAt: trim(row.accepted_at ?? row.acceptedAt),
    rejectedAt: trim(row.rejected_at ?? row.rejectedAt),
    latestRejectionCode: trim(
      row.latest_rejection_code ?? row.latestRejectionCode,
    ),
    latestRejectionCategory: trim(
      row.latest_rejection_category ?? row.latestRejectionCategory,
    ),
    latestRejectionMessage: trim(
      row.latest_rejection_message ?? row.latestRejectionMessage,
    ),
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
    submissionReadiness: normalizeReadiness(
      row.submission_readiness ?? row.submissionReadiness,
    ),
    latestSubmission: normalizeSubmission(
      row.latest_submission ?? row.latestSubmission,
    ),
    latestAdjudication: normalizeAdjudication(
      row.latest_adjudication ?? row.latestAdjudication,
    ),
    adjudications: asArray(
      row.adjudications,
    ).map(normalizeAdjudication).filter(item => item.id != null),
    insurancePayments: asArray(
      row.insurance_payments ?? row.insurancePayments,
    ).map(normalizeInsurancePayment).filter(item => item.id != null),
    parentClaimId: parseOptionalNumber(
      row.parent_claim_id ?? row.parentClaimId,
    ),
    originalClaimId: parseOptionalNumber(
      row.original_claim_id ?? row.originalClaimId,
    ),
    claimRelationshipType: trim(
      row.claim_relationship_type ?? row.claimRelationshipType,
    ),
    claimFrequencyCode: trim(
      row.claim_frequency_code ?? row.claimFrequencyCode,
    ),
    payerClaimControlNumber: trim(
      row.payer_claim_control_number ?? row.payerClaimControlNumber,
    ),
    lineage: asArray(row.lineage).map(item => ({
      id: parseOptionalNumber(item.id),
      claimNumber: trim(item.claim_number ?? item.claimNumber),
      status: trim(item.status),
      claimRelationshipType: trim(
        item.claim_relationship_type ?? item.claimRelationshipType,
      ),
      parentClaimId: parseOptionalNumber(
        item.parent_claim_id ?? item.parentClaimId,
      ),
    })).filter(item => item.id != null),
    denialCases: asArray(row.denial_cases ?? row.denialCases)
      .map(item => ({
        id: parseOptionalNumber(item.id),
        denialNumber: trim(item.denial_number ?? item.denialNumber),
        sourceType: trim(item.source_type ?? item.sourceType),
        status: trim(item.status),
        category: trim(item.category),
      })).filter(item => item.id != null),
    isDraft: status === claimStatuses.draft,
    isReady: status === claimStatuses.ready,
    isSubmitted: status === claimStatuses.submitted,
    isAccepted: status === claimStatuses.accepted,
    isRejected: status === claimStatuses.rejected,
    isPaid: displayStatus === claimDisplayStatuses.paid,
    isPartiallyPaid:
      displayStatus === claimDisplayStatuses.partiallyPaid,
    isDenied: displayStatus === claimDisplayStatuses.denied,
    isVoided: status === claimStatuses.voided,
    isSubmittedLifecycle: status === claimStatuses.submitted
      || status === claimStatuses.accepted
      || status === claimStatuses.rejected,
  }
}

export function normalizeClaimWorkQueueItem(raw = {}) {
  const row = asObject(raw)
  const status = trim(row.status).toUpperCase() || claimStatuses.draft
  const displayStatus = resolveDisplayStatus(row, status)
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
    clientNumber: trim(row.client_number ?? row.clientNumber),
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
    displayStatus,
    adjudicationStatus: trim(
      row.adjudication_status ?? row.adjudicationStatus,
    ).toUpperCase(),
    denialStatus: trim(
      row.denial_status ?? row.denialStatus,
    ).toUpperCase(),
    payerPaymentStatus: trim(
      row.payer_payment_status ?? row.payerPaymentStatus,
    ).toUpperCase(),
    statusVariant: claimStatusVariant(displayStatus),
    blockingCount: parseOptionalNumber(
      row.blocking_count ?? row.blockingCount,
    ) ?? 0,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? 0,
    issueKind: trim(row.issue_kind ?? row.issueKind).toUpperCase(),
    issueSummary: trim(row.issue_summary ?? row.issueSummary),
    submissionReady: parseOptionalBool(
      row.submission_ready ?? row.submissionReady,
    ),
    lastActivityAt: trim(
      row.last_activity_at ?? row.lastActivityAt,
    ),
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
  if (action === claimRequirementActions.viewSubmissionRoute
    || action === claimRequirementActions.viewPayerConfiguration) {
    return 'claimViewSubmissionRoute'
  }

  return ''
}

export { formatSuperbillMoney, maskMemberId }
