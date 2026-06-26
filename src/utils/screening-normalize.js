import { screeningFieldTypes } from 'components/constants.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { clinicianInitialsFromPersonName } from
  'src/utils/clinician-display.js'
import {
  normalizeQuestionClinicalMetadata,
  normalizeSectionClinicalMetadata,
  normalizeTemplateOptionList,
} from 'src/utils/screening-template-metadata.js'

export function normalizeTemplateQuestion(question) {
  const q = question ?? {}
  const fieldType = String(
    q.field_type ?? q.fieldType ?? screeningFieldTypes.text,
  ).trim().toLowerCase().replace(/-/g, '_')

  return {
    id: String(q.id ?? q.question_id ?? '').trim(),
    label: String(q.label ?? '').trim(),
    helpText: String(q.help_text ?? q.helpText ?? '').trim() || null,
    fieldType,
    required: Boolean(q.required),
    options: normalizeTemplateOptionList(
      q.options_json ?? q.options,
    ),
    displayOrder: Number(q.display_order ?? q.displayOrder ?? 0),
    clinicalMetadata: normalizeQuestionClinicalMetadata(q),
  }
}

export function normalizeTemplateSection(section) {
  const s = section ?? {}
  const questions = (s.questions ?? [])
    .map(normalizeTemplateQuestion)
    .filter(q => q.id && q.label)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    id: String(s.id ?? s.section_id ?? '').trim(),
    title: String(s.title ?? '').trim(),
    description: String(s.description ?? '').trim() || null,
    displayOrder: Number(s.display_order ?? s.displayOrder ?? 0),
    questions,
    clinicalMetadata: normalizeSectionClinicalMetadata(s),
  }
}

export function normalizeScreeningTemplate(template) {
  const t = template ?? {}
  const sections = (t.sections ?? [])
    .map(normalizeTemplateSection)
    .filter(s => s.id && s.title)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    id: String(t.id ?? t.template_id ?? '').trim(),
    name: String(t.name ?? '').trim(),
    description: String(t.description ?? '').trim() || null,
    category: String(t.category ?? '').trim() || null,
    status: String(t.status ?? 'active').trim().toLowerCase(),
    version: Number(t.version ?? 1),
    sections,
  }
}

export function normalizeScreeningTemplateSummary(template) {
  const t = normalizeScreeningTemplate(template)

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    status: t.status,
    version: t.version,
  }
}

export function normalizeScreeningAnswer(answer) {
  const a = answer ?? {}

  return {
    questionId: String(a.question_id ?? a.questionId ?? '').trim(),
    value: a.value ?? '',
  }
}

export function normalizeScreeningDetailFromRecord(record) {
  const raw = record ?? {}

  return {
    screening: normalizeScreeningRecord(raw),
    template: normalizeScreeningTemplate(raw.template ?? {}),
    answers: (raw.answers ?? []).map(normalizeScreeningAnswer),
  }
}

export function normalizeScreeningRecord(record) {
  const a = record ?? {}
  const screeningDateRaw = String(
    a.screening_date ?? a.screeningDate
      ?? a.assessment_date ?? a.assessmentDate ?? '',
  ).trim()

  return {
    id: String(a.id ?? a.screening_id ?? a.assessment_id ?? '').trim(),
    patientId: String(
      a.client_id ?? a.patient_id ?? a.patientId ?? '',
    ).trim(),
    templateId: String(a.template_id ?? a.templateId ?? '').trim(),
    templateName: String(
      a.template_name ?? a.templateName ?? a.template?.name ?? '',
    ).trim(),
    status: String(a.status ?? 'draft').trim().toLowerCase(),
    assignedClinicianId: String(
      a.assigned_clinician_id ?? a.assignedClinicianId ?? '',
    ).trim() || null,
    assignedClinicianName: String(
      a.assigned_clinician_name ?? a.assignedClinicianName ?? '',
    ).trim() || null,
    screeningDate: isoDateToUsDateString(screeningDateRaw)
      || screeningDateRaw,
    completedAt: a.completed_at ?? a.completedAt ?? null,
    createdAt: a.created_at ?? a.createdAt ?? null,
    weight: parseMeasurementField(a.weight),
    height: parseMeasurementField(a.height),
    bmi: parseMeasurementField(a.bmi),
  }
}

function resolveClinicianLabel(clinicianId, clinicianName, clinicianOptions) {
  if (clinicianId != null && clinicianId !== '') {
    const match = (clinicianOptions ?? []).find(
      option => Number(option.value) === Number(clinicianId),
    )
    if (match?.label) {
      return match.label
    }
  }

  const name = String(clinicianName ?? '').trim()
  if (name) {
    return name
  }

  return clinicianId != null && clinicianId !== ''
    ? `Clinician #${clinicianId}`
    : '—'
}

function resolveScreeningClinicianEntries(
  record,
  clinicianOptions = [],
) {
  const clinicianId = record?.assigned_clinician_id
    ?? record?.assignedClinicianId
    ?? null
  const clinician = record?.assigned_clinician
    ?? record?.assignedClinician
    ?? null
  const clinicianName = record?.assigned_clinician_name
    ?? record?.assignedClinicianName
    ?? null

  if (!clinicianId && !clinician && !clinicianName) {
    return []
  }

  const label = resolveClinicianLabel(
    clinicianId,
    clinicianName,
    clinicianOptions,
  )
  if (!label || label === '—') {
    return []
  }

  const labelParts = label.split(' - ')

  return [{
    id: clinicianId ?? clinician?.id ?? null,
    name: label,
    personName: labelParts[0]?.trim() || label,
    specialty: labelParts.length > 1
      ? labelParts.slice(1).join(' - ').trim()
      : '',
    initials: clinicianInitialsFromPersonName(
      labelParts[0]?.trim() || label,
    ),
  }]
}

export function normalizeScreeningSummary(record, clinicianOptions = []) {
  const summary = normalizeScreeningRecord(record)

  return {
    ...summary,
    clinicianEntries: resolveScreeningClinicianEntries(
      record,
      clinicianOptions,
    ),
  }
}

export function mapScreeningsListFromApi(list, clinicianOptions = []) {
  return (list ?? []).map(row =>
    normalizeScreeningSummary(row, clinicianOptions),
  )
}

export {
  findQuestionByClinicalKey,
  listMeasurementQuestions,
  normalizeTemplateOptionList,
  resolveAnswerClinicalValue,
} from 'src/utils/screening-template-metadata.js'

function parseMeasurementField(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}
