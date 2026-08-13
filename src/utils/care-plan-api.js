import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
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
import { usDateToIso } from 'src/utils/client-form.js'
import { attachEncounterId } from 'src/utils/encounter-api.js'

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
}

export async function fetchClientCarePlan(
  clientId,
  planId,
  { includeDetails = true } = {},
) {
  const detailParams = {
    include_details: includeDetails, // eslint-disable-line camelcase
  }
  const response = await apiInstance.get(
    apiPaths.clientCarePlanById(clientId, planId),
    { params: detailParams },
  )
  const data = unwrapData(response.data)

  return normalizeCarePlanDetail(data)
}

export async function createClientCarePlan(clientId, plan) {
  const body = attachEncounterId(carePlanToApiPayload(plan), clientId)
  const response = await apiInstance.post(
    apiPaths.clientCarePlans(clientId),
    body,
  )
  const data = unwrapData(response.data)
  const planId = data?.id ?? data?.care_plan_id

  return syncCarePlanChildren(clientId, planId, plan)
}

export async function updateClientCarePlan(clientId, plan) {
  const planId = plan.id
  if (isTemporaryCarePlanId(planId)) {
    return createClientCarePlan(clientId, plan)
  }
  const body = carePlanToApiPayload(plan)
  await apiInstance.patch(
    apiPaths.clientCarePlanById(clientId, planId),
    body,
  )

  return syncCarePlanChildren(clientId, planId, plan)
}

export async function changeCarePlanStatus(clientId, planId, status) {
  const response = await apiInstance.patch(
    apiPaths.clientCarePlanStatus(clientId, planId),
    { status },
  )
  const data = unwrapData(response.data)

  return normalizeCarePlanSummary(data)
}

export async function signClientCarePlan(clientId, planId, signature) {
  const response = await apiInstance.post(
    apiPaths.clientCarePlanSign(clientId, planId),
    { signature },
  )
  const data = unwrapData(response.data)

  return normalizeCarePlanDetail(data)
}

export async function updateOutcomeMeasureCurrentValue(
  clientId,
  planId,
  goalId,
  measureId,
  currentValue,
  extras = {},
) {
  /* eslint-disable camelcase -- API snake_case */
  const body = {
    current_value: parseOptionalNumber(currentValue),
  }
  const measuredDateIso = usDateToIso(extras.measuredDate)
    || String(extras.measuredDateIso ?? '').trim()
    || null
  if (measuredDateIso) {
    body.measured_date = measuredDateIso
  }
  const notes = String(extras.notes ?? '').trim()
  if (notes) {
    body.notes = notes
  }
  /* eslint-enable camelcase */
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
