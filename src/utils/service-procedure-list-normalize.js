import {
  authorizationRequirementValues,
  serviceProcedureCategoryValues,
  serviceProcedureFieldKeys as fk,
  serviceProcedureStatusValues,
} from 'components/constants.js'
import { formatServiceProcedureDuration } from
  'src/utils/service-procedure-display.js'

export function serviceProcedureCategoryLabel(category, t) {
  const map = {
    [serviceProcedureCategoryValues.clinicalService]:
      t('serviceProcedureCategoryClinicalService'),
    [serviceProcedureCategoryValues.therapy]:
      t('serviceProcedureCategoryTherapy'),
    [serviceProcedureCategoryValues.evaluation]:
      t('serviceProcedureCategoryEvaluation'),
    [serviceProcedureCategoryValues.medicationManagement]:
      t('serviceProcedureCategoryMedicationManagement'),
    [serviceProcedureCategoryValues.labExam]:
      t('serviceProcedureCategoryLabExam'),
    [serviceProcedureCategoryValues.procedure]:
      t('serviceProcedureCategoryProcedure'),
    [serviceProcedureCategoryValues.other]:
      t('serviceProcedureCategoryOther'),
  }

  return map[category] ?? category ?? '—'
}

export function authorizationRequirementLabel(value, t) {
  const map = {
    [authorizationRequirementValues.unknown]:
      t('serviceProcedureAuthReqUnknown'),
    [authorizationRequirementValues.mayBeRequired]:
      t('serviceProcedureAuthReqMayBeRequired'),
    [authorizationRequirementValues.typicallyRequired]:
      t('serviceProcedureAuthReqTypicallyRequired'),
    [authorizationRequirementValues.notUsuallyRequired]:
      t('serviceProcedureAuthReqNotUsuallyRequired'),
  }

  return map[value] ?? value ?? '—'
}

export function mapServiceProcedureListItem(item, t) {
  if (!item || item.id == null) {
    return null
  }

  const normalized = {
    id: item.id,
    [fk.name]: String(item.name ?? '').trim(),
    [fk.category]: String(item.category ?? '').trim(),
    [fk.description]: String(item.description ?? '').trim(),
    [fk.status]: String(item.status ?? '').trim().toUpperCase(),
    [fk.minDurationMin]: item.min_duration_min ?? item.minDurationMin ?? null,
    [fk.maxDurationMin]: item.max_duration_min ?? item.maxDurationMin ?? null,
    [fk.requiresAppointment]: Boolean(
      item.requires_appointment ?? item.requiresAppointment,
    ),
    [fk.cptCode]: String(item.cpt_code ?? item.cptCode ?? '').trim(),
    [fk.hcpcsCode]: String(item.hcpcs_code ?? item.hcpcsCode ?? '').trim(),
    [fk.defaultFee]: item.default_fee ?? item.defaultFee ?? null,
    [fk.authorizationRequirement]: String(
      item.authorization_requirement ?? item.authorizationRequirement ?? '',
    ).trim(),
    [fk.createdAt]: item.created_at ?? item.createdAt ?? '',
    [fk.updatedAt]: item.updated_at ?? item.updatedAt ?? '',
  }

  const isActive = normalized[fk.status] === serviceProcedureStatusValues.active

  return {
    ...normalized,
    categoryLabel: serviceProcedureCategoryLabel(normalized[fk.category], t),
    durationLabel: formatServiceProcedureDuration(
      normalized[fk.minDurationMin],
      normalized[fk.maxDurationMin],
      t,
    ),
    requiresAppointmentLabel: normalized[fk.requiresAppointment]
      ? t('yes')
      : t('no'),
    codesLabel: formatCodesLabel(
      normalized[fk.cptCode],
      normalized[fk.hcpcsCode],
    ),
    authorizationRequirementLabel: authorizationRequirementLabel(
      normalized[fk.authorizationRequirement],
      t,
    ),
    statusLabel: isActive ? t('active') : t('inactive'),
    statusVariant: isActive ? 'active' : 'inactive',
  }
}

function formatCodesLabel(cptCode, hcpcsCode) {
  const parts = []
  if (cptCode) {
    parts.push(cptCode)
  }
  if (hcpcsCode) {
    parts.push(hcpcsCode)
  }

  return parts.length ? parts.join(' / ') : '—'
}
