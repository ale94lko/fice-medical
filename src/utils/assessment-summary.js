export const assessmentSummaryFieldKey = 'ASSESSMENT_SUMMARY'
export const assessmentSummaryLegacyKey = 'assessment_summary'

export function isAssessmentSummaryField(field) {
  const source = field && typeof field === 'object' ? field : {}
  const key = String(
    source.fieldKey
    || source.sectionKey
    || source.section_key
    || source.field_key
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
