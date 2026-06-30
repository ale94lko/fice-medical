import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { extractEnvelopeList } from 'components/helpers.js'
import {
  mapWeeklyScheduleList,
  normalizeWeeklyScheduleResponse,
} from 'src/utils/weekly-schedule-normalize.js'

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (root && typeof root === 'object' && Array.isArray(root.data)) {
    return root.data
  }

  return extractEnvelopeList(root)
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export async function listClinicianWeeklySchedule(clinicianId) {
  const response = await apiInstance.get(
    apiPaths.clinicianWeeklySchedule(clinicianId),
  )

  return mapWeeklyScheduleList(unwrapList(response.data))
}

export async function createClinicianWeeklySchedule(clinicianId, body) {
  const response = await apiInstance.post(
    apiPaths.clinicianWeeklySchedule(clinicianId),
    body,
  )

  return normalizeWeeklyScheduleResponse(unwrapData(response.data))
}

export async function updateClinicianWeeklySchedule(
  clinicianId,
  scheduleId,
  body,
) {
  const response = await apiInstance.put(
    `${apiPaths.clinicianWeeklySchedule(clinicianId)}/${
      encodeURIComponent(String(scheduleId ?? '').trim())
    }`,
    body,
  )

  return normalizeWeeklyScheduleResponse(unwrapData(response.data))
}
