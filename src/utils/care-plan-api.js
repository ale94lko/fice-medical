import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  mockGetClientCarePlan,
  mockListClientCarePlans,
  mockSaveCarePlanTree,
  mockSignCarePlan,
  mockUpdateCarePlanStatus,
  mockUpdateOutcomeMeasureCurrentValue,
} from 'src/utils/care-plan-mock-store.js'
import {
  carePlanGoalToApiPayload,
  carePlanToApiPayload,
  interventionToApiPayload,
  mapCarePlansListFromApi,
  normalizeCarePlanDetail,
  normalizeCarePlanSummary,
  outcomeMeasureToApiPayload,
} from 'src/utils/care-plan-normalize.js'
import {
  isTemporaryCarePlanId,
  refreshCarePlanProgress,
} from 'src/utils/care-plan-orders.js'

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

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

async function syncCarePlanChildren(clientId, planId, plan) {
  for (const goal of plan.goals ?? []) {
    const goalPayload = carePlanGoalToApiPayload(goal)
    let goalId = goal.id
    if (isTemporaryCarePlanId(goalId)) {
      const goalRes = await apiInstance.post(
        apiPaths.clientCarePlanGoals(clientId, planId),
        goalPayload,
      )
      goalId = unwrapData(goalRes.data)?.id ?? goalId
      goal.id = goalId
    } else {
      await apiInstance.patch(
        apiPaths.clientCarePlanGoalById(clientId, planId, goalId),
        goalPayload,
      )
    }
    for (const measure of goal.outcomeMeasures ?? []) {
      const measurePayload = outcomeMeasureToApiPayload(measure)
      if (isTemporaryCarePlanId(measure.id)) {
        const measureRes = await apiInstance.post(
          apiPaths.clientCarePlanOutcomeMeasures(
            clientId,
            planId,
            goalId,
          ),
          measurePayload,
        )
        measure.id = unwrapData(measureRes.data)?.id ?? measure.id
      } else {
        await apiInstance.patch(
          apiPaths.clientCarePlanOutcomeMeasureById(
            clientId,
            planId,
            goalId,
            measure.id,
          ),
          measurePayload,
        )
      }
    }
    for (const intervention of goal.interventions ?? []) {
      const interventionPayload = interventionToApiPayload(intervention)
      if (isTemporaryCarePlanId(intervention.id)) {
        const interventionRes = await apiInstance.post(
          apiPaths.clientCarePlanInterventions(
            clientId,
            planId,
            goalId,
          ),
          interventionPayload,
        )
        intervention.id = unwrapData(interventionRes.data)?.id
          ?? intervention.id
      } else {
        await apiInstance.patch(
          apiPaths.clientCarePlanInterventionById(
            clientId,
            planId,
            goalId,
            intervention.id,
          ),
          interventionPayload,
        )
      }
    }
  }

  return fetchClientCarePlan(clientId, planId)
}

export async function listClientCarePlans(
  clientId,
  { status = null, page = 0, limit = 20 } = {},
) {
  try {
    const params = { page, limit }
    if (status) {
      params.status = status
    }
    const response = await apiInstance.get(
      apiPaths.clientCarePlans(clientId),
      { params },
    )
    const data = unwrapData(response.data)
    const list = Array.isArray(data) ? data : data?.items ?? []

    return {
      items: mapCarePlansListFromApi(list),
      pagination: data?.pagination ?? null,
    }
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockListClientCarePlans(clientId, { status, page, limit })
  }
}

export async function fetchClientCarePlan(
  clientId,
  planId,
  { includeDetails = true } = {},
) {
  try {
    const detailParams = {
      include_details: includeDetails, // eslint-disable-line camelcase
    }
    const response = await apiInstance.get(
      apiPaths.clientCarePlanById(clientId, planId),
      { params: detailParams },
    )
    const data = unwrapData(response.data)

    return normalizeCarePlanDetail(data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeCarePlanDetail(
      mockGetClientCarePlan(clientId, planId),
    )
  }
}

export async function createClientCarePlan(clientId, plan) {
  try {
    const body = carePlanToApiPayload(plan)
    const response = await apiInstance.post(
      apiPaths.clientCarePlans(clientId),
      body,
    )
    const data = unwrapData(response.data)
    const planId = data?.id ?? data?.care_plan_id

    return syncCarePlanChildren(clientId, planId, plan)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeCarePlanDetail(
      mockSaveCarePlanTree(clientId, plan),
    )
  }
}

export async function updateClientCarePlan(clientId, plan) {
  const planId = plan.id
  if (isTemporaryCarePlanId(planId)) {
    return createClientCarePlan(clientId, plan)
  }
  try {
    const body = carePlanToApiPayload(plan)
    await apiInstance.patch(
      apiPaths.clientCarePlanById(clientId, planId),
      body,
    )

    return syncCarePlanChildren(clientId, planId, plan)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeCarePlanDetail(
      mockSaveCarePlanTree(clientId, plan),
    )
  }
}

export async function changeCarePlanStatus(clientId, planId, status) {
  try {
    const response = await apiInstance.patch(
      apiPaths.clientCarePlanStatus(clientId, planId),
      { status },
    )
    const data = unwrapData(response.data)

    return normalizeCarePlanSummary(data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return mockUpdateCarePlanStatus(clientId, planId, status)
  }
}

export async function signClientCarePlan(clientId, planId, signature) {
  try {
    const response = await apiInstance.post(
      apiPaths.clientCarePlanSign(clientId, planId),
      { signature },
    )
    const data = unwrapData(response.data)

    return normalizeCarePlanDetail(data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeCarePlanDetail(
      mockSignCarePlan(clientId, planId, signature),
    )
  }
}

export async function updateOutcomeMeasureCurrentValue(
  clientId,
  planId,
  goalId,
  measureId,
  currentValue,
) {
  try {
    const body = {
      // eslint-disable-next-line camelcase
      current_value: parseOptionalNumber(currentValue),
    }
    const response = await apiInstance.patch(
      apiPaths.clientCarePlanMeasureCurrentValue(
        clientId,
        planId,
        goalId,
        measureId,
      ),
      body,
    )
    const data = unwrapData(response.data)

    return normalizeCarePlanDetail(data?.care_plan ?? data)
  } catch (error) {
    if (!useMockFallback(error)) {
      throw error
    }

    return normalizeCarePlanDetail(mockUpdateOutcomeMeasureCurrentValue(
      clientId,
      planId,
      goalId,
      measureId,
      parseOptionalNumber(currentValue),
    ))
  }
}

export function prepareCarePlanForSave(plan) {
  return refreshCarePlanProgress(plan)
}

export function apiErrorMessage(error) {
  const data = error?.response?.data
  const msg = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return typeof msg === 'string' ? msg : null
}
