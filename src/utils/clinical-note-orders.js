import { clinicalNoteStatuses } from 'components/constants.js'
import {
  clinicalNoteDateTimeToIso,
  defaultClinicalNoteDateTime,
} from 'src/utils/clinical-note-datetime.js'
import { normalizeClinicalNoteDetail } from
  'src/utils/clinical-note-normalize.js'

export function isServerClinicalNoteId(id) {
  const num = Number(id)

  return Number.isFinite(num) && num > 0
}

export function createEmptyClinicalNote(clinicianId = null) {
  const { date, time } = defaultClinicalNoteDateTime()

  return normalizeClinicalNoteDetail({
    id: null,
    // eslint-disable-next-line camelcase
    clinician_id: clinicianId,
    // eslint-disable-next-line camelcase
    note_date_time: clinicalNoteDateTimeToIso(date, time),
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    // eslint-disable-next-line camelcase
    signature_data: '',
    status: clinicalNoteStatuses.draft,
  })
}

export function cloneClinicalNote(note) {
  return normalizeClinicalNoteDetail({ ...note })
}

export function isClinicalNoteEditable(note) {
  return normalizeClinicalNoteDetail(note).status
    === clinicalNoteStatuses.draft
}

export function isClinicalNoteSigned(note) {
  return normalizeClinicalNoteDetail(note).status
    === clinicalNoteStatuses.signed
}

export function clinicalNoteHasCompleteSoap(note) {
  const fields = [
    note?.subjective,
    note?.objective,
    note?.assessment,
    note?.plan,
  ]

  return fields.every(value => String(value ?? '').trim().length > 0)
}

export function prepareClinicalNoteForSave(
  note,
  { noteDate, noteTime } = {},
) {
  const prepared = cloneClinicalNote(note)
  if (noteDate && noteTime) {
    prepared.noteDateTime = clinicalNoteDateTimeToIso(noteDate, noteTime)
    prepared.noteDate = noteDate
    prepared.noteTime = noteTime
  }

  return prepared
}
