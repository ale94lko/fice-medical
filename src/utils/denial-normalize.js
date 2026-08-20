import { formatSuperbillMoney } from 'src/utils/superbill-normalize.js'
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

function money(value) {
  if (value == null || value === '') {
    return null
  }

  return formatSuperbillMoney(value)
}

export function normalizeDenialCase(raw = {}) {
  const row = asObject(raw)
  const deniedAmount = row.denied_amount ?? row.deniedAmount
  const recoveredAmount = row.recovered_amount ?? row.recoveredAmount

  return {
    id: parseOptionalNumber(row.id),
    denialNumber: trim(row.denial_number ?? row.denialNumber),
    sourceType: trim(row.source_type ?? row.sourceType),
    status: trim(row.status),
    category: trim(row.category),
    reasonCode: trim(row.reason_code ?? row.reasonCode),
    remarkCode: trim(row.remark_code ?? row.remarkCode),
    groupCode: trim(row.group_code ?? row.groupCode),
    payerMessage: trim(row.payer_message ?? row.payerMessage),
    deniedAmount,
    deniedAmountLabel: money(deniedAmount) || '—',
    recoveredAmount,
    recoveredAmountLabel: money(recoveredAmount) || '—',
    priority: trim(row.priority) || 'NORMAL',
    assignedTo: parseOptionalNumber(row.assigned_to ?? row.assignedTo),
    dueDate: row.due_date ?? row.dueDate ?? null,
    dueDateDisplay: apiDateToDisplay(row.due_date ?? row.dueDate),
    followUpDate: row.follow_up_date ?? row.followUpDate ?? null,
    followUpDateDisplay: apiDateToDisplay(
      row.follow_up_date ?? row.followUpDate,
    ),
    filingDeadline: row.filing_deadline ?? row.filingDeadline ?? null,
    appealDeadline: row.appeal_deadline ?? row.appealDeadline ?? null,
    waitingReason: trim(row.waiting_reason ?? row.waitingReason),
    rootCause: trim(row.root_cause ?? row.rootCause),
    resolutionType: trim(row.resolution_type ?? row.resolutionType),
    writeOffReference: trim(
      row.write_off_reference ?? row.writeOffReference,
    ),
    notes: trim(row.notes),
    suggestedAction: trim(row.suggested_action ?? row.suggestedAction),
    claimId: parseOptionalNumber(row.claim_id ?? row.claimId),
    claimNumber: trim(row.claim_number ?? row.claimNumber),
    claimStatus: trim(row.claim_status ?? row.claimStatus),
    claimLineId: parseOptionalNumber(row.claim_line_id ?? row.claimLineId),
    procedureCode: trim(row.procedure_code ?? row.procedureCode),
    serviceName: trim(row.service_name ?? row.serviceName),
    clientNumber: trim(row.client_number ?? row.clientNumber),
    clientName: trim(row.client_name ?? row.clientName),
    payerName: trim(row.payer_name ?? row.payerName),
    dateOfService: row.date_of_service ?? row.dateOfService ?? null,
    dateOfServiceDisplay: apiDateToDisplay(
      row.date_of_service ?? row.dateOfService,
    ),
    renderingProviderName: trim(
      row.rendering_provider_name ?? row.renderingProviderName,
    ),
    superbillId: parseOptionalNumber(row.superbill_id ?? row.superbillId),
    sourceResponseId: parseOptionalNumber(
      row.source_response_id ?? row.sourceResponseId,
    ),
    claimAdjudicationId: parseOptionalNumber(
      row.claim_adjudication_id ?? row.claimAdjudicationId,
    ),
    remittanceId: parseOptionalNumber(row.remittance_id ?? row.remittanceId),
    correctedClaimId: parseOptionalNumber(
      row.corrected_claim_id ?? row.correctedClaimId,
    ),
    correctedClaimNumber: trim(
      row.corrected_claim_number ?? row.correctedClaimNumber,
    ),
    correctedClaimStatus: trim(
      row.corrected_claim_status ?? row.correctedClaimStatus,
    ),
    payerClaimControlNumber: trim(
      row.payer_claim_control_number ?? row.payerClaimControlNumber,
    ),
    billedAmountLabel: money(row.billed_amount ?? row.billedAmount) || '—',
    payerPaidAmountLabel: money(
      row.payer_paid_amount ?? row.payerPaidAmount,
    ) || '—',
    version: parseOptionalNumber(row.version) ?? 0,
    createdAt: row.created_at ?? row.createdAt ?? null,
    resolvedAt: row.resolved_at ?? row.resolvedAt ?? null,
    appeals: asArray(row.appeals).map(normalizeAppeal),
    internalNotes: asArray(row.internal_notes ?? row.internalNotes)
      .map(item => ({
        id: parseOptionalNumber(item.id),
        body: trim(item.body),
        createdBy: parseOptionalNumber(item.created_by ?? item.createdBy),
        createdAt: item.created_at ?? item.createdAt ?? null,
      })),
  }
}

function normalizeAppeal(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    appealNumber: trim(row.appeal_number ?? row.appealNumber),
    status: trim(row.status),
    appealLevel: trim(row.appeal_level ?? row.appealLevel),
    reason: trim(row.reason),
    narrative: trim(row.narrative),
    submittedAt: row.submitted_at ?? row.submittedAt ?? null,
    submissionMethod: trim(
      row.submission_method ?? row.submissionMethod,
    ),
    payerReference: trim(row.payer_reference ?? row.payerReference),
    followUpDate: row.follow_up_date ?? row.followUpDate ?? null,
    decision: trim(row.decision),
    decisionDate: row.decision_date ?? row.decisionDate ?? null,
    notes: trim(row.notes),
    version: parseOptionalNumber(row.version) ?? 0,
    documentFileIds: asArray(
      row.document_file_ids ?? row.documentFileIds,
    ),
  }
}
