import { apiInstance } from 'boot/axios'
import {
  apiPaths,
  carePlanGoalStatuses,
} from 'components/constants.js'
import {
  carePlanGoalToApiPayload,
  carePlanToApiPayload,
  interventionToApiPayload,
  mapCarePlansListFromApi,
  normalizeCarePlanDetail,
  normalizeCarePlanGoal,
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

function resolveMappedId(id, idMap) {
  if (id == null) {
    return id
  }
  const mapped = idMap.get(String(id))

  return mapped ?? id
}

async function persistGoalChildren(
  clientId,
  planId,
  goalId,
  goal,
  createOnly,
) {
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
    } else if (!createOnly) {
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
    } else if (!createOnly) {
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

async function persistGoalTree(
  clientId,
  planId,
  goal,
  idMap,
  patchExisting,
) {
  const payload = carePlanGoalToApiPayload({
    ...goal,
    replacesGoalId: resolveMappedId(goal.replacesGoalId, idMap),
  })
  let goalId = goal.id
  if (isTemporaryCarePlanId(goalId)) {
    const goalRes = await apiInstance.post(
      apiPaths.clientCarePlanGoals(clientId, planId),
      payload,
    )
    const createdId = unwrapData(goalRes.data)?.id ?? goalId
    idMap.set(String(goal.id), createdId)
    goal.id = createdId
    goalId = createdId
  } else if (patchExisting) {
    await apiInstance.patch(
      apiPaths.clientCarePlanGoalById(clientId, planId, goalId),
      payload,
    )
  }
  await persistGoalChildren(
    clientId,
    planId,
    goalId,
    goal,
    !patchExisting,
  )

  return goalId
}

async function syncCarePlanChildren(clientId, planId, plan) {
  const idMap = new Map()
  const goals = [...(plan.goals ?? [])]
  const replacedIds = new Set(
    goals
      .filter(goal => goal.replacesGoalId)
      .map(goal => String(goal.replacesGoalId)),
  )
  const newPlain = goals.filter(
    goal => isTemporaryCarePlanId(goal.id) && !goal.replacesGoalId,
  )
  const newReplace = goals.filter(
    goal => isTemporaryCarePlanId(goal.id) && goal.replacesGoalId,
  )
  const existing = goals.filter(goal => !isTemporaryCarePlanId(goal.id))

  for (const goal of newPlain) {
    await persistGoalTree(clientId, planId, goal, idMap, false)
  }
  for (const goal of newReplace) {
    await persistGoalTree(clientId, planId, goal, idMap, false)
  }
  for (const goal of existing) {
    if (replacedIds.has(String(goal.id))) {
      continue
    }
    await persistGoalTree(clientId, planId, goal, idMap, true)
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

export async function changeCarePlanStatus(
  clientId,
  planId,
  status,
  reason = '',
) {
  const body = { status }
  const trimmed = String(reason ?? '').trim()
  if (trimmed) {
    body.reason = trimmed
  }
  const response = await apiInstance.patch(
    apiPaths.clientCarePlanStatus(clientId, planId),
    body,
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

export async function createClientCarePlanGoal(clientId, planId, goal) {
  const response = await apiInstance.post(
    apiPaths.clientCarePlanGoals(clientId, planId),
    carePlanGoalToApiPayload(goal),
  )
  const data = unwrapData(response.data)

  return normalizeCarePlanGoal(data)
}

export async function updateClientCarePlanGoal(
  clientId,
  planId,
  goalId,
  goal,
) {
  const response = await apiInstance.patch(
    apiPaths.clientCarePlanGoalById(clientId, planId, goalId),
    carePlanGoalToApiPayload(goal),
  )
  const data = unwrapData(response.data)

  return normalizeCarePlanGoal(data)
}

export async function saveClientCarePlanGoalTree(clientId, planId, goal) {
  await persistGoalTree(
    clientId,
    planId,
    { ...goal },
    new Map(),
    false,
  )

  return fetchClientCarePlan(clientId, planId)
}

export async function discontinueClientCarePlanGoal(
  clientId,
  planId,
  goal,
  reason,
) {
  return updateClientCarePlanGoal(clientId, planId, goal.id, {
    ...goal,
    status: carePlanGoalStatuses.discontinued,
    discontinueReason: reason,
  })
}

export async function createClientCarePlanIntervention(
  clientId,
  planId,
  goalId,
  intervention,
) {
  const response = await apiInstance.post(
    apiPaths.clientCarePlanInterventions(clientId, planId, goalId),
    interventionToApiPayload(intervention),
  )

  return unwrapData(response.data)
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
