import { clinicalNoteStatuses } from 'components/constants.js'
import {
  formatClinicalNoteDateTimeDisplay,
  isoToClinicalNoteDateTime,
} from 'src/utils/clinical-note-datetime.js'

function trim(value) {
  return String(value ?? '').trim()
}

function normalizeStatus(status) {
  const token = trim(status).toUpperCase()
  if (token === clinicalNoteStatuses.signed) {
    return clinicalNoteStatuses.signed
  }

  return clinicalNoteStatuses.draft
}

function resolveClinicianLabel(clinician, clinicianOptions = []) {
  const clinicianId = clinician?.id ?? clinician?.clinician_id
  if (clinicianId != null) {
    const match = (clinicianOptions ?? []).find(
      option => Number(option.value) === Number(clinicianId),
    )
    if (match?.label) {
      return match.label
    }
  }
  const first = trim(
    clinician?.first_name ?? clinician?.firstName,
  )
  const last = trim(
    clinician?.last_name ?? clinician?.lastName,
  )
  const full = `${first} ${last}`.trim()
  if (full) {
    return full.startsWith('Dr.') ? full : `Dr. ${full}`
  }

  return clinicianId != null ? `Clinician #${clinicianId}` : '—'
}

export function clinicianInitialsFromLabel(label) {
  const parts = String(label ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`
      .toUpperCase()
  }
  if (parts.length === 1) {
    return (parts[0].slice(0, 2) || '?').toUpperCase()
  }

  return '?'
}

export function normalizeClinicalNoteSummary(
  row,
  clinicianOptions = [],
) {
  const noteDateTime = row?.note_date_time ?? row?.noteDateTime ?? ''
  const clinicianId = row?.clinician_id ?? row?.clinicianId ?? null
  const clinician = row?.clinician ?? null
  const subjective = trim(row?.subjective)
  const status = normalizeStatus(row?.status)

  return {
    id: row?.id,
    clientId: row?.client_id ?? row?.clientId ?? null,
    clinicianId,
    clinicianLabel: resolveClinicianLabel(
      clinician ?? { id: clinicianId },
      clinicianOptions,
    ),
    clinicianInitials: clinicianInitialsFromLabel(
      resolveClinicianLabel(
        clinician ?? { id: clinicianId },
        clinicianOptions,
      ),
    ),
    noteDateTime,
    noteDateTimeDisplay: formatClinicalNoteDateTimeDisplay(noteDateTime),
    subjective,
    summaryPreview: subjective.length > 120
      ? `${subjective.slice(0, 117)}…`
      : subjective || '—',
    status,
    signedAt: row?.signed_at ?? row?.signedAt ?? null,
    isDraft: status === clinicalNoteStatuses.draft,
    isSigned: status === clinicalNoteStatuses.signed,
  }
}

export function normalizeClinicalNoteDetail(
  row,
  clinicianOptions = [],
) {
  const summary = normalizeClinicalNoteSummary(row, clinicianOptions)
  const { date, time } = isoToClinicalNoteDateTime(summary.noteDateTime)

  return {
    ...summary,
    noteDate: date,
    noteTime: time,
    objective: trim(row?.objective),
    assessment: trim(row?.assessment),
    plan: trim(row?.plan),
    signatureData: row?.signature_data ?? row?.signatureData ?? '',
    createdAt: row?.created_at ?? row?.createdAt ?? null,
    updatedAt: row?.updated_at ?? row?.updatedAt ?? null,
  }
}

export function mapClinicalNotesListFromApi(
  list,
  clinicianOptions = [],
) {
  return (list ?? []).map(row =>
    normalizeClinicalNoteSummary(row, clinicianOptions),
  )
}

export function clinicalNoteToApiPayload(note) {
  const payload = {}
  if (note.clinicianId != null && note.clinicianId !== '') {
    // eslint-disable-next-line camelcase
    payload.clinician_id = Number(note.clinicianId)
  }
  if (note.noteDateTime) {
    // eslint-disable-next-line camelcase
    payload.note_date_time = note.noteDateTime
  }
  if (note.subjective != null) {
    payload.subjective = String(note.subjective)
  }
  if (note.objective != null) {
    payload.objective = String(note.objective)
  }
  if (note.assessment != null) {
    payload.assessment = String(note.assessment)
  }
  if (note.plan != null) {
    payload.plan = String(note.plan)
  }

  return payload
}
