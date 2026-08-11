import { subtenantStatusValues } from 'components/constants.js'

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
    code: '',
    main: false,
    status: subtenantStatusValues.active,
    photoFileId: null,
  }
}

export function normalizeSubtenantFromApi(raw = {}) {
  const status = Number(raw.status ?? subtenantStatusValues.active)

  return {
    id: raw.id ?? null,
    name: String(raw.name ?? '').trim(),
    code: String(raw.code ?? '').trim(),
    main: Boolean(raw.main),
    status: status === subtenantStatusValues.inactive
      ? subtenantStatusValues.inactive
      : subtenantStatusValues.active,
    photoFileId: parseOptionalPhotoFileId(raw),
  }
}

export function buildSubtenantRequest(form = {}) {
  const body = {
    name: String(form.name ?? '').trim(),
    main: Boolean(form.main),
    status: Number(form.status ?? subtenantStatusValues.active),
  }
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
