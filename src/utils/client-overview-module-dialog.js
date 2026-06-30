import { clientFormSections } from 'components/constants.js'
import {
  resolveClientListAllergySeverityLabel,
  resolveClientListAllergySeverityModifier,
  sortClientListAllergyItemsBySeverity,
} from 'src/utils/client-list-allergy-severity.js'
import { normalizeScreeningRecord } from 'src/utils/screening-normalize.js'
import { normalizeAppointment } from 'src/utils/appointment-normalize.js'
import {
  normalizeCarePlanDetail,
  normalizeCarePlanGoal,
} from 'src/utils/care-plan-normalize.js'
import { mapClinicalNotesListFromApi } from
  'src/utils/clinical-note-normalize.js'
import { mapFollowUpFromApi } from 'src/utils/client-follow-ups.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import { formatClinicianDisplayLabel } from 'src/utils/clinician-display.js'
import { normalizeLabDetail } from 'src/utils/lab-normalize.js'
import { normalizeReferralSummary } from 'src/utils/referral-normalize.js'
import { sortVitalsEntriesDesc } from 'src/utils/client-vitals.js'

function trim(value) {
  return String(value ?? '').trim()
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function display(value) {
  const text = trim(value)

  return text || '—'
}

function yesNo(t, value) {
  if (value === true) {
    return t('yes')
  }
  if (value === false) {
    return t('no')
  }

  return '—'
}

function field(labelKey, value) {
  return {
    labelKey,
    value: display(value),
  }
}

function buildTableDetail(columns, rows) {
  return {
    layout: 'table',
    columns,
    rows,
    records: [],
  }
}

function buildRecordsDetail(records) {
  return {
    layout: 'records',
    columns: [],
    rows: [],
    records,
  }
}

function emptyDialogDetail() {
  return {
    layout: 'table',
    columns: [],
    rows: [],
    records: [],
  }
}

function buildRecord(title, fields, sections = []) {
  return {
    title: display(title),
    fields: fields.filter(item => item.labelKey),
    sections,
  }
}

function buildGoalSections(goals = [], t) {
  return goals.map((goal, index) => {
    const normalized = goal.title
      ? goal
      : normalizeCarePlanGoal(goal)

    const measureRows = (normalized.outcomeMeasures ?? []).map(measure => ({
      measureName: display(measure.measureName),
      baseline: display(measure.baseline),
      currentValue: display(measure.currentValue),
      target: display(measure.target),
      unit: display(measure.unit),
      frequency: display(measure.frequency),
    }))

    const sections = []
    if (measureRows.length) {
      sections.push({
        titleKey: 'clientOverviewModuleDialogOutcomeMeasures',
        columns: [
          { key: 'measureName', labelKey: 'carePlanMeasureName' },
          { key: 'baseline', labelKey: 'carePlanMeasureBaseline' },
          {
            key: 'currentValue',
            labelKey: 'clientOverviewModuleDialogCurrentValue',
          },
          { key: 'target', labelKey: 'carePlanMeasureTarget' },
          { key: 'unit', labelKey: 'carePlanMeasureUnit' },
          { key: 'frequency', labelKey: 'carePlanMeasureFrequency' },
        ],
        rows: measureRows,
      })
    }

    const interventionRows = (normalized.interventions ?? []).map(item => ({
      title: display(item.title),
      frequency: display(item.frequency),
      clinician: display(item.responsibleClinicianName),
    }))
    if (interventionRows.length) {
      sections.push({
        titleKey: 'clientOverviewModuleDialogInterventions',
        columns: [
          { key: 'title', labelKey: 'carePlanInterventionTitle' },
          { key: 'frequency', labelKey: 'carePlanInterventionFrequency' },
          {
            key: 'clinician',
            labelKey: 'carePlanInterventionClinician',
          },
        ],
        rows: interventionRows,
      })
    }

    return {
      title: display(
        normalized.title
        || t('clientOverviewModuleDialogGoalTitle', { number: index + 1 }),
      ),
      fields: [
        field('status', normalized.status),
        field('carePlanPriority', normalized.priority),
        field('carePlanGoalBaseline', normalized.baseline),
        field('carePlanGoalTarget', normalized.target),
        field('carePlanGoalTargetDate', normalized.targetDate),
        field('carePlanGoalSuccessCriteria', normalized.successCriteria),
        field('description', normalized.description),
      ].filter(item => item.labelKey),
      sections,
    }
  })
}

function resolveVitalsEntries(form, rawClient) {
  const formEntries = asArray(
    form?.[clientFormSections.vitals]?.entries,
  ).filter(entry => !entry?.deleted)
  if (formEntries.length) {
    return formEntries
  }

  return asArray(rawClient?.vitals).map(entry => ({
    recordedDate: isoDateToUsDateString(
      entry.recorded_date ?? entry.recordedDate,
    ) || trim(entry.recorded_date ?? entry.recordedDate),
    recordedTime: trim(entry.recorded_time ?? entry.recordedTime),
    systolic: entry.systolic,
    diastolic: entry.diastolic,
    heartRate: entry.heart_rate ?? entry.heartRate,
    respiratoryRate: entry.respiratory_rate ?? entry.respiratoryRate,
    temperature: entry.temperature,
    oxygenSaturation: entry.oxygen_saturation ?? entry.oxygenSaturation,
    weight: entry.weight,
    height: entry.height,
    bmi: entry.bmi,
  }))
}

function buildAllergyListDetail(rows, extras = {}) {
  return {
    layout: 'allergy-list',
    columns: [],
    rows,
    records: [],
    ...extras,
  }
}

function buildAllergiesDialogDetail({ form, rawClient }) {
  const noKnown = Boolean(
    form?.[clientFormSections.allergies]?.noKnownAllergies
    ?? rawClient?.no_allergies,
  )
  if (noKnown) {
    return buildAllergyListDetail([], { noKnownAllergies: true })
  }

  const apiRows = asArray(rawClient?.allergies)
  const source = apiRows.length
    ? apiRows
    : asArray(form?.[clientFormSections.allergies]?.entries)
      .filter(entry => !entry?.deleted && trim(entry?.allergy))

  const rows = sortClientListAllergyItemsBySeverity(
    source.map(entry => {
      const severityRaw = trim(entry.severity)
      const modifier = resolveClientListAllergySeverityModifier(severityRaw)
        ?? 'mild'

      return {
        label: display(entry.name ?? entry.allergy),
        year: display(entry.year ?? entry.startYear),
        severityModifier: modifier,
        severityLabel: resolveClientListAllergySeverityLabel(
          severityRaw,
          modifier,
        ),
      }
    }),
  )

  return buildAllergyListDetail(rows)
}

function buildFamilyHistoryDialogDetail({ form, rawClient }) {
  const apiRows = asArray(rawClient?.medical_history)
  const source = apiRows.length
    ? apiRows
    : asArray(
      form?.[clientFormSections.familyMedicalHistory]?.entries,
    ).filter(entry => !entry?.deleted)

  const rows = source.map(entry => ({
    relationship: display(
      entry.relationship ?? entry.familyRelationship,
    ),
    condition: display(
      entry.medical_condition ?? entry.medicalConditions,
    ),
  }))

  return buildTableDetail(
    [
      { key: 'relationship', labelKey: 'fmhColRelationship' },
      { key: 'condition', labelKey: 'fmhColConditions' },
    ],
    rows,
  )
}

function buildVitalsDialogDetail({ form, rawClient }) {
  const rows = sortVitalsEntriesDesc(
    resolveVitalsEntries(form, rawClient),
  ).map(entry => ({
    recordedAt: [
      entry.recordedDate,
      entry.recordedTime,
    ].map(trim).filter(Boolean).join(' ') || '—',
    bloodPressure: entry.systolic && entry.diastolic
      ? `${entry.systolic}/${entry.diastolic}`
      : '—',
    heartRate: entry.heartRate ? `${entry.heartRate} bpm` : '—',
    respiratoryRate: entry.respiratoryRate
      ? `${entry.respiratoryRate}`
      : '—',
    temperature: display(entry.temperature),
    oxygenSaturation: entry.oxygenSaturation
      ? `${entry.oxygenSaturation}%`
      : '—',
    weight: display(entry.weight),
    height: display(entry.height),
    bmi: display(entry.bmi),
  }))

  return buildTableDetail(
    [
      { key: 'recordedAt', labelKey: 'vitalsDateTime' },
      { key: 'bloodPressure', labelKey: 'vitalsBloodPressure' },
      { key: 'heartRate', labelKey: 'vitalsHeartRate' },
      { key: 'respiratoryRate', labelKey: 'vitalsRespiratoryRate' },
      { key: 'temperature', labelKey: 'vitalsTemperature' },
      { key: 'oxygenSaturation', labelKey: 'vitalsOxygenSaturation' },
      { key: 'weight', labelKey: 'vitalsWeight' },
      { key: 'height', labelKey: 'vitalsHeight' },
      { key: 'bmi', labelKey: 'vitalsBmi' },
    ],
    rows,
  )
}

function buildLabsDialogDetail({ form, rawClient }) {
  const apiRows = asArray(rawClient?.labs)
  const source = apiRows.length
    ? apiRows.map(normalizeLabDetail)
    : asArray(form?.[clientFormSections.labs])

  const records = source.map(lab => buildRecord(
    lab.testName,
    [
      field('status', lab.status),
      field('labCategory', lab.category),
      field('labOrderedDate', lab.orderedDate),
      field('labCollectedDate', lab.collectedDate),
      field('labResultDate', lab.resultDate),
      field('labPriority', lab.priority),
      field('labSpecimenType', lab.specimenType),
      field('labCollectionLocation', lab.collectionLocation),
      field('labOrderingClinician', lab.orderingClinicianName),
      field('labResultSummary', lab.resultSummary),
      field('labReviewedBy', lab.reviewedBy),
      field('labReviewedDate', lab.reviewedDate),
    ],
    (lab.components ?? []).length
      ? [{
        titleKey: 'clientOverviewModuleDialogLabComponents',
        columns: [
          { key: 'name', labelKey: 'labComponentName' },
          { key: 'value', labelKey: 'labComponentValue' },
          { key: 'unit', labelKey: 'labComponentUnit' },
          { key: 'flag', labelKey: 'labComponentFlag' },
        ],
        rows: (lab.components ?? []).map(component => ({
          name: display(component.componentName),
          value: display(component.value),
          unit: display(component.unit),
          flag: display(component.flag),
        })),
      }]
      : [],
  ))

  return buildRecordsDetail(records)
}

function buildFollowUpsDialogDetail({ form, rawClient, t }) {
  const apiRows = asArray(rawClient?.follow_ups)
  const source = apiRows.length
    ? apiRows
    : asArray(form?.[clientFormSections.followUps]?.entries)
      .filter(entry => !entry?.deleted)

  const records = source.map(raw => {
    const entry = apiRows.length
      ? mapFollowUpFromApi(raw)
      : raw
    const providerName = formatClinicianDisplayLabel(
      raw.assigned_provider ?? raw.assignedProvider,
    )

    return buildRecord(
      entry.type || entry.notes || t('followUpType'),
      [
        field('followUpType', entry.type),
        field('followUpDueDate', entry.dueDate),
        field('status', entry.status),
        field('followUpPriority', entry.priority),
        field('assignedClinician', providerName),
        field('followUpRelatedTo', entry.relatedTo),
        field('followUpReference', entry.reference),
        field('notes', entry.notes),
        field(
          'clientOverviewModuleDialogReminderEnabled',
          yesNo(t, entry.reminderEnabled),
        ),
        field('followUpReminderValue', entry.reminderValue),
        field('followUpReminderUnit', entry.reminderUnit),
        field(
          'clientOverviewModuleDialogRemindAt',
          entry.remindAtUtc,
        ),
        field(
          'clientOverviewModuleDialogOverdue',
          yesNo(t, entry.overdue),
        ),
      ],
    )
  })

  return buildRecordsDetail(records)
}

function buildReferralsDialogDetail({ rawClient, t }) {
  const records = asArray(rawClient?.referrals).map(raw => {
    const referral = normalizeReferralSummary(raw)
    const clinicianName = formatClinicianDisplayLabel(
      raw.assigned_clinician ?? raw.assignedClinician,
    )
    const documentRows = (
      referral.files ?? referral.documents ?? []
    ).map(doc => ({
      fileName: display(
        doc.originalFilename ?? doc.fileName ?? doc.name,
      ),
      uploadedAt: display(doc.uploadedAt),
    }))

    return buildRecord(
      referral.referralNumber || referral.reason,
      [
        field('referralColNumber', referral.referralNumber),
        field('status', referral.status),
        field('referralPriority', referral.priority),
        field('referralDate', referral.referralDate),
        field('referralType', referral.type),
        field('referralSourceCategory', referral.sourceCategory),
        field('referralReferringProvider', referral.referringProvider),
        field('referralReason', referral.reason),
        field('referralDiagnosisProblem', referral.diagnosisProblem),
        field('assignedClinician', clinicianName),
        field(
          'clientOverviewModuleDialogReferralScheduling',
          referral.schedulingLabel,
        ),
        field(
          'referralFollowUpRequired',
          yesNo(t, referral.followUpRequired),
        ),
        field('notes', referral.notes),
      ],
      documentRows.length
        ? [{
          titleKey: 'clientOverviewModuleDialogDocuments',
          columns: [
            {
              key: 'fileName',
              labelKey: 'clientOverviewModuleDialogFileName',
            },
            {
              key: 'uploadedAt',
              labelKey: 'clientOverviewModuleDialogUploadedAt',
            },
          ],
          rows: documentRows,
        }]
        : [],
    )
  })

  return buildRecordsDetail(records)
}

function formatProgress(progress) {
  if (!progress) {
    return '—'
  }
  const status = trim(progress.status)
  const percent = progress.percent
  if (percent != null && percent !== '') {
    return `${status} (${percent}%)`
  }

  return display(status)
}

function buildCarePlansDialogDetail({ rawClient, t }) {
  const records = asArray(
    rawClient?.care_plans ?? rawClient?.carePlans,
  ).map(raw => {
    const plan = normalizeCarePlanDetail(raw)

    return buildRecord(
      plan.name || plan.problem,
      [
        field('status', plan.status),
        field('carePlanProblem', plan.problem),
        field('description', plan.description),
        field('carePlanStartDate', plan.startDate),
        field('carePlanTargetDate', plan.targetDate),
        field('assignedClinician', plan.clinicianName),
        field('carePlanPriority', plan.priority),
        field(
          'clientOverviewModuleDialogCarePlanSigned',
          yesNo(t, plan.signed),
        ),
        field(
          'clientOverviewModuleDialogSignedAt',
          plan.signedAt,
        ),
        field(
          'clientOverviewModuleDialogCarePlanProgress',
          formatProgress(plan.progress),
        ),
      ],
      buildGoalSections(plan.goals, t),
    )
  })

  return buildRecordsDetail(records)
}

function buildScreeningsDialogDetail({ rawClient }) {
  const rows = asArray(rawClient?.screenings)
    .map(normalizeScreeningRecord)
    .map(item => ({
      templateName: display(item.templateName),
      status: display(item.status),
      screeningDate: display(item.screeningDate),
      completedAt: display(item.completedAt),
      weight: display(item.weight),
      height: display(item.height),
      bmi: display(item.bmi),
    }))

  return buildTableDetail(
    [
      { key: 'templateName', labelKey: 'screeningTemplateColumn' },
      { key: 'status', labelKey: 'status' },
      { key: 'screeningDate', labelKey: 'screeningDate' },
      {
        key: 'completedAt',
        labelKey: 'clientOverviewModuleDialogCompletedAt',
      },
      { key: 'weight', labelKey: 'screeningWeight' },
      { key: 'height', labelKey: 'screeningHeight' },
      { key: 'bmi', labelKey: 'screeningBmi' },
    ],
    rows,
  )
}

function buildClinicalNotesDialogDetail({ rawClient }) {
  const rows = mapClinicalNotesListFromApi(
    asArray(rawClient?.clinical_notes ?? rawClient?.clinicalNotes),
  ).map(note => ({
    summary: display(note.summaryPreview),
    clinician: display(note.clinicianLabel),
    dateTime: display(note.noteDateTimeDisplay),
    status: display(note.status),
  }))

  return buildTableDetail(
    [
      {
        key: 'summary',
        labelKey: 'clientOverviewModuleDialogClinicalNoteSummary',
      },
      { key: 'clinician', labelKey: 'assignedClinician' },
      { key: 'clinicalNoteDateTime', labelKey: 'clinicalNoteDateTime' },
      { key: 'status', labelKey: 'status' },
    ],
    rows,
  )
}

function buildAppointmentsDialogDetail({ rawClient }) {
  const rows = asArray(
    rawClient?.appointments ?? rawClient?.client_appointments,
  )
    .map(normalizeAppointment)
    .map(item => ({
      dateTime: display(item.startAtUtc),
      type: display(item.servicesLabel || item.appointmentTypeName),
      status: display(item.status),
      clinician: display(item.clinicianDisplayName),
      duration: item.durationMin ? `${item.durationMin} min` : '—',
      placeOfService: display(item.placeOfServiceName),
      notes: display(item.notes),
    }))

  return buildTableDetail(
    [
      { key: 'dateTime', labelKey: 'clientOverviewModuleDialogDateTime' },
      { key: 'type', labelKey: 'appointmentColServices' },
      { key: 'status', labelKey: 'status' },
      { key: 'clinician', labelKey: 'assignedClinician' },
      { key: 'duration', labelKey: 'appointmentDuration' },
      { key: 'placeOfService', labelKey: 'appointmentPlaceOfService' },
      { key: 'notes', labelKey: 'notes' },
    ],
    rows,
  )
}

const MODULE_DIALOG_BUILDERS = {
  allergies: buildAllergiesDialogDetail,
  familyHistory: buildFamilyHistoryDialogDetail,
  vitals: buildVitalsDialogDetail,
  labs: buildLabsDialogDetail,
  followUps: buildFollowUpsDialogDetail,
  referrals: buildReferralsDialogDetail,
  carePlans: buildCarePlansDialogDetail,
  screenings: buildScreeningsDialogDetail,
  clinicalNotes: buildClinicalNotesDialogDetail,
  appointments: buildAppointmentsDialogDetail,
}

export function buildOverviewModuleDialogDetail(
  moduleKey,
  context,
) {
  const builder = MODULE_DIALOG_BUILDERS[moduleKey]
  if (!builder) {
    return emptyDialogDetail()
  }

  return builder(context)
}

export function enrichSummariesWithDialogDetail(
  summaries,
  form,
  rawClient,
  t,
) {
  const context = { form, rawClient, t }
  const next = { ...summaries }

  for (const key of Object.keys(next)) {
    if (key === 'appointmentsRaw') {
      continue
    }
    const summary = next[key]
    if (!summary || typeof summary !== 'object') {
      continue
    }

    next[key] = {
      ...summary,
      dialogDetail: buildOverviewModuleDialogDetail(key, context),
    }
  }

  return next
}
