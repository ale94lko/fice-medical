import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

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

export function normalizeClinicalNoteTemplateSection(raw = {}) {
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
    configurationJson:
      raw.configuration_json ?? raw.configurationJson ?? '',
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
      configuration_json: section.configurationJson || null,
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
