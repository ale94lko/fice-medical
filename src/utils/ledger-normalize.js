import {
  ledgerEntryStatuses,
} from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
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

function parseMoney(value) {
  if (value == null || value === '') {
    return 0
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : 0
}

export function formatLedgerMoney(value) {
  return formatSuperbillMoney(parseMoney(value))
}

export function normalizeLedgerEntry(raw) {
  const row = asObject(raw)
  const amount = parseMoney(row.amount)
  const charge = amount > 0 ? amount : null
  const credit = amount < 0 ? Math.abs(amount) : null

  return {
    id: row.id ?? null,
    clientId: row.client_id ?? row.clientId ?? null,
    currency: trim(row.currency) || 'USD',
    entryType: trim(row.entry_type || row.entryType),
    amount,
    amountLabel: formatLedgerMoney(amount),
    charge,
    chargeLabel: charge == null ? '—' : formatLedgerMoney(charge),
    credit,
    creditLabel: credit == null ? '—' : formatLedgerMoney(credit),
    effectiveDate: row.effective_date ?? row.effectiveDate ?? null,
    effectiveDateDisplay: apiDateToDisplay(
      row.effective_date ?? row.effectiveDate,
    ) || '—',
    sourceType: trim(row.source_type || row.sourceType),
    sourceId: row.source_id ?? row.sourceId ?? null,
    responsibilityType: trim(
      row.responsibility_type || row.responsibilityType,
    ),
    description: trim(row.description) || '—',
    serviceCode: trim(row.service_code || row.serviceCode),
    serviceName: trim(row.service_name || row.serviceName),
    payerName: trim(row.payer_name || row.payerName),
    status: trim(row.status) || ledgerEntryStatuses.posted,
    referenceType: trim(row.reference_type || row.referenceType),
    referenceId: row.reference_id ?? row.referenceId ?? null,
    referenceNumber: trim(
      row.reference_number || row.referenceNumber,
    ),
    claimId: row.claim_id ?? row.claimId ?? null,
    claimLineId: row.claim_line_id ?? row.claimLineId ?? null,
    superbillId: row.superbill_id ?? row.superbillId ?? null,
    superbillLineId: row.superbill_line_id
      ?? row.superbillLineId
      ?? null,
    remittanceId: row.remittance_id ?? row.remittanceId ?? null,
    encounterId: row.encounter_id ?? row.encounterId ?? null,
    reversedEntryId: row.reversed_entry_id
      ?? row.reversedEntryId
      ?? null,
    reversalReason: trim(row.reversal_reason || row.reversalReason),
    runningBalance: parseMoney(
      row.running_balance ?? row.runningBalance,
    ),
    runningBalanceLabel: formatLedgerMoney(
      row.running_balance ?? row.runningBalance,
    ),
    version: row.version ?? null,
  }
}

export function normalizeLedgerList(raw) {
  const root = asObject(raw)

  return {
    currentBalance: parseMoney(
      root.current_balance ?? root.currentBalance,
    ),
    currentBalanceLabel: formatLedgerMoney(
      root.current_balance ?? root.currentBalance,
    ),
    currency: trim(root.currency) || 'USD',
    items: asArray(root.items).map(normalizeLedgerEntry),
    pagination: root.pagination ?? null,
  }
}

export function normalizeFinancialSummary(raw) {
  const root = asObject(raw)
  const pr = asObject(
    root.client_responsibility
      || root.clientResponsibility
      || root.patient_responsibility
      || root.patientResponsibility,
  )

  return {
    currentBalance: parseMoney(
      root.current_balance ?? root.currentBalance,
    ),
    currentBalanceLabel: formatLedgerMoney(
      root.current_balance ?? root.currentBalance,
    ),
    currency: trim(root.currency) || 'USD',
    asOf: root.as_of ?? root.asOf ?? null,
    clientResponsibility: {
      copay: parseMoney(pr.copay),
      deductible: parseMoney(pr.deductible),
      coinsurance: parseMoney(pr.coinsurance),
      other: parseMoney(pr.other),
      total: parseMoney(pr.total),
      copayLabel: formatLedgerMoney(pr.copay),
      deductibleLabel: formatLedgerMoney(pr.deductible),
      coinsuranceLabel: formatLedgerMoney(pr.coinsurance),
      otherLabel: formatLedgerMoney(pr.other),
      totalLabel: formatLedgerMoney(pr.total),
    },
    selfPayBalance: parseMoney(
      root.self_pay_balance ?? root.selfPayBalance,
    ),
    selfPayBalanceLabel: formatLedgerMoney(
      root.self_pay_balance ?? root.selfPayBalance,
    ),
    openObligations: parseMoney(
      root.open_obligations ?? root.openObligations,
    ),
    openObligationsLabel: formatLedgerMoney(
      root.open_obligations ?? root.openObligations,
    ),
    unappliedAmount: parseMoney(
      root.unapplied_amount ?? root.unappliedAmount,
    ),
    unappliedAmountLabel: formatLedgerMoney(
      root.unapplied_amount ?? root.unappliedAmount,
    ),
    availableCredit: parseMoney(
      root.available_credit ?? root.availableCredit,
    ),
    availableCreditLabel: formatLedgerMoney(
      root.available_credit ?? root.availableCredit,
    ),
    lastPaymentAmount: parseMoney(
      root.last_payment_amount ?? root.lastPaymentAmount,
    ),
    lastPaymentAmountLabel: formatLedgerMoney(
      root.last_payment_amount ?? root.lastPaymentAmount,
    ),
    lastPaymentDate: root.last_payment_date
      ?? root.lastPaymentDate
      ?? null,
    lastPaymentDateDisplay: apiDateToDisplay(
      root.last_payment_date ?? root.lastPaymentDate,
    ) || '—',
    lastPaymentNumber: trim(
      root.last_payment_number || root.lastPaymentNumber,
    ),
    recentActivity: asArray(
      root.recent_activity || root.recentActivity,
    ).map(normalizeLedgerEntry),
  }
}

export function ledgerTypeI18nKey(entryType) {
  return `ledgerEntryType.${trim(entryType) || 'OTHER'}`
}

export function ledgerStatusI18nKey(status) {
  return `ledgerEntryStatus.${trim(status) || ledgerEntryStatuses.posted}`
}
