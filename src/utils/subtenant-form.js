import {
  clinicTypeValues,
  subtenantStatusValues,
} from 'components/constants.js'

export const subtenantLegalNameMaxLength = 255

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
  return {
    id: null,
    name: '',
    legalName: '',
    code: '',
    main: false,
    status: subtenantStatusValues.active,
    clinicType: clinicTypeValues.primaryCare,
    photoFileId: null,
  }
}

export function normalizeSubtenantFromApi(raw = {}) {
  const status = Number(raw.status ?? subtenantStatusValues.active)

  return {
    id: raw.id ?? null,
    name: String(raw.name ?? '').trim(),
    legalName: String(
      raw.legal_name ?? raw.legalName ?? '',
    ).trim(),
    code: String(raw.code ?? '').trim(),
    main: Boolean(raw.main),
    clinicType: String(
      raw.clinic_type ?? raw.clinicType ?? '',
    ).trim() || clinicTypeValues.primaryCare,
    status: status === subtenantStatusValues.inactive
      ? subtenantStatusValues.inactive
      : subtenantStatusValues.active,
    photoFileId: parseOptionalPhotoFileId(raw),
    addedSystemRoles: parseAddedSystemRoles(raw),
  }
}

export function buildSubtenantRequest(form = {}) {
  const body = {
    name: String(form.name ?? '').trim(),
    // eslint-disable-next-line camelcase -- API body
    legal_name: String(form.legalName ?? '').trim(),
    main: Boolean(form.main),
    status: Number(form.status ?? subtenantStatusValues.active),
  }
  // eslint-disable-next-line camelcase -- API body
  body.clinic_type = String(form.clinicType ?? '').trim()
    || clinicTypeValues.primaryCare
  const photoFileId = Number(form.photoFileId)
  if (Number.isFinite(photoFileId) && photoFileId > 0) {
    // eslint-disable-next-line camelcase -- API body
    body.photo_file_id = photoFileId
  }

  return body
}

export function cloneSubtenantForm(form) {
  return {
    ...createEmptySubtenantForm(),
    ...form,
  }
}
