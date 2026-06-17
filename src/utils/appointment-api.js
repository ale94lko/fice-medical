/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths, appointmentSlotStatuses } from 'components/constants.js'
import {
  mockBookAppointment,
  mockGetAppointment,
  mockLifecycleAppointment,
  mockListAppointmentClinicians,
  mockListAppointmentTypes,
  mockListClientAppointments,
  mockListClientCarePlans,
  mockListClientReferrals,
  mockListSlots,
  mockPatchAppointment,
  mockRescheduleAppointment,
} from 'src/utils/appointment-mock-store.js'
import {
  mapAppointmentClinicians,
  mapAppointmentTypes,
  mapAppointmentsList,
  mapAvailableSlots,
  normalizeAppointment,
  normalizeCarePlanOption,
  normalizeReferralOption,
} from 'src/utils/appointment-normalize.js'

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

function unwrapList(body) {
  const root = body?.data ?? body
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root?.content)) {
    return root.content
  }
  if (Array.isArray(root?.items)) {
    return root.items
  }

  return []
}

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export async function listClientAppointments(clientId, params = {}) {
  try {
    const response = await apiInstance.get(
      apiPaths.clientAppointments(clientId),
      { params },
    )

    return mapAppointmentsList(unwrapList(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mapAppointmentsList(mockListClientAppointments(clientId))
  }
}

export async function fetchAppointment(appointmentId) {
  try {
    const response = await apiInstance.get(
      apiPaths.appointmentById(appointmentId),
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }
    const row = mockGetAppointment(appointmentId)
    if (!row) {
      throw error
    }

    return normalizeAppointment(row)
  }
}

export async function listAppointmentTypes() {
  try {
    const response = await apiInstance.get(apiPaths.appointmentTypes)

    return mapAppointmentTypes(unwrapList(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mapAppointmentTypes(mockListAppointmentTypes())
  }
}

export async function listAppointmentClinicians() {
  try {
    const response = await apiInstance.get(apiPaths.appointmentClinicians)

    return mapAppointmentClinicians(unwrapList(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mapAppointmentClinicians(mockListAppointmentClinicians())
  }
}

export async function listAvailableSlots(params = {}) {
  const query = {
    from_utc: params.from_utc,
    to_utc: params.to_utc,
    appointment_type_id: params.appointment_type_id,
    clinician_id: params.clinician_id ?? undefined,
    telemedicine: params.telemedicine ?? undefined,
    limit: params.limit ?? 50,
    page: params.page ?? 0,
  }
  try {
    const response = await apiInstance.get(apiPaths.appointmentSlots, {
      params: query,
    })

    return mapAvailableSlots(unwrapList(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mapAvailableSlots(mockListSlots(query))
  }
}

export async function listAvailableSlotsInRange(params = {}) {
  const pageSize = Number(params.limit ?? 50)
  const maxPages = Number(params.max_pages ?? 20)
  const merged = []
  const seen = new Set()

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await listAvailableSlots({
      ...params,
      limit: pageSize,
      page,
    })
    if (!batch.length) {
      break
    }
    for (const slot of batch) {
      const key = String(slot.slotId)
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      merged.push(slot)
    }
    if (batch.length < pageSize) {
      break
    }
  }

  return merged
}

export async function listClientReferrals(clientId) {
  try {
    const response = await apiInstance.get(apiPaths.clientReferrals(clientId))

    return unwrapList(response.data).map(normalizeReferralOption)
      .filter(row => row.value != null)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockListClientReferrals(clientId).map(normalizeReferralOption)
  }
}

export async function listClientCarePlans(clientId) {
  try {
    const response = await apiInstance.get(apiPaths.clientCarePlans(clientId))

    return unwrapList(response.data).map(normalizeCarePlanOption)
      .filter(row => row.value != null)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockListClientCarePlans(clientId).map(normalizeCarePlanOption)
  }
}

export async function bookAppointment(body, idempotencyKey = null) {
  const headers = {}
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }
  try {
    const response = await apiInstance.post(
      apiPaths.appointmentBook,
      body,
      { headers },
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(mockBookAppointment(body))
  }
}

export async function patchAppointment(appointmentId, body) {
  try {
    const response = await apiInstance.patch(
      apiPaths.appointmentById(appointmentId),
      body,
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(mockPatchAppointment(appointmentId, body))
  }
}

export async function cancelAppointment(appointmentId, reason = null) {
  const body = reason ? { reason } : {}
  try {
    const response = await apiInstance.post(
      apiPaths.appointmentCancel(appointmentId),
      body,
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(
      mockLifecycleAppointment(appointmentId, 'CANCELLED'),
    )
  }
}

export async function rescheduleAppointment(
  appointmentId,
  newSlotId,
  notes = null,
) {
  const body = {
    new_slot_id: newSlotId,
    notes,
  }
  try {
    const response = await apiInstance.post(
      apiPaths.appointmentReschedule(appointmentId),
      body,
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(
      mockRescheduleAppointment(appointmentId, newSlotId),
    )
  }
}

export async function checkInAppointment(appointmentId) {
  try {
    const response = await apiInstance.post(
      apiPaths.appointmentCheckIn(appointmentId),
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(
      mockLifecycleAppointment(appointmentId, 'CHECKED_IN'),
    )
  }
}

export async function completeAppointment(appointmentId) {
  try {
    const response = await apiInstance.post(
      apiPaths.appointmentComplete(appointmentId),
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(
      mockLifecycleAppointment(appointmentId, 'COMPLETED'),
    )
  }
}

export async function noShowAppointment(appointmentId) {
  try {
    const response = await apiInstance.post(
      apiPaths.appointmentNoShow(appointmentId),
    )

    return normalizeAppointment(unwrapData(response.data))
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeAppointment(
      mockLifecycleAppointment(appointmentId, 'NO_SHOW'),
    )
  }
}

export { appointmentSlotStatuses }
