export function isClinicalNoteAssessmentSection(field = {}) {
  return String(field.sectionType ?? field.section_type ?? '')
    .toUpperCase() === 'ASSESSMENT'
}
