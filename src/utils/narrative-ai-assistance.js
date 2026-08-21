import { isAssessmentPlanSection } from 'src/utils/assessment-plan.js'

export const hpiProblemsChronicFieldKey = 'HPI_PROBLEMS_CHRONIC'

export const hpiProblemsChronicContextSources = [
  'CHIEF_COMPLAINT',
  'ENCOUNTER_DIAGNOSES',
  'MEDICAL_HISTORY',
  'ACTIVE_MEDICATIONS',
  'ALLERGIES',
  'VITALS',
  'PROVIDER_INPUT',
]

export const hpiMedicationManagementFieldKey =
  'HPI_MEDICATION_MANAGEMENT'

export const hpiMedicationManagementContextSources = [
  'ENCOUNTER_DIAGNOSES',
  'ACTIVE_MEDICATIONS',
  'ALLERGIES',
  'PROVIDER_INPUT',
]

export const additionalNotesFieldKey = 'ADDITIONAL_NOTES'

export const additionalNotesContextSources = [
  'PROVIDER_INPUT',
  'CHIEF_COMPLAINT',
  'ENCOUNTER_DIAGNOSES',
]

export const planFieldKey = 'PLAN'

export const preventivePlanFieldKey = 'PREVENTIVE_PLAN'

export const intervalHpiFieldKey = 'INTERVAL_HPI'

export const clinicalAssessmentFieldKey = 'CLINICAL_ASSESSMENT'

export const interventionsFieldKey = 'INTERVENTIONS'

export const patientResponseFieldKey = 'PATIENT_RESPONSE'

export const sessionSummaryFieldKey = 'SESSION_SUMMARY'

export const targetedBehaviorsFieldKey = 'TARGETED_BEHAVIORS'

export const progressTowardsGoalsFieldKey = 'PROGRESS_TOWARDS_GOALS'

export const clientOwnWordsFieldKey = 'CLIENT_OWN_WORDS'

export const treatmentModalityFieldKey = 'TREATMENT_MODALITY'

export const sessionSummaryContextSources = [
  'PROVIDER_INPUT',
]

export const targetedBehaviorsContextSources = [
  'CARE_PLAN',
  'PROVIDER_INPUT',
]

export const progressTowardsGoalsContextSources = [
  'CARE_PLAN',
  'PROVIDER_INPUT',
]

export const clientOwnWordsContextSources = [
  'PROVIDER_INPUT',
]

export const treatmentModalityContextSources = [
  'PROVIDER_INPUT',
]

export const planNarrativeAiContextSources = [
  'PROVIDER_INPUT',
  'ENCOUNTER_DIAGNOSES',
  'ACTIVE_MEDICATIONS',
  'ALLERGIES',
]

export { assessmentSummaryContextSources } from
  'src/utils/assessment-summary.js'

export const narrativeAiProviderInputRequired = 'REQUIRED'
export const narrativeAiProviderInputOptional = 'OPTIONAL'

export const narrativeAiContextSources = [
  'CHIEF_COMPLAINT',
  'ENCOUNTER_DIAGNOSES',
  'MEDICAL_HISTORY',
  'SURGICAL_HISTORY',
  'FAMILY_HISTORY',
  'SOCIAL_HISTORY',
  'ACTIVE_MEDICATIONS',
  'ALLERGIES',
  'VITALS',
  'SCREENINGS',
  'ASSESSMENT_RESULTS',
  'DIAGNOSTIC_STUDIES',
  'FOLLOW_UP',
  'CARE_PLAN',
  'PROVIDER_INPUT',
]

const allowed = new Set(narrativeAiContextSources)

function parseJson(raw) {
  if (raw == null || raw === '') {
    return {}
  }
  if (typeof raw === 'object') {
    return raw
  }
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function parseNarrativeAiAssistance(raw) {
  const json = parseJson(raw)

  return json['ai_assistance'] === true || json.aiAssistance === true
}

export function parseNarrativeAiContextSources(raw) {
  const json = parseJson(raw)
  const list = Array.isArray(json['ai_context_sources'])
    ? json['ai_context_sources']
    : Array.isArray(json.aiContextSources)
      ? json.aiContextSources
      : []
  const unique = []
  for (const item of list) {
    const token = String(item ?? '').trim().toUpperCase()
    if (!allowed.has(token) || unique.includes(token)) {
      continue
    }
    unique.push(token)
  }

  return unique
}

export function parseNarrativeAiProviderInput(raw) {
  const json = parseJson(raw)
  const token = String(
    json.ai_provider_input ?? json.aiProviderInput ?? '',
  ).trim().toUpperCase()

  return token === narrativeAiProviderInputRequired
    ? narrativeAiProviderInputRequired
    : narrativeAiProviderInputOptional
}

export function isPlanNarrativeField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'plan' || key === 'plan_documentation'
}

export function isPreventivePlanField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'preventive_plan'
}

export function isIntervalHpiField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'interval_hpi' || key === 'subjective'
}

export function isClinicalAssessmentField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'clinical_assessment'
}

export function isInterventionsField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'interventions'
}

export function isPatientResponseField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'patient_response'
}

export function isSessionSummaryField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'session_summary'
}

export function isTargetedBehaviorsField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'targeted_behaviors'
}

export function isProgressTowardsGoalsField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'progress_towards_goals'
}

export function isClientOwnWordsField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'client_own_words'
}

export function isTreatmentModalityField(field = {}) {
  const key = String(field.fieldKey || field.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === 'treatment_modality'
}

export function fieldUsesCarePlanAiContext(field = {}) {
  return isProgressTowardsGoalsField(field)
    || isTargetedBehaviorsField(field)
}

export { isAssessmentSummaryField } from
  'src/utils/assessment-summary.js'

export function fieldAllowsNarrativeAi(field = {}) {
  const type = String(field.sectionType || '').toUpperCase()
  const allowedType = type === 'NARRATIVE_FIELD'
    || isAssessmentPlanSection(field)
  if (!allowedType) {
    return false
  }
  if (field.aiAssistanceEnabled === true) {
    return true
  }

  return parseNarrativeAiAssistance(
    field.configurationJson ?? field.configuration_json,
  )
}

export function fieldRequiresProviderInput(field = {}) {
  if (isAssessmentPlanSection(field)
    || isPlanNarrativeField(field)
    || isPreventivePlanField(field)
    || isClinicalAssessmentField(field)
    || isInterventionsField(field)
    || isPatientResponseField(field)
    || isSessionSummaryField(field)
    || isProgressTowardsGoalsField(field)
    || isClientOwnWordsField(field)
    || isTreatmentModalityField(field)) {
    return true
  }
  if (field.aiProviderInputRequired === true) {
    return true
  }

  return parseNarrativeAiProviderInput(
    field.configurationJson ?? field.configuration_json,
  ) === narrativeAiProviderInputRequired
}

export function serializeNarrativeFieldConfig({
  sectionGroup,
  aiAssistance,
  aiContextSources,
  aiProviderInputRequired,
} = {}) {
  const obj = {}
  const group = String(sectionGroup || '').trim().toUpperCase()
  if (/^[A-Z][A-Z0-9_]{0,30}$/.test(group)) {
    obj['section_group'] = group
  }
  if (aiAssistance) {
    obj['ai_assistance'] = true
    obj['ai_context_sources'] = parseNarrativeAiContextSources({
      aiContextSources,
    })
    obj['ai_provider_input'] = aiProviderInputRequired
      ? narrativeAiProviderInputRequired
      : narrativeAiProviderInputOptional
  }
  if (!Object.keys(obj).length) {
    return null
  }

  return JSON.stringify(obj)
}
