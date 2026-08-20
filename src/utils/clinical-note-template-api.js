import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import {
  parseStructuredDefinition,
  reviewOfSystemsDefinition,
} from 'src/utils/review-of-systems.js'
import { physicalExamDefinition } from 'src/utils/physical-exam.js'
import { mentalStatusExamDefinition } from
  'src/utils/mental-status-exam.js'
import { assessmentPlanDefinition } from
  'src/utils/assessment-plan.js'
import {
  parseNarrativeSectionGroup,
} from 'src/utils/clinical-note-narrative-group.js'
import {
  parseNarrativeAiAssistance,
  parseNarrativeAiContextSources,
  parseNarrativeAiProviderInput,
  serializeNarrativeFieldConfig,
  narrativeAiProviderInputRequired,
} from 'src/utils/narrative-ai-assistance.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

function unwrapList(body) {
  const data = unwrapData(body)
  if (Array.isArray(data)) {
    return data
  }

  return data?.items ?? data?.content ?? []
}

export function clinicalNoteTemplateApiErrorMessage(
  error,
  fallback = 'Request failed',
) {
  const data = error?.response?.data
  const message = data?.error_description
    ?? data?.message
    ?? data?.error
    ?? error?.message

  return String(message || fallback)
}

export function normalizeClinicalNoteTemplate(raw = {}) {
  const sections = Array.isArray(raw.sections) ? raw.sections : []

  return {
    id: raw.id ?? null,
    familyId: raw.family_id ?? raw.familyId ?? null,
    name: String(raw.name ?? '').trim(),
    description: String(raw.description ?? '').trim(),
    noteType: String(raw.note_type ?? raw.noteType ?? 'PROGRESS_NOTE'),
    status: String(raw.status ?? 'ACTIVE').toUpperCase(),
    version: raw.version ?? 1,
    systemTemplate: Boolean(raw.system_template ?? raw.systemTemplate),
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
    sections: sections.map(normalizeClinicalNoteTemplateSection),
  }
}

export function slugStructuredFieldKey(label) {
  const slug = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  return slug || 'field'
}

export function parseStructuredSectionFields(raw) {
  let parsed = raw
  if (typeof raw === 'string' && raw.trim()) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }
  }
  const list = Array.isArray(parsed?.fields)
    ? parsed.fields
    : (Array.isArray(parsed) ? parsed : [])

  const fields = list.map((item, index) => ({
    uid: `sf-${index}-${item.key || item.label || index}`,
    key: String(item.key || '').trim(),
    label: String(item.label || item.key || '').trim(),
  })).filter(item => item.label || item.key)

  return fields.length
    ? fields
    : [{ uid: 'sf-new', key: '', label: '' }]
}

export function serializeStructuredSectionConfig(sectionOrFields) {
  if (sectionOrFields && !Array.isArray(sectionOrFields)) {
    const definition = sectionOrFields.structuredDefinition
      || parseStructuredDefinition(sectionOrFields.configurationJson)
    if (definition === reviewOfSystemsDefinition
      || definition === physicalExamDefinition
      || definition === mentalStatusExamDefinition) {
      return JSON.stringify({
        definition,
      })
    }
    if (definition === assessmentPlanDefinition) {
      const obj = { definition }
      if (sectionOrFields.aiAssistance) {
        obj['ai_assistance'] = true
        obj['ai_context_sources'] = parseNarrativeAiContextSources({
          aiContextSources: sectionOrFields.aiContextSources,
        })
        obj['ai_provider_input'] = narrativeAiProviderInputRequired
      }

      return JSON.stringify(obj)
    }
  }
  const fields = Array.isArray(sectionOrFields)
    ? sectionOrFields
    : sectionOrFields?.structuredFields
  const used = new Set()
  const list = (fields || []).map(item => {
    const label = String(item.label || '').trim()
    if (!label) {
      return null
    }
    let key = slugStructuredFieldKey(item.key || label)
    let unique = key
    let suffix = 2
    while (used.has(unique)) {
      unique = `${key}_${suffix}`
      suffix += 1
    }
    used.add(unique)

    return { key: unique, label }
  }).filter(Boolean)

  return list.length ? JSON.stringify({ fields: list }) : null
}

export function normalizeClinicalNoteTemplateSection(raw = {}) {
  const configurationJson =
    raw.configuration_json ?? raw.configurationJson ?? ''

  return {
    id: raw.id ?? null,
    sectionKey: String(raw.section_key ?? raw.sectionKey ?? '').trim(),
    sectionType: String(raw.section_type
      ?? raw.sectionType ?? '').toUpperCase(),
    label: String(raw.label ?? '').trim(),
    displayOrder: raw.display_order ?? raw.displayOrder ?? 0,
    required: Boolean(raw.required),
    showWhenEmpty: raw.show_when_empty ?? raw.showWhenEmpty ?? true,
    dataSource: raw.data_source ?? raw.dataSource ?? '',
    inputType: raw.input_type ?? raw.inputType ?? '',
    placeholder: raw.placeholder ?? '',
    assessmentTemplateId:
      raw.assessment_template_id ?? raw.assessmentTemplateId ?? null,
    configurationJson,
    sectionGroup: parseNarrativeSectionGroup(configurationJson),
    aiAssistance: parseNarrativeAiAssistance(configurationJson),
    aiContextSources: parseNarrativeAiContextSources(configurationJson),
    aiProviderInputRequired: parseNarrativeAiProviderInput(
      configurationJson,
    ) === narrativeAiProviderInputRequired,
    structuredDefinition: parseStructuredDefinition(configurationJson),
    structuredFields: parseStructuredSectionFields(configurationJson),
    active: raw.active ?? true,
  }
}

export function buildClinicalNoteTemplateRequest(form = {}) {
  /* eslint-disable camelcase -- API payload */
  return {
    name: String(form.name ?? '').trim(),
    description: String(form.description ?? '').trim() || null,
    note_type: form.noteType || 'PROGRESS_NOTE',
    status: form.status || 'ACTIVE',
    sections: (form.sections || []).map((section, index) => ({
      section_key: section.sectionKey || null,
      section_type: section.sectionType,
      label: section.label,
      display_order: index + 1,
      required: Boolean(section.required),
      show_when_empty: section.showWhenEmpty !== false,
      data_source: section.dataSource || null,
      input_type: section.inputType || null,
      placeholder: section.placeholder || null,
      assessment_template_id: section.assessmentTemplateId || null,
      configuration_json: section.sectionType === 'STRUCTURED_SECTION'
        ? serializeStructuredSectionConfig(section)
        : serializeNarrativeFieldConfig({
          sectionGroup: section.sectionGroup,
          aiAssistance: section.aiAssistance,
          aiContextSources: section.aiContextSources,
          aiProviderInputRequired: section.aiProviderInputRequired,
        }),
      active: section.active !== false,
    })),
  }
}

export async function listClinicalNoteTemplates(params = {}) {
  const response = await apiInstance.get(apiPaths.clinicalNoteTemplates, {
    params: {
      status: params.status || undefined,
      q: params.search || undefined,
      include_sections: params.includeSections === true,
    },
  })

  return unwrapList(response.data).map(normalizeClinicalNoteTemplate)
}

export async function listActiveClinicalNoteTemplates() {
  const response = await apiInstance.get(
    apiPaths.clinicalNoteTemplatesActive,
  )

  return unwrapList(response.data).map(normalizeClinicalNoteTemplate)
}

export async function fetchClinicalNoteTemplate(id) {
  const response = await apiInstance.get(apiPaths.clinicalNoteTemplateById(id))

  return normalizeClinicalNoteTemplate(unwrapData(response.data))
}

export async function createClinicalNoteTemplate(form) {
  const response = await apiInstance.post(
    apiPaths.clinicalNoteTemplates,
    buildClinicalNoteTemplateRequest(form),
  )

  return normalizeClinicalNoteTemplate(unwrapData(response.data))
}

export async function updateClinicalNoteTemplate(id, form) {
  const response = await apiInstance.patch(
    apiPaths.clinicalNoteTemplateById(id),
    buildClinicalNoteTemplateRequest(form),
  )

  return normalizeClinicalNoteTemplate(unwrapData(response.data))
}

export async function duplicateClinicalNoteTemplate(id) {
  const response = await apiInstance.post(
    apiPaths.clinicalNoteTemplateDuplicate(id),
  )

  return normalizeClinicalNoteTemplate(unwrapData(response.data))
}

export async function updateClinicalNoteTemplateStatus(id, status) {
  const response = await apiInstance.patch(
    apiPaths.clinicalNoteTemplateStatus(id),
    { status },
  )

  return normalizeClinicalNoteTemplate(unwrapData(response.data))
}
