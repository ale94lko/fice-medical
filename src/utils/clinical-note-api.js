import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mockCreateClinicalNote,
  mockDeleteClinicalNote,
  mockDownloadClinicalNote,
  mockGetClinicalNote,
  mockListClinicalNotes,
  mockSignClinicalNote,
  mockUpdateClinicalNote,
} from 'src/utils/clinical-note-mock-store.js'
import {
  clinicalNoteToApiPayload,
  mapClinicalNotesListFromApi,
  normalizeClinicalNoteDetail,
} from 'src/utils/clinical-note-normalize.js'

function useMockFallback(error) {
  const status = error?.response?.status
  if (status === 404 || status === 501 || status === 502 || status === 503) {
    return true
  }
  if (!error?.response) {
    return true
  }

  return false
}

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
  try {
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
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    const mock = mockListClinicalNotes(clientId, params)

    return {
      items: mapClinicalNotesListFromApi(
        mock.items,
        clinicianOptions,
      ),
      pagination: mock.pagination,
    }
  }
}

export async function fetchClinicalNote(
  clientId,
  noteId,
  clinicianOptions = [],
) {
  try {
    const response = await apiInstance.get(
      apiPaths.clientClinicalNoteById(clientId, noteId),
    )
    const data = unwrapData(response.data)

    return normalizeClinicalNoteDetail(data, clinicianOptions)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeClinicalNoteDetail(
      mockGetClinicalNote(clientId, noteId),
      clinicianOptions,
    )
  }
}

export async function createClinicalNote(
  clientId,
  note,
  clinicianOptions = [],
) {
  try {
    const body = clinicalNoteToApiPayload(note)
    const response = await apiInstance.post(
      apiPaths.clientClinicalNotes(clientId),
      body,
    )
    const data = unwrapData(response.data)

    return normalizeClinicalNoteDetail(data, clinicianOptions)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeClinicalNoteDetail(
      mockCreateClinicalNote(clientId, clinicalNoteToApiPayload(note)),
      clinicianOptions,
    )
  }
}

export async function updateClinicalNote(
  clientId,
  note,
  clinicianOptions = [],
) {
  try {
    const body = clinicalNoteToApiPayload(note)
    const response = await apiInstance.patch(
      apiPaths.clientClinicalNoteById(clientId, note.id),
      body,
    )
    const data = unwrapData(response.data)

    return normalizeClinicalNoteDetail(data, clinicianOptions)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeClinicalNoteDetail(
      mockUpdateClinicalNote(
        clientId,
        note.id,
        clinicalNoteToApiPayload(note),
      ),
      clinicianOptions,
    )
  }
}

export async function signClinicalNote(
  clientId,
  noteId,
  signatureData,
  clinicianOptions = [],
) {
  try {
    const response = await apiInstance.post(
      apiPaths.clientClinicalNoteSign(clientId, noteId),
      {
        // eslint-disable-next-line camelcase
        signature_data: signatureData,
      },
    )
    const data = unwrapData(response.data)

    return normalizeClinicalNoteDetail(data, clinicianOptions)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeClinicalNoteDetail(
      mockSignClinicalNote(clientId, noteId, signatureData),
      clinicianOptions,
    )
  }
}

export async function deleteClinicalNote(clientId, noteId) {
  try {
    await apiInstance.delete(
      apiPaths.clientClinicalNoteById(clientId, noteId),
    )
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    mockDeleteClinicalNote(clientId, noteId)
  }
}

export async function downloadClinicalNote(clientId, noteId) {
  try {
    return await apiInstance.get(
      apiPaths.clientClinicalNoteDownload(clientId, noteId),
      { responseType: 'blob' },
    )
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return {
      data: mockDownloadClinicalNote(clientId, noteId),
    }
  }
}

export function apiErrorMessage(error) {
  const data = error?.response?.data
  const msg = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return typeof msg === 'string' ? msg : null
}
