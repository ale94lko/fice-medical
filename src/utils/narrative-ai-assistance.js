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

function asField(field) {
  return field && typeof field === 'object' ? field : {}
}

function narrativeFieldKey(field) {
  const source = asField(field)

  return String(source.fieldKey || source.sectionKey || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
}

export function isPlanNarrativeField(field) {
  const key = narrativeFieldKey(field)

  return key === 'plan' || key === 'plan_documentation'
}

export function isPreventivePlanField(field) {
  return narrativeFieldKey(field) === 'preventive_plan'
}

export function isIntervalHpiField(field) {
  const key = narrativeFieldKey(field)

  return key === 'interval_hpi' || key === 'subjective'
}

export function isClinicalAssessmentField(field) {
  return narrativeFieldKey(field) === 'clinical_assessment'
}

export function isInterventionsField(field) {
  return narrativeFieldKey(field) === 'interventions'
}

export function isPatientResponseField(field) {
  return narrativeFieldKey(field) === 'patient_response'
}

export function isSessionSummaryField(field) {
  return narrativeFieldKey(field) === 'session_summary'
}

export function isTargetedBehaviorsField(field) {
  return narrativeFieldKey(field) === 'targeted_behaviors'
}

export function isProgressTowardsGoalsField(field) {
  return narrativeFieldKey(field) === 'progress_towards_goals'
}

export function isClientOwnWordsField(field) {
  return narrativeFieldKey(field) === 'client_own_words'
}

export function isTreatmentModalityField(field) {
  return narrativeFieldKey(field) === 'treatment_modality'
}

export function fieldUsesCarePlanAiContext(field) {
  return isProgressTowardsGoalsField(field)
    || isTargetedBehaviorsField(field)
}

export { isAssessmentSummaryField } from
  'src/utils/assessment-summary.js'

export function fieldAllowsNarrativeAi(field) {
  const source = asField(field)
  const type = String(source.sectionType || '').toUpperCase()
  const allowedType = type === 'NARRATIVE_FIELD'
    || isAssessmentPlanSection(source)
  if (!allowedType) {
    return false
  }
  if (source.aiAssistanceEnabled === true) {
    return true
  }

  return parseNarrativeAiAssistance(
    source.configurationJson ?? source.configuration_json,
  )
}

export function fieldRequiresProviderInput(field) {
  const source = asField(field)
  if (isAssessmentPlanSection(source)
    || isPlanNarrativeField(source)
    || isPreventivePlanField(source)
    || isClinicalAssessmentField(source)
    || isInterventionsField(source)
    || isPatientResponseField(source)
    || isSessionSummaryField(source)
    || isProgressTowardsGoalsField(source)
    || isClientOwnWordsField(source)
    || isTreatmentModalityField(source)) {
    return true
  }
  if (source.aiProviderInputRequired === true) {
    return true
  }

  return parseNarrativeAiProviderInput(
    source.configurationJson ?? source.configuration_json,
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
