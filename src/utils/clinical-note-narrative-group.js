export const narrativeSectionGroupHpi = 'HPI'
const sectionGroupKey = 'section_group'

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

export function parseNarrativeSectionGroup(raw) {
  const group = String(parseJson(raw)[sectionGroupKey] ?? '').trim()
    .toUpperCase()
  if (!/^[A-Z][A-Z0-9_]{0,30}$/.test(group)) {
    return ''
  }

  return group
}

export function serializeNarrativeSectionGroup(group) {
  const token = String(group || '').trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9_]{0,30}$/.test(token)) {
    return null
  }

  return JSON.stringify({
    [sectionGroupKey]: token,
  })
}

export function narrativeGroupHeadingKey(group) {
  if (String(group || '').toUpperCase() === narrativeSectionGroupHpi) {
    return 'encounterNarrativeGroupHpi'
  }

  return ''
}

export function fieldNarrativeSectionGroup(field = {}) {
  const explicit = String(
    field.sectionGroup ?? field.section_group ?? '',
  ).trim().toUpperCase()
  if (/^[A-Z][A-Z0-9_]{0,30}$/.test(explicit)) {
    return explicit
  }

  return parseNarrativeSectionGroup(
    field.configurationJson ?? field.configuration_json,
  )
}

export function groupNarrativeFields(fields = []) {
  const groups = []
  for (const field of fields) {
    const group = fieldNarrativeSectionGroup(field)
    const last = groups[groups.length - 1]
    if (group && last?.group === group) {
      last.fields.push(field)
      continue
    }
    groups.push({
      group,
      headingKey: narrativeGroupHeadingKey(group),
      fields: [field],
    })
  }

  return groups
}

export function groupGeneratedNoteSections(sections = []) {
  return groupNarrativeFields(sections.map(section => ({
    ...section,
    configurationJson: section.contentJson ?? section.content_json ?? '',
    sectionGroup: parseNarrativeSectionGroup(
      section.contentJson ?? section.content_json,
    ),
  })))
}
