import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  clinicalNoteToApiPayload,
  mapClinicalNotesListFromApi,
  normalizeClinicalNoteDetail,
} from 'src/utils/clinical-note-normalize.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export async function listClinicalNotes(
  clientId,
  params = {},
  clinicianOptions = [],
) {
  const response = await apiInstance.get(
    apiPaths.clientClinicalNotes(clientId),
    { params },
  )
  const data = unwrapData(response.data)
  const list = Array.isArray(data) ? data : data?.items ?? []

  return {
    items: mapClinicalNotesListFromApi(list, clinicianOptions),
    pagination: data?.pagination ?? null,
  }
}

export async function fetchClinicalNote(
  clientId,
  noteId,
  clinicianOptions = [],
) {
  const response = await apiInstance.get(
    apiPaths.clientClinicalNoteById(clientId, noteId),
  )
  const data = unwrapData(response.data)

  return normalizeClinicalNoteDetail(data, clinicianOptions)
}

export async function createClinicalNote(
  clientId,
  note,
  clinicianOptions = [],
) {
  const body = clinicalNoteToApiPayload(note)
  const response = await apiInstance.post(
    apiPaths.clientClinicalNotes(clientId),
    body,
  )
  const data = unwrapData(response.data)

  return normalizeClinicalNoteDetail(data, clinicianOptions)
}

export async function updateClinicalNote(
  clientId,
  note,
  clinicianOptions = [],
) {
  const body = clinicalNoteToApiPayload(note)
  const response = await apiInstance.patch(
    apiPaths.clientClinicalNoteById(clientId, note.id),
    body,
  )
  const data = unwrapData(response.data)

  return normalizeClinicalNoteDetail(data, clinicianOptions)
}

export async function signClinicalNote(
  clientId,
  noteId,
  signatureData,
  clinicianOptions = [],
) {
  const response = await apiInstance.post(
    apiPaths.clientClinicalNoteSign(clientId, noteId),
    {
      // eslint-disable-next-line camelcase
      signature_data: signatureData,
    },
  )
  const data = unwrapData(response.data)

  return normalizeClinicalNoteDetail(data, clinicianOptions)
}

export async function deleteClinicalNote(clientId, noteId) {
  await apiInstance.delete(
    apiPaths.clientClinicalNoteById(clientId, noteId),
  )
}

export async function downloadClinicalNote(clientId, noteId) {
  return apiInstance.get(
    apiPaths.clientClinicalNoteDownload(clientId, noteId),
    { responseType: 'blob' },
  )
}

export function apiErrorMessage(error) {
  const data = error?.response?.data
  const msg = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return typeof msg === 'string' ? msg : null
}
