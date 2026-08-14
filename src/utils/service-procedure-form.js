import {
  authorizationRequirementValues,
  serviceProcedureCategoryValues,
  serviceProcedureStatusValues,
} from 'components/constants.js'
import {
  formatStaffCompensationRateAmount,
  parseStaffCompensationRate,
} from 'src/utils/staff-form.js'

function trim(value) {
  return String(value ?? '').trim()
}

/** Keep number inputs as strings for TextInput modelValue. */
function toOptionalInputString(value) {
  if (value == null || value === '') {
    return ''
  }

  return String(value)
}

function parseOptionalPositiveInt(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

function parseOptionalFee(value) {
  const n = parseStaffCompensationRate(value)
  if (n == null) {
    return null
  }

  return Number.isFinite(n) && n >= 0 ? n : null
}

function parseIntegerUnits(value) {
  if (value == null || value === '') {
    return { kind: 'empty' }
  }
  const raw = String(value).trim()
  if (!/^-?\d+$/.test(raw)) {
    return { kind: 'invalid' }
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    return { kind: 'invalid' }
  }
  if (n <= 0) {
    return { kind: 'nonpositive' }
  }

  return { kind: 'ok', n }
}

function isBillable(form = {}) {
  return Boolean(form.billable)
}

function toFeeInputString(value) {
  return formatStaffCompensationRateAmount(value)
    || toOptionalInputString(value)
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
    minDurationMin: '',
    maxDurationMin: '',
    requiresAppointment: false,
    cptCode: '',
    hcpcsCode: '',
    defaultFee: '',
    billable: false,
    defaultUnits: '1',
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
    minDurationMin: toOptionalInputString(
      parseOptionalPositiveInt(
        raw.min_duration_min ?? raw.minDurationMin,
      ),
    ),
    maxDurationMin: toOptionalInputString(
      parseOptionalPositiveInt(
        raw.max_duration_min ?? raw.maxDurationMin,
      ),
    ),
    requiresAppointment: Boolean(
      raw.requires_appointment ?? raw.requiresAppointment,
    ),
    cptCode: trim(raw.cpt_code ?? raw.cptCode),
    hcpcsCode: trim(raw.hcpcs_code ?? raw.hcpcsCode),
    defaultFee: toFeeInputString(
      parseOptionalFee(raw.default_fee ?? raw.defaultFee),
    ),
    billable: Boolean(raw.billable),
    defaultUnits: toOptionalInputString(
      raw.default_units ?? raw.defaultUnits,
    ),
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
    billable: Boolean(form.billable),
    default_units: parseOptionalPositiveInt(form.defaultUnits),
    authorization_requirement: parseAuthorizationRequirement(
      form.authorizationRequirement,
    ),
  }
  /* eslint-enable camelcase */
}

export function cloneServiceProcedureForm(form) {
  const base = {
    ...createEmptyServiceProcedureForm(),
    ...form,
  }

  return {
    ...base,
    minDurationMin: toOptionalInputString(base.minDurationMin),
    maxDurationMin: toOptionalInputString(base.maxDurationMin),
    defaultFee: toFeeInputString(base.defaultFee),
    billable: Boolean(base.billable),
    defaultUnits: toOptionalInputString(base.defaultUnits),
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

  const allowedAuth = Object.values(authorizationRequirementValues)
  if (!allowedAuth.includes(trim(form.authorizationRequirement))) {
    errors.authorizationRequirement = t('serviceProcedureAuthReqRequired')
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

  const units = parseIntegerUnits(form.defaultUnits)
  if (units.kind === 'invalid') {
    errors.defaultUnits = t('serviceProcedureDefaultUnitsInvalid')
  }
  if (units.kind === 'nonpositive') {
    errors.defaultUnits = t('serviceProcedureDefaultUnitsRequired')
  }

  if (isBillable(form)) {
    const cpt = trim(form.cptCode)
    const hcpcs = trim(form.hcpcsCode)
    if (cpt && hcpcs) {
      errors.cptCode = t('serviceProcedureBillingCodeAmbiguous')
      errors.hcpcsCode = t('serviceProcedureBillingCodeAmbiguous')
    } else if (!cpt && !hcpcs) {
      errors.cptCode = t('serviceProcedureBillingCodeRequired')
    }
    if (fee == null || fee <= 0) {
      errors.defaultFee = t('serviceProcedureDefaultFeeRequired')
    }
    if (units.kind !== 'ok') {
      errors.defaultUnits = t('serviceProcedureDefaultUnitsRequired')
    }
  }

  return errors
}
