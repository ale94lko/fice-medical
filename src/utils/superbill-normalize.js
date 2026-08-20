import {
  billingResponsibilityValues,
  superbillRequirementActions,
  superbillStatuses,
} from 'components/constants.js'
import { normalizeBillingReadinessSnapshot } from
  'src/utils/encounter-requirements-normalize.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'

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

export function formatSuperbillMoney(value) {
  if (value == null || value === '') {
    return ''
  }
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return String(value)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n)
}

export function maskMemberId(value) {
  const raw = trim(value)
  if (!raw) {
    return ''
  }

  return `••••${raw.slice(-4)}`
}

export function superbillStatusVariant(status) {
  if (status === superbillStatuses.ready) {
    return 'active'
  }
  if (status === superbillStatuses.reviewed) {
    return 'completed'
  }
  if (status === superbillStatuses.voided) {
    return 'cancelled'
  }

  return 'pending'
}

function normalizeClient(raw = {}) {
  const row = asObject(raw)
  const first = trim(row.first_name ?? row.firstName)
  const middle = trim(row.middle_name ?? row.middleName)
  const last = trim(row.last_name ?? row.lastName)
  const fullName = trim(row.full_name ?? row.fullName)
    || [first, middle, last].filter(Boolean).join(' ')

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
  }
}

function normalizeInsurance(raw = {}) {
  const row = asObject(raw)
  const memberId = trim(row.member_id ?? row.memberId)

  return {
    insuranceProfileId: parseOptionalNumber(
      row.insurance_profile_id ?? row.insuranceProfileId,
    ),
    payerName: trim(row.payer_name ?? row.payerName),
    planName: trim(row.plan_name ?? row.planName),
    insuranceType: trim(row.insurance_type ?? row.insuranceType),
    memberId,
    memberIdMasked: maskMemberId(memberId),
    groupNumber: trim(row.group_number ?? row.groupNumber),
    subscriberName: trim(row.subscriber_name ?? row.subscriberName),
    subscriberRelationship: trim(
      row.subscriber_relationship ?? row.subscriberRelationship,
    ),
    coverageStartDate: trim(
      row.coverage_start_date ?? row.coverageStartDate,
    ),
    coverageEndDate: trim(
      row.coverage_end_date ?? row.coverageEndDate,
    ),
    required: parseOptionalBool(row.required),
  }
}

function normalizeProvider(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    name: trim(row.name),
    npi: trim(row.npi),
    taxId: trim(row.tax_id ?? row.taxId),
  }
}

function normalizeLocation(raw = {}) {
  const row = asObject(raw)

  return {
    locationId: parseOptionalNumber(row.location_id ?? row.locationId),
    name: trim(row.name),
    address: trim(row.address),
    placeOfServiceCode: trim(
      row.place_of_service_code ?? row.placeOfServiceCode,
    ),
    placeOfServiceDescription: trim(
      row.place_of_service_description
      ?? row.placeOfServiceDescription,
    ),
  }
}

function normalizeDocumentation(raw = {}) {
  const row = asObject(raw)

  return {
    clinicalNoteId: parseOptionalNumber(
      row.clinical_note_id ?? row.clinicalNoteId,
    ),
    status: trim(row.status).toUpperCase(),
    signedBy: trim(row.signed_by ?? row.signedBy),
    signedAt: trim(row.signed_at ?? row.signedAt),
  }
}

function normalizeLine(raw = {}) {
  const row = asObject(raw)
  const charge = parseOptionalNumber(
    row.charge_amount ?? row.chargeAmount,
  )
  const units = parseOptionalNumber(row.units) ?? 0
  const modifiers = asArray(row.modifiers).map(item => trim(item))
    .filter(Boolean)
  const diagnosisCodes = asArray(
    row.diagnosis_codes ?? row.diagnosisCodes,
  ).map(item => trim(item)).filter(Boolean)

  return {
    id: parseOptionalNumber(row.id),
    encounterServiceProcedureId: parseOptionalNumber(
      row.encounter_service_procedure_id
      ?? row.encounterServiceProcedureId,
    ),
    displayOrder: parseOptionalNumber(
      row.display_order ?? row.displayOrder,
    ) ?? 0,
    serviceName: trim(row.service_name ?? row.serviceName),
    billingCodeSystem: trim(
      row.billing_code_system ?? row.billingCodeSystem,
    ),
    billingCode: trim(row.billing_code ?? row.billingCode),
    units,
    durationMinutes: parseOptionalNumber(
      row.duration_minutes ?? row.durationMinutes,
    ),
    placeOfServiceCode: trim(
      row.place_of_service_code ?? row.placeOfServiceCode,
    ),
    chargeAmount: charge,
    chargeLabel: formatSuperbillMoney(charge),
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
    modifiers,
    diagnosisCodes,
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

function normalizeNote(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    body: trim(row.body),
    createdBy: parseOptionalNumber(row.created_by ?? row.createdBy),
    createdAt: trim(row.created_at ?? row.createdAt),
  }
}

function normalizeHold(raw) {
  const row = asObject(raw)
  if (!row.reason && row.id == null) {
    return null
  }

  return {
    id: parseOptionalNumber(row.id),
    reason: trim(row.reason).toUpperCase(),
    notes: trim(row.notes),
    startedAt: trim(row.started_at ?? row.startedAt),
    startedBy: parseOptionalNumber(row.started_by ?? row.startedBy),
    releasedAt: trim(row.released_at ?? row.releasedAt),
    releasedBy: parseOptionalNumber(
      row.released_by ?? row.releasedBy,
    ),
  }
}

function normalizeActiveClaim(raw) {
  const row = asObject(raw)
  const id = parseOptionalNumber(row.id)
  if (id == null) {
    return null
  }

  return {
    id,
    claimNumber: trim(row.claim_number ?? row.claimNumber),
    status: trim(row.status).toUpperCase(),
  }
}

function withLineAuthorization(line, checks) {
  const authCheck = checks.find(item =>
    item.code === 'AUTHORIZATION'
    && item.serviceLineId === line.id)
  if (line.authorizationNumber) {
    return { ...line, authorizationLabel: line.authorizationNumber }
  }
  if (authCheck && !authCheck.passed && authCheck.severity === 'BLOCKING') {
    return { ...line, authorizationLabel: 'required-missing' }
  }
  if (authCheck && authCheck.severity === 'INFO' && authCheck.passed) {
    return { ...line, authorizationLabel: 'not-required' }
  }

  return { ...line, authorizationLabel: 'not-required' }
}

export function normalizeSuperbill(raw = {}) {
  const row = asObject(raw)
  const status = trim(row.status).toUpperCase()
    || superbillStatuses.notReady
  const client = normalizeClient(row.client)
  const insurance = normalizeInsurance(row.insurance)
  const billingRequirements = normalizeBillingReadinessSnapshot(
    row.billing_requirements ?? row.billingRequirements ?? {},
  )
  const lines = asArray(row.lines)
    .map(normalizeLine)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(line => withLineAuthorization(line, billingRequirements.checks))
  const diagnoses = asArray(row.diagnoses)
    .map(normalizeDiagnosis)
    .sort((a, b) => a.sequence - b.sequence)
  const totalCharge = parseOptionalNumber(
    row.total_charge ?? row.totalCharge,
  )
  const blockingCount = parseOptionalNumber(
    row.blocking_count ?? row.blockingCount,
  ) ?? billingRequirements.blockingCount ?? 0
  const onHold = Boolean(row.on_hold ?? row.onHold)
  const unitsTotal = lines.reduce((sum, line) => sum + (line.units || 0), 0)
  const responsibility = trim(
    row.billing_responsibility ?? row.billingResponsibility,
  ).toUpperCase()

  return {
    id: parseOptionalNumber(row.id),
    superbillNumber: trim(
      row.superbill_number ?? row.superbillNumber,
    ),
    encounterId: parseOptionalNumber(
      row.encounter_id ?? row.encounterId,
    ),
    encounterNumber: trim(
      row.encounter_number ?? row.encounterNumber,
    ),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId)
      ?? client.id,
    status,
    statusVariant: superbillStatusVariant(status),
    dateOfService: trim(row.date_of_service ?? row.dateOfService),
    dateOfServiceDisplay: apiDateToDisplay(
      row.date_of_service ?? row.dateOfService,
    ),
    billingResponsibility: responsibility
      || billingResponsibilityValues.selfPay,
    totalCharge,
    totalChargeLabel: formatSuperbillMoney(totalCharge),
    blockingCount,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? billingRequirements.warningCount ?? 0,
    version: parseOptionalNumber(row.version),
    generatedAt: trim(row.generated_at ?? row.generatedAt),
    generatedBy: parseOptionalNumber(
      row.generated_by ?? row.generatedBy,
    ),
    updatedAt: trim(row.updated_at ?? row.updatedAt),
    reviewedAt: trim(row.reviewed_at ?? row.reviewedAt),
    reviewedBy: parseOptionalNumber(
      row.reviewed_by ?? row.reviewedBy,
    ),
    voidedAt: trim(row.voided_at ?? row.voidedAt),
    voidReason: trim(row.void_reason ?? row.voidReason),
    reopenedAt: trim(row.reopened_at ?? row.reopenedAt),
    client,
    insurance,
    renderingProvider: normalizeProvider(
      row.rendering_provider ?? row.renderingProvider,
    ),
    billingProvider: normalizeProvider(
      row.billing_provider ?? row.billingProvider,
    ),
    location: normalizeLocation(row.location),
    documentation: normalizeDocumentation(row.documentation),
    lines,
    diagnoses,
    notes: asArray(row.notes).map(normalizeNote),
    billingRequirements,
    unitsTotal,
    onHold,
    hold: normalizeHold(row.hold),
    activeClaim: normalizeActiveClaim(
      row.active_claim ?? row.activeClaim,
    ),
    canMarkReviewed: status === superbillStatuses.ready && !onHold,
    isReviewed: status === superbillStatuses.reviewed,
    isVoided: status === superbillStatuses.voided,
    isOpen: status === superbillStatuses.notReady
      || status === superbillStatuses.ready,
  }
}

export function superbillRequirementLabelKey(code) {
  const map = {
    ENCOUNTER_COMPLETED: 'superbillReqEncounterCompleted',
    PLACE_OF_SERVICE: 'superbillReqPlaceOfService',
    RENDERING_CLINICIAN: 'superbillReqRenderingClinician',
    BILLABLE_SERVICE: 'superbillReqBillableService',
    BILLING_CODE: 'superbillReqBillingCode',
    CHARGE: 'superbillReqCharge',
    UNITS: 'superbillReqUnits',
    PRIMARY_DIAGNOSIS: 'superbillReqPrimaryDiagnosis',
    INSURANCE: 'superbillReqInsurance',
    ELIGIBILITY: 'superbillReqEligibility',
    AUTHORIZATION: 'superbillReqAuthorization',
    SERVICE_DIAGNOSIS: 'superbillReqServiceDiagnosis',
    CLINICAL_NOTE: 'superbillReqClinicalNote',
    BILLED: 'superbillReqBilled',
  }

  return map[code] || ''
}

export function superbillRequirementActionLabelKey(action) {
  if (action === superbillRequirementActions.viewNote) {
    return 'superbillViewNote'
  }
  if (action === superbillRequirementActions.reviewAuthorization) {
    return 'superbillReviewAuthorization'
  }
  if (action === superbillRequirementActions.reviewDiagnosis) {
    return 'superbillReviewDiagnosis'
  }
  if (action === superbillRequirementActions.viewInsurance) {
    return 'superbillViewInsurance'
  }
  if (action === superbillRequirementActions.viewEncounter) {
    return 'superbillViewEncounter'
  }

  return ''
}

export function superbillWorkspaceTabForAction(action) {
  if (action === superbillRequirementActions.viewNote) {
    return 'note'
  }
  if (action === superbillRequirementActions.reviewDiagnosis) {
    return 'visit'
  }
  if (action === superbillRequirementActions.reviewAuthorization) {
    return 'visit'
  }

  return 'overview'
}

export function normalizeWorkQueueItem(raw = {}) {
  const row = asObject(raw)
  const status = trim(row.status).toUpperCase()
    || superbillStatuses.notReady
  const totalCharge = parseOptionalNumber(
    row.total_charge ?? row.totalCharge,
  )
  const clientName = trim(row.client_name ?? row.clientName)
  const clientNumber = trim(row.client_number ?? row.clientNumber)
  const services = asArray(row.services).map(item => {
    const service = asObject(item)

    return {
      code: trim(service.code),
      name: trim(service.name),
    }
  })
  const responsibility = trim(
    row.billing_responsibility ?? row.billingResponsibility,
  ).toUpperCase()

  return {
    id: parseOptionalNumber(row.id),
    superbillNumber: trim(
      row.superbill_number ?? row.superbillNumber,
    ),
    encounterId: parseOptionalNumber(
      row.encounter_id ?? row.encounterId,
    ),
    encounterNumber: trim(
      row.encounter_number ?? row.encounterNumber,
    ),
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    clientName,
    clientNumber,
    clientDob: trim(row.client_dob ?? row.clientDob),
    clientDobDisplay: apiDateToDisplay(
      row.client_dob ?? row.clientDob,
    ),
    client: {
      clientNumber,
      fullName: clientName,
    },
    dateOfService: trim(row.date_of_service ?? row.dateOfService),
    dateOfServiceDisplay: apiDateToDisplay(
      row.date_of_service ?? row.dateOfService,
    ),
    renderingProviderName: trim(
      row.rendering_provider_name ?? row.renderingProviderName,
    ),
    renderingProviderNpi: trim(
      row.rendering_provider_npi ?? row.renderingProviderNpi,
    ),
    payerName: trim(row.payer_name ?? row.payerName),
    billingResponsibility: responsibility
      || billingResponsibilityValues.selfPay,
    totalCharge,
    totalChargeLabel: formatSuperbillMoney(totalCharge),
    status,
    statusVariant: superbillStatusVariant(status),
    blockingCount: parseOptionalNumber(
      row.blocking_count ?? row.blockingCount,
    ) ?? 0,
    warningCount: parseOptionalNumber(
      row.warning_count ?? row.warningCount,
    ) ?? 0,
    onHold: Boolean(row.on_hold ?? row.onHold),
    holdReason: trim(row.hold_reason ?? row.holdReason).toUpperCase(),
    unresolvedDays: parseOptionalNumber(
      row.unresolved_days ?? row.unresolvedDays,
    ),
    version: parseOptionalNumber(row.version),
    services,
  }
}

export function normalizeWorkQueueOption(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    name: trim(row.name),
  }
}

export function normalizeSuperbillHistoryItem(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    action: trim(row.action),
    reason: trim(row.reason),
    changedByName: trim(
      row.changed_by_name ?? row.changedByName,
    ),
    createdAt: trim(row.created_at ?? row.createdAt),
    beforeJson: trim(row.before_json ?? row.beforeJson),
    afterJson: trim(row.after_json ?? row.afterJson),
  }
}
