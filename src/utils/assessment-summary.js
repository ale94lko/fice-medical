export const assessmentSummaryFieldKey = 'ASSESSMENT_SUMMARY'
export const assessmentSummaryLegacyKey = 'assessment_summary'

export function isAssessmentSummaryField(field = {}) {
  const key = String(
    field.fieldKey
    || field.sectionKey
    || field.section_key
    || field.field_key
    || '',
  )
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')

  return key === assessmentSummaryLegacyKey
}

export const assessmentSummaryContextSources = [
  'ASSESSMENT_RESULTS',
  'PROVIDER_INPUT',
]
