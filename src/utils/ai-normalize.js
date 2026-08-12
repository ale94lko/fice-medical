import { aiFeatures, aiSuggestionStatuses } from 'components/constants.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function asObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStatusBlock(raw = {}) {
  const block = asObject(raw)

  return {
    status: trim(block.status) || 'not_documented',
    items: asArray(block.items),
  }
}

/**
 * @typedef {object} AiSuggestion
 * @property {number|null} id
 * @property {string} feature
 * @property {string} status
 * @property {string} provider
 * @property {string} model
 * @property {string} promptVersion
 * @property {string} createdAt
 * @property {number|null} createdBy
 * @property {object} result
 * @property {string} [acceptedAt]
 * @property {number|null} [acceptedBy]
 * @property {string} [rejectedAt]
 * @property {number|null} [rejectedBy]
 * @property {string} [rejectionReason]
 * @property {string|null} [committedToRecordAt]
 * @property {number|null} [clientId]
 * @property {number|null} [encounterId]
 */

export function normalizeAiSuggestion(raw = {}) {
  const row = asObject(raw)

  return {
    id: parseOptionalNumber(row.id),
    feature: trim(row.feature),
    status: trim(row.status) || aiSuggestionStatuses.pending,
    provider: trim(row.provider),
    model: trim(row.model),
    promptVersion: trim(
      row.prompt_version ?? row.promptVersion,
    ),
    createdAt: trim(row.created_at ?? row.createdAt),
    createdBy: parseOptionalNumber(row.created_by ?? row.createdBy),
    result: asObject(row.result),
    acceptedAt: trim(row.accepted_at ?? row.acceptedAt) || null,
    acceptedBy: parseOptionalNumber(row.accepted_by ?? row.acceptedBy),
    rejectedAt: trim(row.rejected_at ?? row.rejectedAt) || null,
    rejectedBy: parseOptionalNumber(row.rejected_by ?? row.rejectedBy),
    rejectionReason: trim(
      row.rejection_reason ?? row.rejectionReason,
    ) || null,
    committedToRecordAt: trim(
      row.committed_to_record_at ?? row.committedToRecordAt,
    ) || null,
    clientId: parseOptionalNumber(row.client_id ?? row.clientId),
    encounterId: parseOptionalNumber(
      row.encounter_id ?? row.encounterId,
    ),
  }
}

export function cloneAiResult(result) {
  try {
    return JSON.parse(JSON.stringify(asObject(result)))
  } catch {
    return { ...asObject(result) }
  }
}

export function normalizeAiConfig(raw = {}) {
  const row = asObject(raw)
  const prompts = asObject(row.prompts)

  return {
    enabled: row.enabled === true || row.enabled === 'true',
    provider: trim(row.provider),
    model: trim(row.model),
    prompts: {
      clinicalSoap: Number(
        prompts.clinical_soap ?? prompts.clinicalSoap ?? 1,
      ) || 1,
      icd10Suggestion: Number(
        prompts.icd10_suggestion ?? prompts.icd10Suggestion ?? 1,
      ) || 1,
      documentSummary: Number(
        prompts.document_summary ?? prompts.documentSummary ?? 1,
      ) || 1,
      clinicalSummary: Number(
        prompts.clinical_summary ?? prompts.clinicalSummary ?? 1,
      ) || 1,
      carePlanDraft: Number(
        prompts.care_plan_draft ?? prompts.carePlanDraft ?? 1,
      ) || 1,
    },
  }
}

export function aiConfigPromptsToApi(prompts = {}) {
  return {
    // eslint-disable-next-line camelcase -- API snake_case
    clinical_soap: Number(prompts.clinicalSoap) || 1,
    // eslint-disable-next-line camelcase -- API snake_case
    icd10_suggestion: Number(prompts.icd10Suggestion) || 1,
    // eslint-disable-next-line camelcase -- API snake_case
    document_summary: Number(prompts.documentSummary) || 1,
    // eslint-disable-next-line camelcase -- API snake_case
    clinical_summary: Number(prompts.clinicalSummary) || 1,
    // eslint-disable-next-line camelcase -- API snake_case
    care_plan_draft: Number(prompts.carePlanDraft) || 1,
  }
}

export function featureAllowsCommit(feature) {
  return feature === aiFeatures.soapDraft
    || feature === aiFeatures.icd10Suggest
    || feature === aiFeatures.carePlanDraft
}

export function isTerminalSuggestionStatus(status) {
  const s = trim(status).toUpperCase()

  return s === aiSuggestionStatuses.accepted
    || s === aiSuggestionStatuses.rejected
    || s === aiSuggestionStatuses.failed
    || s === aiSuggestionStatuses.expired
}

export function suggestionHasNotDocumentedRisk(result) {
  const data = asObject(result)
  const allergies = normalizeStatusBlock(data.allergies)
  const medications = normalizeStatusBlock(data.medications)

  return allergies.status === 'not_documented'
    || medications.status === 'not_documented'
}

export function normalizeIcdSuggestions(result) {
  const data = asObject(result)
  const list = asArray(data.suggestions)

  return list.map((item, index) => {
    const row = asObject(item)

    return {
      index,
      path: `suggestions[${index}]`,
      description: trim(row.description),
      suggestedCode: trim(
        row.suggested_code ?? row.suggestedCode,
      ),
      confidence: trim(row.confidence).toLowerCase() || 'medium',
      rationale: trim(row.rationale),
    }
  })
}
