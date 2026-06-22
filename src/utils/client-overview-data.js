import {
  clientContactTypeValues,
  clientFieldKeys as ck,
  clientFormSections,
  clientInsurancePriorityValues,
} from 'components/constants.js'
import {
  resolveClientListAllergySeverityLabel,
  resolveClientListAllergySeverityModifier,
  resolveClientListAllergyCardSeverityModifier,
  sortClientListAllergyItemsBySeverity,
} from 'src/utils/client-list-allergy-severity.js'
import { formatPhoneUs } from 'src/utils/client-contact-form.js'
import { visibleInsuranceProfiles } from 'src/utils/client-insurance.js'
import { sortVitalsEntriesDesc } from 'src/utils/client-vitals.js'
import { normalizeAppointment } from 'src/utils/appointment-normalize.js'
import { normalizeAssessmentRecord } from 'src/utils/assessment-normalize.js'
import { mapCarePlansListFromApi } from 'src/utils/care-plan-normalize.js'
import { mapClinicalNotesListFromApi } from
  'src/utils/clinical-note-normalize.js'
import { mapReferralsListFromApi } from 'src/utils/referral-normalize.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'
import {
  buildClientOverviewHeaderData,
} from 'src/utils/client-overview-header-data.js'
import { enrichSummariesWithDialogDetail } from
  'src/utils/client-overview-module-dialog.js'

export { buildClientOverviewHeaderData }

function trim(value) {
  return String(value ?? '').trim()
}

function asArray(value) {
  return Array.isArray(value) ? value : []
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
  }))
}

function vitalsToSummaryItems(entries) {
  return sortVitalsEntriesDesc(entries).map(entry => ({
    label: [entry.recordedDate, entry.recordedTime].map(trim).filter(Boolean)
      .join(' ') || '—',
    meta: [
      entry.systolic && entry.diastolic
        ? `${entry.systolic}/${entry.diastolic}`
        : '',
      entry.heartRate ? `${entry.heartRate} bpm` : '',
    ].filter(Boolean).join(' · '),
  }))
}

function resolvePrimaryPhone(contact) {
  const phone = (contact?.phones ?? []).find(
    item => trim(item?.number),
  )

  if (!phone) {
    return ''
  }

  return formatPhoneUs(trim(phone.number))
}

function resolvePrimaryEmail(contact) {
  const email = (contact?.emails ?? []).find(
    item => trim(item?.address),
  )

  return trim(email?.address)
}

function resolvePrimaryInsurance(insuranceSection) {
  const profiles = visibleInsuranceProfiles(insuranceSection)
  if (!profiles.length) {
    return null
  }

  const primary = profiles.find(
    profile => profile.priority === clientInsurancePriorityValues.primary,
  ) ?? profiles[0]

  return {
    payerName: trim(primary.payerName) || '—',
    memberId: trim(primary.memberId) || '—',
    status: trim(primary.status) || 'active',
    planName: trim(primary.planName),
  }
}

function hasEmergencyContact(contactSection) {
  return (contactSection?.otherContacts ?? []).some(other => {
    if (other?.deleted) {
      return false
    }

    return trim(other?.contactType) === clientContactTypeValues.emergency
      || trim(other?.contactType).toLowerCase() === 'emergency'
  })
}

export function buildClientOverviewMissingItems(form, t) {
  const items = []
  const insurance = form?.[clientFormSections.insurance]
  const contact = form?.[clientFormSections.contact]

  if (!resolvePrimaryInsurance(insurance)) {
    items.push(t('clientOverviewMissingInsurance'))
  }
  if (!hasEmergencyContact(contact)) {
    items.push(t('clientOverviewMissingEmergencyContact'))
  }

  return items
}

export function buildClientOverviewSidebar(
  form,
  t,
  appointmentDates = {},
) {
  const insurance = resolvePrimaryInsurance(
    form?.[clientFormSections.insurance],
  )

  return {
    insurance: insurance
      ? {
        payerName: insurance.payerName,
        memberId: insurance.memberId,
        status: insurance.status,
        missing: false,
      }
      : {
        payerName: '—',
        memberId: '—',
        status: '',
        missing: true,
      },
    billing: {
      balance: '$0.00',
      lastStatement: '—',
      paymentStatus: t('clientOverviewPaymentUpToDate'),
    },
    dates: {
      nextAppointment: appointmentDates.nextAppointment ?? '—',
      lastVisit: appointmentDates.lastVisit ?? '—',
      clientSince: trim(form?.[ck.admissionDate]) || '—',
    },
  }
}

function allergyItemsFromForm(allergiesSection) {
  if (allergiesSection?.noKnownAllergies) {
    return []
  }

  const entries = (allergiesSection?.entries ?? [])
    .filter(entry => !entry?.deleted && trim(entry?.allergy))

  return sortClientListAllergyItemsBySeverity(
    entries.map(entry => {
      const severityRaw = trim(entry.severity)
      const modifier = resolveClientListAllergySeverityModifier(severityRaw)
        ?? 'mild'
      const severityLabel = resolveClientListAllergySeverityLabel(
        severityRaw,
        modifier,
      )

      return {
        label: trim(entry.allergy),
        year: String(entry.startYear ?? '').trim(),
        severityModifier: modifier,
        severityLabel,
      }
    }),
  )
}

function listItemsFromEntries(entries, labelKey, metaKey = '') {
  return (entries ?? [])
    .filter(entry => !entry?.deleted)
    .map(entry => ({
      label: trim(entry[labelKey]),
      meta: metaKey ? trim(entry[metaKey]) : '',
    }))
    .filter(item => item.label)
}

function moduleSummary(
  count,
  items,
  documentedLabel,
  emptyLabel,
  extras = {},
) {
  return {
    count,
    summaryLabel: count > 0 ? documentedLabel : emptyLabel,
    items: items.slice(0, 3),
    allItems: items,
    ...extras,
  }
}

function summariesFromForm(form, t, rawClient = null) {
  const allergies = form?.[clientFormSections.allergies]
  const allergyItems = allergyItemsFromForm(allergies)
  const fmh = form?.[clientFormSections.familyMedicalHistory]
  const fmhItems = listItemsFromEntries(
    fmh?.entries,
    'medicalConditions',
    'familyRelationship',
  )
  const vitals = vitalsToSummaryItems(
    resolveVitalsEntries(form, rawClient),
  )
  const labs = (form?.[clientFormSections.labs] ?? []).map(lab => ({
    label: trim(lab.testName) || '—',
    meta: trim(lab.status) || trim(lab.resultDate),
  }))
  const followUps = (form?.[clientFormSections.followUps]?.entries ?? [])
    .filter(entry => !entry?.deleted)
    .map(entry => ({
      label: trim(entry.type) || trim(entry.notes) || '—',
      meta: trim(entry.dueDate) || trim(entry.status),
    }))
  const contact = form?.[clientFormSections.contact]
  const contactItems = []
  const phone = resolvePrimaryPhone(contact)
  const email = resolvePrimaryEmail(contact)
  if (phone) {
    contactItems.push({ label: phone, meta: t('phone') })
  }
  if (email) {
    contactItems.push({ label: email, meta: t('email') })
  }
  for (const other of contact?.otherContacts ?? []) {
    if (other?.deleted) {
      continue
    }
    const name = [
      other.firstName,
      other.lastName,
    ].map(trim).filter(Boolean).join(' ')
    if (name) {
      contactItems.push({
        label: name,
        meta: trim(other.contactType),
      })
    }
  }

  return {
    contact: moduleSummary(
      contactItems.length,
      contactItems,
      t('clientOverviewContactsDocumented', { count: contactItems.length }),
      t('clientOverviewNoContacts'),
    ),
    allergies: allergies?.noKnownAllergies
      ? moduleSummary(
        0,
        [{
          label: t('noKnownAllergiesLabel'),
          meta: '',
        }],
        t('clientOverviewNoKnownAllergies'),
        t('clientOverviewNoKnownAllergies'),
        { cardSeverityModifier: 'nka' },
      )
      : moduleSummary(
        allergyItems.length,
        allergyItems,
        t('clientOverviewAllergiesDocumented', {
          count: allergyItems.length,
        }),
        t('clientOverviewNoAllergies'),
        {
          cardSeverityModifier: resolveClientListAllergyCardSeverityModifier(
            allergyItems,
          ),
        },
      ),
    familyHistory: moduleSummary(
      fmhItems.length,
      fmhItems,
      t('clientOverviewFamilyHistoryDocumented', { count: fmhItems.length }),
      t('clientOverviewNoFamilyHistory'),
    ),
    vitals: moduleSummary(
      vitals.length,
      vitals,
      t('clientOverviewVitalsDocumented', { count: vitals.length }),
      t('clientOverviewNoVitals'),
    ),
    labs: moduleSummary(
      labs.length,
      labs,
      t('clientOverviewLabsDocumented', { count: labs.length }),
      t('clientOverviewNoLabs'),
    ),
    followUps: moduleSummary(
      followUps.length,
      followUps,
      t('clientOverviewFollowUpsDocumented', { count: followUps.length }),
      t('clientOverviewNoFollowUps'),
    ),
  }
}

function summariesFromRawClient(rawClient, t) {
  const carePlans = mapCarePlansListFromApi(
    rawClient?.care_plans ?? rawClient?.carePlans,
  )
  const referrals = mapReferralsListFromApi(rawClient?.referrals)
  const appointments = asArray(
    rawClient?.appointments ?? rawClient?.client_appointments,
  ).map(normalizeAppointment)
  const clinicalNotes = mapClinicalNotesListFromApi(
    asArray(rawClient?.clinical_notes ?? rawClient?.clinicalNotes),
  )
  const assessments = asArray(
    rawClient?.screenings ?? rawClient?.assessments,
  ).map(normalizeAssessmentRecord)

  const carePlanItems = carePlans.map(plan => ({
    label: trim(plan.name) || trim(plan.problem) || '—',
    meta: trim(plan.status),
  }))
  const referralItems = referrals.map(referral => ({
    label: trim(referral.referredToLabel)
      || trim(referral.referredByLabel)
      || trim(referral.referralNumber)
      || '—',
    meta: trim(referral.status),
  }))
  const appointmentItems = appointments.map(item => ({
    label: formatAppointmentLabel(item),
    meta: trim(item.appointmentTypeName) || trim(item.status),
  }))
  const clinicalNoteItems = clinicalNotes.map(note => ({
    label: trim(note.summaryPreview) || trim(note.clinicianLabel) || '—',
    meta: trim(note.noteDateTimeDisplay) || trim(note.status),
  }))
  const assessmentItems = assessments.map(item => ({
    label: trim(item.templateName) || trim(item.name) || '—',
    meta: trim(item.status) || trim(item.completedAt),
  }))

  return {
    carePlans: moduleSummary(
      carePlanItems.length,
      carePlanItems,
      t('clientOverviewCarePlansActive', { count: carePlanItems.length }),
      t('clientOverviewNoCarePlans'),
    ),
    referrals: moduleSummary(
      referralItems.length,
      referralItems,
      t('clientOverviewReferralsOpen', { count: referralItems.length }),
      t('clientOverviewNoReferrals'),
    ),
    appointments: moduleSummary(
      appointmentItems.length,
      appointmentItems,
      t('clientOverviewAppointmentsScheduled', {
        count: appointmentItems.length,
      }),
      t('clientOverviewNoAppointments'),
    ),
    clinicalNotes: moduleSummary(
      clinicalNoteItems.length,
      clinicalNoteItems,
      t('clientOverviewClinicalNotesDocumented', {
        count: clinicalNoteItems.length,
      }),
      t('clientOverviewNoClinicalNotes'),
    ),
    assessments: moduleSummary(
      assessmentItems.length,
      assessmentItems,
      t('clientOverviewAssessmentsDocumented', {
        count: assessmentItems.length,
      }),
      t('clientOverviewNoAssessments'),
    ),
    appointmentsRaw: appointments,
  }
}

function emptyRawClientSummaries(t) {
  return {
    carePlans: moduleSummary(
      0,
      [],
      t('clientOverviewCarePlansActive', { count: 0 }),
      t('clientOverviewNoCarePlans'),
    ),
    referrals: moduleSummary(
      0,
      [],
      t('clientOverviewReferralsOpen', { count: 0 }),
      t('clientOverviewNoReferrals'),
    ),
    appointments: moduleSummary(
      0,
      [],
      t('clientOverviewAppointmentsScheduled', { count: 0 }),
      t('clientOverviewNoAppointments'),
    ),
    clinicalNotes: moduleSummary(
      0,
      [],
      t('clientOverviewClinicalNotesDocumented', { count: 0 }),
      t('clientOverviewNoClinicalNotes'),
    ),
    assessments: moduleSummary(
      0,
      [],
      t('clientOverviewAssessmentsDocumented', { count: 0 }),
      t('clientOverviewNoAssessments'),
    ),
    appointmentsRaw: [],
  }
}

function comingSoonSummary(t) {
  return moduleSummary(0, [], t('tabComingSoon'), t('tabComingSoon'))
}

export function buildClientOverviewModuleSummaries(
  form,
  rawClient,
  t,
) {
  const formSummaries = summariesFromForm(form, t, rawClient)
  const rawSummaries = rawClient
    ? summariesFromRawClient(rawClient, t)
    : emptyRawClientSummaries(t)

  return enrichSummariesWithDialogDetail({
    ...formSummaries,
    carePlans: rawSummaries.carePlans,
    referrals: rawSummaries.referrals,
    appointments: rawSummaries.appointments,
    clinicalNotes: rawSummaries.clinicalNotes,
    assessments: rawSummaries.assessments,
    careTeam: comingSoonSummary(t),
    authorizations: comingSoonSummary(t),
    tasks: comingSoonSummary(t),
    billing: comingSoonSummary(t),
    claims: comingSoonSummary(t),
    payments: comingSoonSummary(t),
    attachments: comingSoonSummary(t),
    consents: comingSoonSummary(t),
    signedForms: comingSoonSummary(t),
    scannedDocs: comingSoonSummary(t),
    appointmentsRaw: rawSummaries.appointmentsRaw,
  }, form, rawClient, t)
}

function formatAppointmentLabel(item) {
  const raw = trim(item?.startAtUtc)
  if (!raw) {
    return '—'
  }

  const datePart = raw.slice(0, 10)

  return isoDateToUsDateString(datePart) || raw
}

export function resolveAppointmentDates(appointments = []) {
  const dated = (appointments ?? [])
    .map(item => ({
      date: formatAppointmentLabel(item),
      sortKey: trim(item.startAtUtc).slice(0, 10),
    }))
    .filter(item => item.sortKey)

  if (!dated.length) {
    return { nextAppointment: '', lastVisit: '' }
  }

  dated.sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)))
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = dated.find(item => String(item.sortKey) >= today)
  const past = [...dated].reverse().find(
    item => String(item.sortKey) < today,
  )

  return {
    nextAppointment: upcoming?.date ?? '',
    lastVisit: past?.date ?? dated[dated.length - 1]?.date ?? '',
  }
}

export function buildClientOverviewActivity(
  summaries,
  t,
) {
  const candidates = []

  for (const item of summaries.carePlans?.items ?? []) {
    candidates.push({
      icon: 'assignment_turned_in',
      label: t('clientOverviewActivityCarePlan', { name: item.label }),
      date: item.meta,
    })
  }
  for (const item of summaries.referrals?.items ?? []) {
    candidates.push({
      icon: 'share',
      label: t('clientOverviewActivityReferral', { name: item.label }),
      date: item.meta,
    })
  }
  for (const item of summaries.clinicalNotes?.items ?? []) {
    candidates.push({
      icon: 'description',
      label: t('clientOverviewActivityNote', { name: item.label }),
      date: item.meta,
    })
  }

  return candidates.slice(0, 5)
}

export function summaryForModule(summaries, module) {
  if (module.subTabKey) {
    return summaries?.[module.subTabKey] ?? summariesFromEmpty()
  }

  return summaries?.[module.tabKey] ?? summariesFromEmpty()
}

function summariesFromEmpty() {
  return {
    count: 0,
    summaryLabel: '',
    items: [],
    allItems: [],
  }
}
