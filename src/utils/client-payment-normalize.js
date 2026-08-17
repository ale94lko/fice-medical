import {
  obligationStates,
  clientPaymentMethods,
  clientPaymentStatuses,
} from 'components/constants.js'
import { apiDateToDisplay } from 'src/utils/app-datetime.js'
import { formatLedgerMoney } from 'src/utils/ledger-normalize.js'

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

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function normalizeClientPayment(raw) {
  const row = asObject(raw)
  const amount = parseMoney(row.amount)
  const applied = parseMoney(
    row.applied_amount ?? row.appliedAmount,
  )
  const unapplied = parseMoney(
    row.unapplied_amount ?? row.unappliedAmount,
  )

  return {
    id: row.id ?? null,
    paymentNumber: trim(
      row.payment_number || row.paymentNumber,
    ),
    clientId: row.client_id ?? row.clientId ?? null,
    clientNumber: trim(row.client_number || row.clientNumber),
    clientFirstName: trim(
      row.client_first_name || row.clientFirstName,
    ),
    clientLastName: trim(
      row.client_last_name || row.clientLastName,
    ),
    currency: trim(row.currency) || 'USD',
    amount,
    amountLabel: formatLedgerMoney(amount),
    appliedAmount: applied,
    appliedAmountLabel: formatLedgerMoney(applied),
    unappliedAmount: unapplied,
    unappliedAmountLabel: formatLedgerMoney(unapplied),
    paymentDate: row.payment_date ?? row.paymentDate ?? null,
    paymentDateDisplay: apiDateToDisplay(
      row.payment_date ?? row.paymentDate,
    ) || '—',
    paymentMethod: trim(row.payment_method || row.paymentMethod),
    methodDescription: trim(
      row.method_description || row.methodDescription,
    ),
    referenceNumber: trim(
      row.reference_number || row.referenceNumber,
    ),
    checkNumber: trim(row.check_number || row.checkNumber),
    notes: trim(row.notes),
    status: trim(row.status) || clientPaymentStatuses.posted,
    source: trim(row.source) || 'MANUAL_ENTRY',
    ledgerEntryId: row.ledger_entry_id ?? row.ledgerEntryId ?? null,
    currentBalance: parseMoney(
      row.current_balance ?? row.currentBalance,
    ),
    currentBalanceLabel: formatLedgerMoney(
      row.current_balance ?? row.currentBalance,
    ),
    reversalReason: trim(
      row.reversal_reason || row.reversalReason,
    ),
    version: row.version ?? null,
    allocations: asArray(row.allocations).map(normalizeAllocation),
  }
}

export function normalizeAllocation(raw) {
  const row = asObject(raw)
  const amount = parseMoney(row.amount)

  return {
    id: row.id ?? null,
    ledgerEntryId: row.ledger_entry_id ?? row.ledgerEntryId ?? null,
    amount,
    amountLabel: formatLedgerMoney(amount),
    status: trim(row.status),
    description: trim(row.description) || '—',
    entryType: trim(row.entry_type || row.entryType),
    responsibilityType: trim(
      row.responsibility_type || row.responsibilityType,
    ),
    referenceNumber: trim(
      row.reference_number || row.referenceNumber,
    ),
    reversalReason: trim(
      row.reversal_reason || row.reversalReason,
    ),
  }
}

export function normalizeOpenObligation(raw) {
  const row = asObject(raw)
  const original = parseMoney(
    row.original_amount ?? row.originalAmount,
  )
  const allocated = parseMoney(
    row.allocated_amount ?? row.allocatedAmount,
  )
  const outstanding = parseMoney(
    row.outstanding_amount ?? row.outstandingAmount,
  )

  return {
    ledgerEntryId: row.ledger_entry_id ?? row.ledgerEntryId ?? null,
    entryType: trim(row.entry_type || row.entryType),
    responsibilityType: trim(
      row.responsibility_type || row.responsibilityType,
    ),
    description: trim(row.description) || '—',
    referenceNumber: trim(
      row.reference_number || row.referenceNumber,
    ),
    originalAmount: original,
    originalAmountLabel: formatLedgerMoney(original),
    allocatedAmount: allocated,
    allocatedAmountLabel: formatLedgerMoney(allocated),
    outstandingAmount: outstanding,
    outstandingAmountLabel: formatLedgerMoney(outstanding),
    obligationState: trim(
      row.obligation_state || row.obligationState,
    ) || obligationStates.open,
    effectiveDate: row.effective_date ?? row.effectiveDate ?? null,
    effectiveDateDisplay: apiDateToDisplay(
      row.effective_date ?? row.effectiveDate,
    ) || '—',
    selected: false,
    applyAmount: '',
  }
}

export function normalizeOpenObligationList(raw) {
  const root = asObject(raw)

  return {
    items: asArray(root.items).map(normalizeOpenObligation),
    openObligations: parseMoney(
      root.open_obligations ?? root.openObligations,
    ),
    openObligationsLabel: formatLedgerMoney(
      root.open_obligations ?? root.openObligations,
    ),
    currentBalance: parseMoney(
      root.current_balance ?? root.currentBalance,
    ),
    currentBalanceLabel: formatLedgerMoney(
      root.current_balance ?? root.currentBalance,
    ),
    unappliedAmount: parseMoney(
      root.unapplied_amount ?? root.unappliedAmount,
    ),
    unappliedAmountLabel: formatLedgerMoney(
      root.unapplied_amount ?? root.unappliedAmount,
    ),
    currency: trim(root.currency) || 'USD',
  }
}

export function normalizeClientPaymentList(raw) {
  const root = asObject(raw)

  return {
    items: asArray(root.items).map(normalizeClientPayment),
    pagination: root.pagination ?? null,
    currentBalance: parseMoney(
      root.current_balance ?? root.currentBalance,
    ),
    currentBalanceLabel: formatLedgerMoney(
      root.current_balance ?? root.currentBalance,
    ),
    unappliedAmount: parseMoney(
      root.unapplied_amount ?? root.unappliedAmount,
    ),
    unappliedAmountLabel: formatLedgerMoney(
      root.unapplied_amount ?? root.unappliedAmount,
    ),
    counts: normalizeClientPaymentCounts(root.counts),
  }
}

export function normalizeClientPaymentCounts(raw) {
  const row = asObject(raw)

  return {
    totalReceived: parseMoney(
      row.total_received ?? row.totalReceived,
    ),
    paymentCount: Number(row.payment_count ?? row.paymentCount ?? 0),
    unappliedAmount: parseMoney(
      row.unapplied_amount ?? row.unappliedAmount,
    ),
    unappliedCount: Number(
      row.unapplied_count ?? row.unappliedCount ?? 0,
    ),
    reversedAmount: parseMoney(
      row.reversed_amount ?? row.reversedAmount,
    ),
    reversedCount: Number(
      row.reversed_count ?? row.reversedCount ?? 0,
    ),
  }
}

export function autoApplyObligations(items, paymentAmount) {
  let remaining = roundMoney(paymentAmount)
  return (items ?? []).map(item => {
    const outstanding = roundMoney(item.outstandingAmount)
    if (remaining <= 0 || outstanding <= 0) {
      return {
        ...item,
        selected: false,
        applyAmount: '',
      }
    }
    const applied = Math.min(outstanding, remaining)
    remaining = roundMoney(remaining - applied)

    return {
      ...item,
      selected: true,
      applyAmount: applied.toFixed(2),
    }
  })
}

export function selectedAllocations(items) {
  return (items ?? [])
    .filter(item => item.selected)
    .map(item => ({
      'ledger_entry_id': item.ledgerEntryId,
      amount: roundMoney(item.applyAmount),
    }))
    .filter(row => row.amount > 0)
}

export function appliedFromDraft(items) {
  return roundMoney(
    selectedAllocations(items).reduce(
      (sum, row) => sum + row.amount,
      0,
    ),
  )
}

export function paymentMethodI18nKey(method) {
  return `clientPaymentMethod.${
    trim(method) || clientPaymentMethods.other
  }`
}

export function paymentStatusI18nKey(status) {
  return `clientPaymentStatus.${
    trim(status) || clientPaymentStatuses.posted
  }`
}

export function obligationStateI18nKey(state) {
  return `obligationState.${trim(state) || obligationStates.open}`
}
