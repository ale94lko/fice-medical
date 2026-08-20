/* eslint-disable camelcase -- API payloads use snake_case */
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapData(body) {
  if (body?.data != null) {
    return body.data
  }

  return body
}

function unwrapList(raw) {
  if (Array.isArray(raw)) {
    return raw
  }
  if (Array.isArray(raw?.items)) {
    return raw.items
  }
  if (Array.isArray(raw?.content)) {
    return raw.content
  }

  return []
}

function trim(value) {
  return String(value ?? '').trim()
}

export function normalizeQualityMeasure(raw = {}) {
  return {
    id: raw.id ?? null,
    encounterId: raw.encounter_id ?? raw.encounterId ?? null,
    code: trim(raw.code ?? raw.measure_code ?? raw.measureCode),
    displayName: trim(raw.display_name ?? raw.displayName),
    displayOrder: Number(raw.display_order ?? raw.displayOrder ?? 0),
    addressed: Boolean(raw.addressed),
    addressedBy: raw.addressed_by ?? raw.addressedBy ?? null,
    addressedByName: trim(
      raw.addressed_by_name ?? raw.addressedByName,
    ),
    addressedAt: raw.addressed_at ?? raw.addressedAt ?? null,
    relatedType: trim(raw.related_type ?? raw.relatedType) || null,
    relatedId: raw.related_id ?? raw.relatedId ?? null,
  }
}

export async function listEncounterQualityMeasures(encounterId) {
  const response = await apiInstance.get(
    apiPaths.encounterQualityMeasures(encounterId),
  )

  return unwrapList(unwrapData(response.data))
    .map(normalizeQualityMeasure)
    .filter(row => row.code)
}

export async function addressEncounterQualityMeasure(
  encounterId,
  measureCode,
) {
  const response = await apiInstance.post(
    apiPaths.encounterQualityMeasures(encounterId),
    { measure_code: measureCode },
  )

  return normalizeQualityMeasure(unwrapData(response.data))
}

export async function removeEncounterQualityMeasure(
  encounterId,
  measureCode,
) {
  await apiInstance.delete(
    apiPaths.encounterQualityMeasureByCode(
      encounterId,
      measureCode,
    ),
  )
}
