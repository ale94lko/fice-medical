/* eslint-disable camelcase -- API payloads use snake_case */
import {
  encounterBillingReadinessStatuses,
  encounterRequirementPurposes,
  encounterRequirementStatuses,
} from 'components/constants.js'

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

function normalizeRequirementAction(raw = {}) {
  const action = asObject(raw)
  if (!Object.keys(action).length) {
    return null
  }

  return {
    type: trim(action.type).toUpperCase(),
    label: trim(action.label ?? action.name),
    targetId: parseOptionalNumber(
      action.target_id ?? action.targetId ?? action.reference_id,
    ),
  }
}

/**
 * Normalize a single EncounterRequirement snapshot item.
 */
export function normalizeEncounterRequirement(row = {}) {
  const item = asObject(row)
  const status = trim(item.status).toUpperCase()
    || encounterRequirementStatuses.pending
  const action = normalizeRequirementAction(
    item.action ?? {
      type: item.action_type ?? item.actionType ?? item.action_code,
      label: item.action_label ?? item.actionLabel,
      target_id: item.reference_id ?? item.referenceId,
    },
  )
  const satisfied = status === encounterRequirementStatuses.satisfied
    || status === encounterRequirementStatuses.waived
    || parseOptionalBool(item.completed ?? item.is_completed ?? item.done)

  return {
    id: parseOptionalNumber(item.id),
    type: trim(item.type ?? item.requirement_type ?? item.requirementType)
      .toUpperCase(),
    code: trim(item.code ?? item.key ?? item.id),
    label: trim(
      item.name
      ?? item.label
      ?? item.title
      ?? item.name_override
      ?? item.nameOverride,
    ),
    description: trim(item.description ?? item.detail ?? item.hint),
    scope: trim(item.scope).toUpperCase(),
    purpose: trim(item.purpose).toUpperCase(),
    severity: trim(item.severity).toUpperCase(),
    status,
    required: parseOptionalBool(
      item.required ?? item.is_required ?? item.blocking,
    ),
    blocking: parseOptionalBool(
      item.blocking
      ?? item.is_blocking
      ?? (trim(item.severity).toUpperCase() === 'BLOCKING'),
    ),
    waivable: parseOptionalBool(item.waivable ?? item.is_waivable),
    displayOrder: parseOptionalNumber(
      item.display_order ?? item.displayOrder,
    ) ?? 0,
    referenceId: parseOptionalNumber(
      item.reference_id ?? item.referenceId,
    ),
    referenceType: trim(
      item.reference_type ?? item.referenceType,
    ).toUpperCase(),
    action,
    actionLabel: trim(action?.label ?? item.action_label ?? item.actionLabel),
    actionCode: trim(
      action?.type
      ?? item.action_code
      ?? item.actionCode,
    ),
    completed: satisfied,
  }
}

function sortByDisplayOrder(items) {
  return [...items].sort((a, b) =>
    (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

/**
 * Normalize GET /encounters/v1/{id}/requirements payload
 * (or workspace.completion / billing_readiness slices).
 */
export function normalizeEncounterRequirementsSnapshot(raw = {}) {
  const body = asObject(raw)
  const requirements = sortByDisplayOrder(
    asArray(body.requirements).map(normalizeEncounterRequirement),
  )
  const optionalActions = sortByDisplayOrder(
    asArray(
      body.optional_actions ?? body.optionalActions,
    ).map(normalizeEncounterRequirement),
  )
  const missingRequirements = sortByDisplayOrder(
    asArray(
      body.missing_requirements ?? body.missingRequirements,
    ).map(normalizeEncounterRequirement),
  )
  const satisfiedCount = parseOptionalNumber(
    body.satisfied_count ?? body.satisfiedCount ?? body.completed_count
    ?? body.completedCount,
  ) ?? requirements.filter(item => item.completed).length
  const requiredCount = parseOptionalNumber(
    body.required_count ?? body.requiredCount,
  ) ?? requirements.filter(item => item.required).length
  const remainingCount = parseOptionalNumber(
    body.remaining_count ?? body.remainingCount,
  ) ?? Math.max(0, requiredCount - satisfiedCount)

  return {
    encounterId: parseOptionalNumber(
      body.encounter_id ?? body.encounterId,
    ),
    purpose: trim(body.purpose).toUpperCase()
      || encounterRequirementPurposes.encounterCompletion,
    canComplete: parseOptionalBool(
      body.can_complete ?? body.canComplete,
    ),
    completedCount: satisfiedCount,
    satisfiedCount,
    requiredCount,
    remainingCount,
    requirements,
    optionalActions,
    missingRequirements,
  }
}

export function normalizeBillingReadinessSnapshot(raw = {}) {
  const billingRaw = asObject(raw)
  const billingStatus = trim(billingRaw.status).toUpperCase()
    || encounterBillingReadinessStatuses.notReady
  const checks = asArray(billingRaw.checks).map(row => {
    const item = asObject(row)

    return {
      code: trim(item.code ?? item.key),
      label: trim(item.label ?? item.name ?? item.title),
      title: trim(item.title ?? item.label ?? item.name),
      passed: parseOptionalBool(
        item.passed ?? item.ok ?? item.ready ?? item.met,
      ),
      message: trim(
        item.message
        ?? item.description
        ?? item.detail
        ?? item.summary,
      ),
      summary: trim(item.summary ?? item.detail ?? item.message),
      severity: trim(item.severity).toUpperCase(),
      action: trim(item.action).toUpperCase(),
      actionLabel: trim(item.action_label ?? item.actionLabel),
      serviceName: trim(item.service_name ?? item.serviceName),
      serviceLineId: parseOptionalNumber(
        item.service_line_id ?? item.serviceLineId,
      ),
      sourceType: trim(item.source_type ?? item.sourceType),
      sourceId: parseOptionalNumber(
        item.source_id ?? item.sourceId,
      ),
      evidence: asObject(item.evidence),
    }
  })

  return {
    status: billingStatus,
    ready: parseOptionalBool(billingRaw.ready)
      || billingStatus === encounterBillingReadinessStatuses.ready,
    blockingCount: parseOptionalNumber(
      billingRaw.blocking_count ?? billingRaw.blockingCount,
    ) ?? checks.filter(item => !item.passed && item.severity === 'BLOCKING')
      .length,
    warningCount: parseOptionalNumber(
      billingRaw.warning_count ?? billingRaw.warningCount,
    ) ?? checks.filter(item => !item.passed && item.severity === 'WARNING')
      .length,
    checks,
  }
}

/**
 * Normalize Service Catalog requirement config row.
 */
export function normalizeServiceRequirementConfig(row = {}) {
  const item = asObject(row)

  return {
    id: parseOptionalNumber(item.id),
    requirementType: trim(
      item.requirement_type ?? item.requirementType ?? item.type,
    ).toUpperCase(),
    purpose: trim(item.purpose).toUpperCase()
      || encounterRequirementPurposes.encounterCompletion,
    scope: trim(item.scope).toUpperCase() || 'SERVICE',
    severity: trim(item.severity).toUpperCase() || 'BLOCKING',
    referenceType: trim(
      item.reference_type ?? item.referenceType,
    ).toUpperCase(),
    referenceId: parseOptionalNumber(
      item.reference_id ?? item.referenceId,
    ),
    requiredState: trim(
      item.required_state ?? item.requiredState,
    ).toUpperCase(),
    required: parseOptionalBool(item.required ?? true),
    displayOrder: parseOptionalNumber(
      item.display_order ?? item.displayOrder,
    ) ?? 0,
    waivable: parseOptionalBool(item.waivable),
    nameOverride: trim(
      item.name_override ?? item.nameOverride ?? item.name,
    ),
    active: item.active === undefined && item.is_active === undefined
      ? true
      : parseOptionalBool(item.active ?? item.is_active),
  }
}

export function buildServiceRequirementRequest(form = {}) {
  const referenceId = parseOptionalNumber(form.referenceId)
  const body = {
    requirement_type: trim(form.requirementType).toUpperCase(),
    purpose: trim(form.purpose).toUpperCase()
      || encounterRequirementPurposes.encounterCompletion,
    scope: trim(form.scope).toUpperCase() || 'SERVICE',
    severity: trim(form.severity).toUpperCase() || 'BLOCKING',
    required: form.required !== false,
    display_order: parseOptionalNumber(form.displayOrder) ?? 0,
    waivable: form.waivable === true,
    active: form.active !== false,
  }
  const referenceType = trim(form.referenceType).toUpperCase()
  if (referenceType) {
    body.reference_type = referenceType
  }
  if (referenceId != null) {
    body.reference_id = referenceId
  }
  const requiredState = trim(form.requiredState).toUpperCase()
  if (requiredState) {
    body.required_state = requiredState
  }
  const nameOverride = trim(form.nameOverride)
  if (nameOverride) {
    body.name_override = nameOverride
  }

  return body
}
