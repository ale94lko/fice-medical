/* eslint-disable camelcase -- API request body uses snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mockAddLabAttachment,
  mockCreatePatientLab,
  mockGetLabAttachmentBlob,
  mockGetPatientLab,
  mockListPatientLabs,
  mockSavePatientLab,
  mockSoftDeleteLabAttachment,
  mockSoftDeletePatientLab,
} from 'src/utils/lab-mock-store.js'
import {
  labToApiPayload,
  normalizeLabDetail,
  normalizeLabSummary,
} from 'src/utils/lab-normalize.js'
import { cloneLab, computeLabAbnormalResult } from 'src/utils/lab-orders.js'

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

function enrichLabSummary(lab) {
  const detail = cloneLab(lab)
  detail.abnormalResult = computeLabAbnormalResult(
    detail.components,
    detail.abnormalResultManual,
  )

  return normalizeLabSummary({
    ...detail,
    abnormal_result: detail.abnormalResult,
  })
}

export async function listPatientLabs(patientId) {
  try {
    const response = await apiInstance.get(apiPaths.patientLabs(patientId))
    const data = unwrapData(response.data)
    const list = Array.isArray(data) ? data : data?.items ?? []

    return list.map(item => enrichLabSummary(normalizeLabSummary(item)))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockListPatientLabs(patientId)
  }
}

export async function fetchPatientLab(patientId, labId) {
  try {
    const response = await apiInstance.get(
      apiPaths.patientLabById(patientId, labId),
    )
    const data = unwrapData(response.data)

    return normalizeLabDetail(data?.lab ?? data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockGetPatientLab(patientId, labId)
  }
}

export async function createPatientLab(patientId, payload) {
  try {
    const body = labToApiPayload(payload, { draft: false })
    const response = await apiInstance.post(
      apiPaths.patientLabs(patientId),
      body,
    )
    const data = unwrapData(response.data)

    return {
      labId: data?.lab_id ?? data?.labId ?? data?.id,
      status: data?.status,
    }
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockCreatePatientLab(patientId, payload)
  }
}

export async function savePatientLabDraft(patientId, labId, payload) {
  try {
    const body = labToApiPayload(payload, { draft: true })
    const response = await apiInstance.put(
      apiPaths.patientLabDraft(patientId, labId),
      body,
    )
    const data = unwrapData(response.data)

    return normalizeLabDetail(data?.lab ?? data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockSavePatientLab(patientId, labId, payload, { asDraft: true })
  }
}

export async function updatePatientLab(patientId, labId, payload) {
  try {
    const body = labToApiPayload(payload)
    const response = await apiInstance.put(
      apiPaths.patientLabById(patientId, labId),
      body,
    )
    const data = unwrapData(response.data)

    return normalizeLabDetail(data?.lab ?? data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockSavePatientLab(patientId, labId, payload)
  }
}

export async function deletePatientLab(patientId, labId) {
  try {
    await apiInstance.delete(apiPaths.patientLabById(patientId, labId))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    mockSoftDeletePatientLab(patientId, labId)
  }
}

export async function uploadLabAttachment(patientId, labId, file) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await apiInstance.post(
      apiPaths.patientLabAttachment(patientId, labId),
      formData,
    )

    return unwrapData(response.data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }
    const dataUrl = await readFileAsDataUrl(file)

    return mockAddLabAttachment(patientId, labId, {
      name: file.name,
      mimeType: file.type,
      size: file.size,
      dataUrl,
    })
  }
}

export async function downloadLabAttachment(
  patientId,
  labId,
  attachmentId,
) {
  try {
    const response = await apiInstance.get(
      apiPaths.patientLabAttachmentById(patientId, labId, attachmentId),
      { responseType: 'blob' },
    )

    return {
      blob: response.data,
      fileName: extractFileName(response.headers),
    }
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }
    const meta = mockGetLabAttachmentBlob(
      patientId,
      labId,
      attachmentId,
    )
    const blob = await dataUrlToBlob(meta.dataUrl, meta.mimeType)

    return { blob, fileName: meta.name }
  }
}

export async function deleteLabAttachment(
  patientId,
  labId,
  attachmentId,
) {
  try {
    await apiInstance.delete(
      apiPaths.patientLabAttachmentById(patientId, labId, attachmentId),
    )
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    mockSoftDeleteLabAttachment(patientId, labId, attachmentId)
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function dataUrlToBlob(dataUrl, mimeType) {
  try {
    const response = await fetch(dataUrl)

    return await response.blob()
  } catch {
    const base64 = String(dataUrl).split(',')[1] ?? ''
    const bytes = atob(base64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i += 1) {
      arr[i] = bytes.charCodeAt(i)
    }

    return new Blob([arr], { type: mimeType || 'application/octet-stream' })
  }
}

function extractFileName(headers) {
  const raw = headers?.['content-disposition'] ?? ''
  const match = /filename="?([^"]+)"?/i.exec(raw)

  return match?.[1] ?? 'lab-attachment'
}

export function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'download'
  anchor.click()
  URL.revokeObjectURL(url)
}
