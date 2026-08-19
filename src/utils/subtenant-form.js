import {
  clinicTypeValues,
  subtenantStatusValues,
} from 'components/constants.js'
import { getAppDateTimeConfig } from 'src/utils/app-datetime.js'

export const subtenantLegalBusinessNameMaxLength = 255

function parseAddedSystemRoles(raw) {
  const value = raw?.added_system_roles ?? raw?.addedSystemRoles
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(code => String(code)).filter(Boolean)
}

function parseOptionalPhotoFileId(raw) {
  const value = raw?.photo_file_id
    ?? raw?.photoFileId
    ?? raw?.photo_stored_file_id
    ?? raw?.photoStoredFileId
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

export function createEmptySubtenantForm() {
  const cfg = getAppDateTimeConfig()

  return {
    id: null,
    name: '',
    code: '',
    main: false,
    status: subtenantStatusValues.active,
    clinicType: clinicTypeValues.primaryCare,
    photoFileId: null,
    timezone: cfg.timezone,
    dateFormat: cfg.date_format,
    timeFormat: cfg.time_format,
    firstDayOfWeek: cfg.first_day_of_week,
    legalBusinessName: '',
    taxId: '',
    billingEmail: '',
    billingPhone: '',
    billingAddress: '',
  }
}

export function normalizeSubtenantFromApi(raw = {}) {
  const status = Number(raw.status ?? subtenantStatusValues.active)
  const legalBusinessName = String(
    raw.legal_business_name
      ?? raw.legalBusinessName
      ?? raw.legal_name
      ?? raw.legalName
      ?? '',
  ).trim()

  return {
    id: raw.id ?? null,
    name: String(raw.name ?? '').trim(),
    code: String(raw.code ?? '').trim(),
    main: Boolean(raw.main),
    clinicType: String(
      raw.clinic_type ?? raw.clinicType ?? '',
    ).trim() || clinicTypeValues.primaryCare,
    timezone: String(raw.timezone ?? '').trim()
      || getAppDateTimeConfig().timezone,
    dateFormat: String(
      raw.date_format ?? raw.dateFormat ?? '',
    ).trim() || getAppDateTimeConfig().date_format,
    timeFormat: String(
      raw.time_format ?? raw.timeFormat ?? '',
    ).trim() || getAppDateTimeConfig().time_format,
    firstDayOfWeek: String(
      raw.first_day_of_week ?? raw.firstDayOfWeek ?? '',
    ).trim() || getAppDateTimeConfig().first_day_of_week,
    status: status === subtenantStatusValues.inactive
      ? subtenantStatusValues.inactive
      : subtenantStatusValues.active,
    photoFileId: parseOptionalPhotoFileId(raw),
    addedSystemRoles: parseAddedSystemRoles(raw),
    legalBusinessName,
    taxId: String(raw.tax_id ?? raw.taxId ?? '').replace(/\D/g, ''),
    billingEmail: String(
      raw.billing_email ?? raw.billingEmail ?? '',
    ).trim(),
    billingPhone: String(
      raw.billing_phone ?? raw.billingPhone ?? '',
    ).trim(),
    billingAddress: String(
      raw.billing_address ?? raw.billingAddress ?? '',
    ).trim(),
  }
}

export function buildSubtenantRequest(form = {}) {
  const legalBusinessName = String(
    form.legalBusinessName ?? '',
  ).trim()
  const body = {
    name: String(form.name ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    legal_name: legalBusinessName,
    main: Boolean(form.main),
    status: Number(form.status ?? subtenantStatusValues.active),
  }
  // eslint-disable-next-line camelcase -- API body
  body.clinic_type = String(form.clinicType ?? '').trim()
    || clinicTypeValues.primaryCare
  body.timezone = String(form.timezone ?? '').trim()
  // eslint-disable-next-line camelcase -- API body
  body.date_format = String(form.dateFormat ?? '').trim()
  // eslint-disable-next-line camelcase -- API body
  body.time_format = String(form.timeFormat ?? '').trim()
  // eslint-disable-next-line camelcase -- API body
  body.first_day_of_week = String(form.firstDayOfWeek ?? '').trim()
  const photoFileId = Number(form.photoFileId)
  if (Number.isFinite(photoFileId) && photoFileId > 0) {
    // eslint-disable-next-line camelcase -- API body
    body.photo_file_id = photoFileId
  }
  // eslint-disable-next-line camelcase -- API body
  body.legal_business_name = legalBusinessName
  // eslint-disable-next-line camelcase -- API body
  body.tax_id = String(form.taxId ?? '').replace(/\D/g, '')
  // eslint-disable-next-line camelcase -- API body
  body.billing_email = String(form.billingEmail ?? '').trim()
  // eslint-disable-next-line camelcase -- API body
  body.billing_phone = String(form.billingPhone ?? '').trim()
  // eslint-disable-next-line camelcase -- API body
  body.billing_address = String(form.billingAddress ?? '').trim()

  return body
}

export function cloneSubtenantForm(form) {
  return {
    ...createEmptySubtenantForm(),
    ...form,
  }
}
