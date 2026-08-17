import { formatSuperbillMoney } from 'src/utils/superbill-normalize.js'

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

export function moneyLabel(value) {
  const n = parseOptionalNumber(value)
  if (n == null) {
    return '—'
  }

  return formatSuperbillMoney(n)
}

export function normalizeAdjustment(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    groupCode: trim(row.group_code ?? row.groupCode),
    reasonCode: trim(row.reason_code ?? row.reasonCode),
    remarkCode: trim(row.remark_code ?? row.remarkCode),
    amount: parseOptionalNumber(row.amount),
    amountLabel: moneyLabel(row.amount),
    description: trim(row.description),
    claimLineAdjudicationId: parseOptionalNumber(
      row.claim_line_adjudication_id ?? row.claimLineAdjudicationId,
    ),
  }
}

export function normalizeLineAdjudication(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    claimLineId: parseOptionalNumber(
      row.claim_line_id ?? row.claimLineId,
    ),
    procedureCode: trim(row.procedure_code ?? row.procedureCode),
    serviceName: trim(row.service_name ?? row.serviceName),
    billedAmount: parseOptionalNumber(
      row.billed_amount ?? row.billedAmount,
    ),
    billedAmountLabel: moneyLabel(row.billed_amount ?? row.billedAmount),
    allowedAmount: parseOptionalNumber(
      row.allowed_amount ?? row.allowedAmount,
    ),
    allowedAmountLabel: moneyLabel(
      row.allowed_amount ?? row.allowedAmount,
    ),
    payerPaidAmount: parseOptionalNumber(
      row.payer_paid_amount ?? row.payerPaidAmount,
    ),
    payerPaidAmountLabel: moneyLabel(
      row.payer_paid_amount ?? row.payerPaidAmount,
    ),
    clientResponsibilityAmount: parseOptionalNumber(
      row.client_responsibility_amount
        ?? row.patient_responsibility_amount
        ?? row.clientResponsibilityAmount
        ?? row.patientResponsibilityAmount,
    ),
    clientResponsibilityAmountLabel: moneyLabel(
      row.client_responsibility_amount
        ?? row.patient_responsibility_amount
        ?? row.clientResponsibilityAmount
        ?? row.patientResponsibilityAmount,
    ),
    adjustmentAmount: parseOptionalNumber(
      row.adjustment_amount ?? row.adjustmentAmount,
    ),
    adjustmentAmountLabel: moneyLabel(
      row.adjustment_amount ?? row.adjustmentAmount,
    ),
    status: trim(row.status).toUpperCase(),
    matchStatus: trim(row.match_status ?? row.matchStatus)
      .toUpperCase(),
    adjustments: asArray(row.adjustments).map(normalizeAdjustment),
  }
}

export function normalizeAdjudication(raw = {}) {
  const row = asObject(raw)
  if (row.id == null && !trim(row.adjudication_status
    ?? row.adjudicationStatus)) {
    return null
  }

  return {
    id: parseOptionalNumber(row.id),
    remittanceId: parseOptionalNumber(
      row.remittance_id ?? row.remittanceId,
    ),
    remittanceNumber: trim(
      row.remittance_number ?? row.remittanceNumber,
    ),
    claimId: parseOptionalNumber(row.claim_id ?? row.claimId),
    payerClaimControlNumber: trim(
      row.payer_claim_control_number ?? row.payerClaimControlNumber,
    ),
    billedAmount: parseOptionalNumber(
      row.billed_amount ?? row.billedAmount,
    ),
    billedAmountLabel: moneyLabel(row.billed_amount ?? row.billedAmount),
    allowedAmount: parseOptionalNumber(
      row.allowed_amount ?? row.allowedAmount,
    ),
    allowedAmountLabel: moneyLabel(
      row.allowed_amount ?? row.allowedAmount,
    ),
    payerPaidAmount: parseOptionalNumber(
      row.payer_paid_amount ?? row.payerPaidAmount,
    ),
    payerPaidAmountLabel: moneyLabel(
      row.payer_paid_amount ?? row.payerPaidAmount,
    ),
    clientResponsibilityAmount: parseOptionalNumber(
      row.client_responsibility_amount
        ?? row.patient_responsibility_amount
        ?? row.clientResponsibilityAmount
        ?? row.patientResponsibilityAmount,
    ),
    clientResponsibilityAmountLabel: moneyLabel(
      row.client_responsibility_amount
        ?? row.patient_responsibility_amount
        ?? row.clientResponsibilityAmount
        ?? row.patientResponsibilityAmount,
    ),
    adjustmentAmount: parseOptionalNumber(
      row.adjustment_amount ?? row.adjustmentAmount,
    ),
    adjustmentAmountLabel: moneyLabel(
      row.adjustment_amount ?? row.adjustmentAmount,
    ),
    adjudicationStatus: trim(
      row.adjudication_status ?? row.adjudicationStatus,
    ).toUpperCase(),
    processedDate: trim(row.processed_date ?? row.processedDate),
    postedAt: trim(row.posted_at ?? row.postedAt),
    receivedAt: trim(row.received_at ?? row.receivedAt),
    payerName: trim(row.payer_name ?? row.payerName),
    lines: asArray(row.lines).map(normalizeLineAdjudication),
    adjustments: asArray(row.adjustments).map(normalizeAdjustment),
  }
}

export function normalizeInsurancePayment(raw = {}) {
  const row = asObject(raw)
  if (row.id == null) {
    return null
  }

  return {
    id: parseOptionalNumber(row.id),
    paymentNumber: trim(row.payment_number ?? row.paymentNumber),
    remittanceId: parseOptionalNumber(
      row.remittance_id ?? row.remittanceId,
    ),
    remittanceNumber: trim(
      row.remittance_number ?? row.remittanceNumber,
    ),
    payerName: trim(row.payer_name ?? row.payerName),
    paymentMethod: trim(row.payment_method ?? row.paymentMethod)
      .toUpperCase(),
    paymentReference: trim(
      row.payment_reference ?? row.paymentReference,
    ),
    paymentDate: trim(row.payment_date ?? row.paymentDate),
    paymentAmount: parseOptionalNumber(
      row.payment_amount ?? row.paymentAmount,
    ),
    paymentAmountLabel: moneyLabel(
      row.payment_amount ?? row.paymentAmount,
    ),
    eftTraceNumber: trim(row.eft_trace_number ?? row.eftTraceNumber),
    checkNumber: trim(row.check_number ?? row.checkNumber),
    allocatedAmount: parseOptionalNumber(
      row.allocated_amount ?? row.allocatedAmount,
    ),
    allocatedAmountLabel: moneyLabel(
      row.allocated_amount ?? row.allocatedAmount,
    ),
    unallocatedAmount: parseOptionalNumber(
      row.unallocated_amount ?? row.unallocatedAmount,
    ),
    unallocatedAmountLabel: moneyLabel(
      row.unallocated_amount ?? row.unallocatedAmount,
    ),
    postingStatus: trim(row.posting_status ?? row.postingStatus)
      .toUpperCase(),
    createdAt: trim(row.created_at ?? row.createdAt),
    postedAt: trim(row.posted_at ?? row.postedAt),
    version: parseOptionalNumber(row.version),
    allocations: asArray(row.allocations).map(item => {
      const allocation = asObject(item)

      return {
        id: parseOptionalNumber(allocation.id),
        claimId: parseOptionalNumber(
          allocation.claim_id ?? allocation.claimId,
        ),
        claimNumber: trim(
          allocation.claim_number ?? allocation.claimNumber,
        ),
        clientName: trim(
          allocation.client_name ?? allocation.clientName,
        ),
        claimLineId: parseOptionalNumber(
          allocation.claim_line_id ?? allocation.claimLineId,
        ),
        amount: parseOptionalNumber(allocation.amount),
        amountLabel: moneyLabel(allocation.amount),
      }
    }),
  }
}

export function normalizeRemittanceClaim(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    matchStatus: trim(row.match_status ?? row.matchStatus)
      .toUpperCase(),
    issueCode: trim(row.issue_code ?? row.issueCode),
    issueMessage: trim(row.issue_message ?? row.issueMessage),
    claimId: parseOptionalNumber(row.claim_id ?? row.claimId),
    claimNumber: trim(row.claim_number ?? row.claimNumber),
    clientName: trim(row.client_name ?? row.clientName),
    payerClaimControlNumber: trim(
      row.payer_claim_control_number ?? row.payerClaimControlNumber,
    ),
    billedAmountLabel: moneyLabel(row.billed_amount ?? row.billedAmount),
    allowedAmountLabel: moneyLabel(
      row.allowed_amount ?? row.allowedAmount,
    ),
    payerPaidAmountLabel: moneyLabel(
      row.payer_paid_amount ?? row.payerPaidAmount,
    ),
    clientResponsibilityAmountLabel: moneyLabel(
      row.client_responsibility_amount
        ?? row.patient_responsibility_amount
        ?? row.clientResponsibilityAmount
        ?? row.patientResponsibilityAmount,
    ),
    adjustmentAmountLabel: moneyLabel(
      row.adjustment_amount ?? row.adjustmentAmount,
    ),
    adjudicationStatus: trim(
      row.adjudication_status ?? row.adjudicationStatus,
    ).toUpperCase(),
    adjudication: normalizeAdjudication(
      row.adjudication,
    ),
  }
}

export function normalizeRemittance(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    remittanceNumber: trim(
      row.remittance_number ?? row.remittanceNumber,
    ),
    transactionType: trim(row.transaction_type ?? row.transactionType),
    payerName: trim(row.payer_name ?? row.payerName),
    externalReference: trim(
      row.external_reference ?? row.externalReference,
    ),
    paymentReference: trim(
      row.payment_reference ?? row.paymentReference,
    ),
    paymentDate: trim(row.payment_date ?? row.paymentDate),
    totalPaymentAmount: parseOptionalNumber(
      row.total_payment_amount ?? row.totalPaymentAmount,
    ),
    totalPaymentAmountLabel: moneyLabel(
      row.total_payment_amount ?? row.totalPaymentAmount,
    ),
    receivedAt: trim(row.received_at ?? row.receivedAt),
    processingStatus: trim(
      row.processing_status ?? row.processingStatus,
    ).toUpperCase(),
    postingStatus: trim(row.posting_status ?? row.postingStatus)
      .toUpperCase(),
    claimCount: parseOptionalNumber(row.claim_count ?? row.claimCount)
      ?? 0,
    matchedClaimCount: parseOptionalNumber(
      row.matched_claim_count ?? row.matchedClaimCount,
    ) ?? 0,
    unmatchedClaimCount: parseOptionalNumber(
      row.unmatched_claim_count ?? row.unmatchedClaimCount,
    ) ?? 0,
    duplicate: row.duplicate === true,
    hasRawPayload: row.has_raw_payload === true
      || row.hasRawPayload === true,
    rawPayload: trim(row.raw_payload ?? row.rawPayload),
    failureCode: trim(row.failure_code ?? row.failureCode),
    failureMessage: trim(row.failure_message ?? row.failureMessage),
    version: parseOptionalNumber(row.version),
    insurancePayment: normalizeInsurancePayment(
      row.insurance_payment ?? row.insurancePayment,
    ),
    claims: asArray(row.claims).map(normalizeRemittanceClaim),
  }
}
