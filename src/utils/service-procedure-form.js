import {
  authorizationRequirementValues,
  serviceProcedureCategoryValues,
  serviceProcedureStatusValues,
} from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalPositiveInt(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

function parseOptionalFee(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) && n >= 0 ? n : null
}

function parseCategory(value) {
  const raw = trim(value)
  const allowed = Object.values(serviceProcedureCategoryValues)

  return allowed.includes(raw) ? raw : ''
}

function parseAuthorizationRequirement(value) {
  const raw = trim(value)
  const allowed = Object.values(authorizationRequirementValues)

  return allowed.includes(raw)
    ? raw
    : authorizationRequirementValues.unknown
}

export function createEmptyServiceProcedureForm() {
  return {
    id: null,
    name: '',
    category: '',
    description: '',
    status: serviceProcedureStatusValues.active,
    minDurationMin: null,
    maxDurationMin: null,
    requiresAppointment: false,
    cptCode: '',
    hcpcsCode: '',
    defaultFee: null,
    authorizationRequirement: authorizationRequirementValues.unknown,
  }
}

export function normalizeServiceProcedureFromApi(raw = {}) {
  const status = trim(raw.status).toUpperCase()
    || serviceProcedureStatusValues.active

  return {
    id: raw.id ?? null,
    name: trim(raw.name),
    category: parseCategory(raw.category),
    description: trim(raw.description),
    status: status === serviceProcedureStatusValues.inactive
      ? serviceProcedureStatusValues.inactive
      : serviceProcedureStatusValues.active,
    minDurationMin: parseOptionalPositiveInt(
      raw.min_duration_min ?? raw.minDurationMin,
    ),
    maxDurationMin: parseOptionalPositiveInt(
      raw.max_duration_min ?? raw.maxDurationMin,
    ),
    requiresAppointment: Boolean(
      raw.requires_appointment ?? raw.requiresAppointment,
    ),
    cptCode: trim(raw.cpt_code ?? raw.cptCode),
    hcpcsCode: trim(raw.hcpcs_code ?? raw.hcpcsCode),
    defaultFee: parseOptionalFee(raw.default_fee ?? raw.defaultFee),
    authorizationRequirement: parseAuthorizationRequirement(
      raw.authorization_requirement ?? raw.authorizationRequirement,
    ),
    createdAt: trim(raw.created_at ?? raw.createdAt),
    updatedAt: trim(raw.updated_at ?? raw.updatedAt),
  }
}

export function buildServiceProcedureRequest(form = {}) {
  /* eslint-disable camelcase -- API payload */
  return {
    name: trim(form.name),
    category: parseCategory(form.category),
    description: trim(form.description) || null,
    status: trim(form.status) || serviceProcedureStatusValues.active,
    min_duration_min: parseOptionalPositiveInt(form.minDurationMin),
    max_duration_min: parseOptionalPositiveInt(form.maxDurationMin),
    requires_appointment: Boolean(form.requiresAppointment),
    cpt_code: trim(form.cptCode) || null,
    hcpcs_code: trim(form.hcpcsCode) || null,
    default_fee: parseOptionalFee(form.defaultFee),
    authorization_requirement: parseAuthorizationRequirement(
      form.authorizationRequirement,
    ),
  }
  /* eslint-enable camelcase */
}

export function cloneServiceProcedureForm(form) {
  return {
    ...createEmptyServiceProcedureForm(),
    ...form,
  }
}

export function validateServiceProcedureForm(form, t) {
  const errors = {}
  const name = trim(form.name)
  if (!name) {
    errors.name = t('serviceProcedureNameRequired')
  }

  if (!parseCategory(form.category)) {
    errors.category = t('serviceProcedureCategoryRequired')
  }

  const minDuration = parseOptionalPositiveInt(form.minDurationMin)
  const maxDuration = parseOptionalPositiveInt(form.maxDurationMin)
  if (form.minDurationMin != null && form.minDurationMin !== ''
    && minDuration == null) {
    errors.minDurationMin = t('serviceProcedureDurationInvalid')
  }
  if (form.maxDurationMin != null && form.maxDurationMin !== ''
    && maxDuration == null) {
    errors.maxDurationMin = t('serviceProcedureDurationInvalid')
  }
  if (minDuration != null && maxDuration != null && minDuration > maxDuration) {
    errors.maxDurationMin = t('serviceProcedureDurationRangeInvalid')
  }

  const fee = parseOptionalFee(form.defaultFee)
  if (form.defaultFee != null && form.defaultFee !== '' && fee == null) {
    errors.defaultFee = t('serviceProcedureDefaultFeeInvalid')
  }

  return errors
}
