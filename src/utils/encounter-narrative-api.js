import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'

function unwrapData(body) {
  if (body?.data != null && typeof body.data === 'object') {
    return body.data
  }

  return body
}

export function normalizeEncounterNarrative(raw = {}) {
  const body = raw && typeof raw === 'object' ? raw : {}
  const fields = Array.isArray(body.fields) ? body.fields : []

  return {
    encounterId: body.encounter_id ?? body.encounterId ?? null,
    templateId: body.template_id ?? body.templateId ?? null,
    templateName: body.template_name ?? body.templateName ?? '',
    templateVersion: body.template_version ?? body.templateVersion ?? null,
    showTab: body.show_tab ?? body.showTab ?? fields.length > 0,
    warning: body.warning ?? '',
    requiredCount: body.required_count ?? body.requiredCount ?? 0,
    completedRequiredCount:
      body.completed_required_count ?? body.completedRequiredCount ?? 0,
    fields: fields.map(field => ({
      templateSectionId:
        field.template_section_id ?? field.templateSectionId ?? null,
      fieldKey: field.field_key ?? field.fieldKey ?? '',
      fieldLabel: field.field_label ?? field.fieldLabel ?? '',
      sectionType: field.section_type ?? field.sectionType ?? '',
      inputType: field.input_type ?? field.inputType ?? 'LONG_TEXT',
      required: Boolean(field.required),
      placeholder: field.placeholder ?? '',
      displayOrder: field.display_order ?? field.displayOrder ?? 0,
      valueText: field.value_text ?? field.valueText ?? '',
      valueJson: field.value_json ?? field.valueJson ?? '',
      configurationJson:
        field.configuration_json ?? field.configurationJson ?? '',
      version: field.version ?? 0,
    })),
  }
}

export function normalizeGeneratedClinicalNote(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null
  }
  const sections = Array.isArray(raw.sections) ? raw.sections : []

  return {
    id: raw.id ?? null,
    clientId: raw.client_id ?? raw.clientId ?? null,
    encounterId: raw.encounter_id ?? raw.encounterId ?? null,
    clinicianId: raw.clinician_id ?? raw.clinicianId ?? null,
    templateId: raw.template_id ?? raw.templateId ?? null,
    templateVersion: raw.template_version ?? raw.templateVersion ?? null,
    templateName: raw.template_name ?? raw.templateName ?? '',
    noteType: raw.note_type ?? raw.noteType ?? '',
    status: String(raw.status ?? '').toUpperCase(),
    generatedAt: raw.generated_at ?? raw.generatedAt ?? null,
    signedAt: raw.signed_at ?? raw.signedAt ?? null,
    noteDateTime: raw.note_date_time ?? raw.noteDateTime ?? null,
    generated: Boolean(raw.generated),
    generationFailed: Boolean(
      raw.generation_failed ?? raw.generationFailed,
    ),
    sections: sections.map(section => ({
      id: section.id ?? null,
      sectionKey: section.section_key ?? section.sectionKey ?? '',
      sectionLabel: section.section_label ?? section.sectionLabel ?? '',
      sectionType: section.section_type ?? section.sectionType ?? '',
      displayOrder: section.display_order ?? section.displayOrder ?? 0,
      contentText: section.content_text ?? section.contentText ?? '',
      contentJson: section.content_json ?? section.contentJson ?? '',
      sourceType: section.source_type ?? section.sourceType ?? '',
      sourceLabel: section.source_label ?? section.sourceLabel ?? '',
    })),
  }
}

export async function fetchEncounterNarrative(encounterId) {
  const response = await apiInstance.get(
    apiPaths.encounterNarrative(encounterId),
  )

  return normalizeEncounterNarrative(unwrapData(response.data))
}

export async function saveEncounterNarrative(encounterId, fields) {
  /* eslint-disable camelcase -- API payload */
  const response = await apiInstance.put(
    apiPaths.encounterNarrative(encounterId),
    {
      fields: fields.map(field => ({
        template_section_id: field.templateSectionId,
        field_key: field.fieldKey,
        value_text: field.valueText ?? null,
        value_json: field.valueJson || null,
        version: field.version ?? 0,
      })),
    },
  )

  return normalizeEncounterNarrative(unwrapData(response.data))
}

export async function fetchGeneratedClinicalNote(encounterId) {
  const response = await apiInstance.get(
    apiPaths.encounterClinicalNote(encounterId),
  )

  return normalizeGeneratedClinicalNote(unwrapData(response.data))
}

export async function regenerateClinicalNote(encounterId) {
  const response = await apiInstance.post(
    apiPaths.encounterClinicalNoteRegenerate(encounterId),
  )

  return normalizeGeneratedClinicalNote(unwrapData(response.data))
}

export async function retryGenerateClinicalNote(encounterId) {
  const response = await apiInstance.post(
    apiPaths.encounterClinicalNoteGenerate(encounterId),
  )

  return normalizeGeneratedClinicalNote(unwrapData(response.data))
}
