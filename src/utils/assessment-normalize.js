import { assessmentFieldTypes } from 'components/constants.js'
import {
  normalizeQuestionClinicalMetadata,
  normalizeSectionClinicalMetadata,
  normalizeTemplateOptionList,
} from 'src/utils/assessment-template-metadata.js'

export function normalizeTemplateQuestion(question) {
  const q = question ?? {}
  const fieldType = String(
    q.field_type ?? q.fieldType ?? assessmentFieldTypes.text,
  ).trim().toLowerCase()

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

export function normalizeAssessmentTemplate(template) {
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

export function normalizeAssessmentTemplateSummary(template) {
  const t = normalizeAssessmentTemplate(template)

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    status: t.status,
    version: t.version,
  }
}

export function normalizeAssessmentAnswer(answer) {
  const a = answer ?? {}

  return {
    questionId: String(a.question_id ?? a.questionId ?? '').trim(),
    value: a.value ?? '',
  }
}

export function normalizeAssessmentRecord(assessment) {
  const a = assessment ?? {}

  return {
    id: String(a.id ?? a.assessment_id ?? '').trim(),
    patientId: String(a.patient_id ?? a.patientId ?? '').trim(),
    templateId: String(a.template_id ?? a.templateId ?? '').trim(),
    templateName: String(a.template_name ?? a.templateName ?? '').trim(),
    status: String(a.status ?? 'draft').trim().toLowerCase(),
    assignedClinicianId: String(
      a.assigned_clinician_id ?? a.assignedClinicianId ?? '',
    ).trim() || null,
    assessmentDate: String(
      a.assessment_date ?? a.assessmentDate ?? '',
    ).trim(),
    completedAt: a.completed_at ?? a.completedAt ?? null,
    weight: parseMeasurementField(a.weight),
    height: parseMeasurementField(a.height),
    bmi: parseMeasurementField(a.bmi),
  }
}

export {
  findQuestionByClinicalKey,
  listMeasurementQuestions,
  normalizeTemplateOptionList,
  resolveAnswerClinicalValue,
} from 'src/utils/assessment-template-metadata.js'

function parseMeasurementField(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}
