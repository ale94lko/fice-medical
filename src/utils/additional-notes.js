export const additionalNotesSectionKey = 'additional_notes'
export const additionalNotesCanonicalKey = 'ADDITIONAL_NOTES'

export function isAdditionalNotesSection(section = {}) {
  const key = String(
    section.sectionKey
    ?? section.fieldKey
    ?? section.section_key
    ?? section.field_key
    ?? '',
  ).trim().toLowerCase()

  return key === additionalNotesSectionKey
    || key.startsWith(`${additionalNotesSectionKey}_`)
}

export function nextAdditionalNotesSectionKey(sections = []) {
  const used = new Set(
    (Array.isArray(sections) ? sections : [])
      .map(section => String(section?.sectionKey ?? '').trim().toLowerCase())
      .filter(Boolean),
  )
  if (!used.has(additionalNotesSectionKey)) {
    return additionalNotesCanonicalKey
  }
  let suffix = 2
  while (used.has(`${additionalNotesSectionKey}_${suffix}`)) {
    suffix += 1
  }

  return `${additionalNotesSectionKey}_${suffix}`
}
