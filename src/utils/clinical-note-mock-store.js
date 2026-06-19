/* eslint-disable camelcase -- mock persistence mirrors API snake_case */
import { clinicalNoteStatuses } from 'components/constants.js'
import {
  normalizeClinicalNoteDetail,
  normalizeClinicalNoteSummary,
} from 'src/utils/clinical-note-normalize.js'

const STORAGE_KEY = 'fice-clinical-notes-mock-v1'

let idCounter = 200

function nextId() {
  idCounter += 1

  return idCounter
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { notesByClient: {}, seededClients: {} }
    }
    const parsed = JSON.parse(raw)

    return {
      notesByClient: parsed?.notesByClient ?? {},
      seededClients: parsed?.seededClients ?? {},
    }
  } catch {
    return { notesByClient: {}, seededClients: {} }
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function buildSeedNotes(clientId) {
  const clinician = {
    id: 5,
    first_name: 'John',
    last_name: 'Smith',
    npi: '1234567890',
    specialty: 'Psychiatry',
  }

  return [
    normalizeClinicalNoteDetail({
      id: nextId(),
      client_id: Number(clientId) || clientId,
      clinician_id: 5,
      clinician,
      note_date_time: '2026-05-31T14:30:00.000Z',
      subjective: 'Patient reports persistent headache for 2 days.',
      objective: 'BP 120/80, afebrile, alert and oriented.',
      assessment: 'Tension headache, likely stress-related.',
      plan: 'Rest, hydration, follow up in 1 week if symptoms persist.',
      signature_data: null,
      status: clinicalNoteStatuses.draft,
      signed_at: null,
      created_at: '2026-05-31T14:00:00',
      updated_at: '2026-05-31T14:00:00',
    }),
    normalizeClinicalNoteDetail({
      id: nextId(),
      client_id: Number(clientId) || clientId,
      clinician_id: 5,
      clinician,
      note_date_time: '2026-05-20T10:15:00.000Z',
      subjective: 'Patient reports improved sleep and reduced anxiety.',
      objective: 'Vitals stable. Mood appears calm.',
      assessment: 'Anxiety improving with current treatment plan.',
      plan: 'Continue current medications. Reassess in 4 weeks.',
      signature_data:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
        + 'AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      status: clinicalNoteStatuses.signed,
      signed_at: '2026-05-20T10:20:00',
      created_at: '2026-05-20T10:10:00',
      updated_at: '2026-05-20T10:20:00',
    }),
  ]
}

function ensureClientNotes(clientId) {
  const state = loadState()
  const key = String(clientId)
  if (!state.seededClients[key]) {
    state.notesByClient[key] = buildSeedNotes(clientId)
    state.seededClients[key] = true
    saveState(state)
  }

  return state.notesByClient[key] ?? []
}

function writeNotes(clientId, notes) {
  const state = loadState()
  state.notesByClient[String(clientId)] = notes
  saveState(state)
}

function filterNotes(notes, params = {}) {
  let filtered = [...notes]
  const status = String(params.status ?? '').trim().toUpperCase()
  if (status) {
    filtered = filtered.filter(row => row.status === status)
  }
  const clinicianId = params.clinician_id ?? params.clinicianId
  if (clinicianId != null && clinicianId !== '') {
    filtered = filtered.filter(
      row => Number(row.clinicianId) === Number(clinicianId),
    )
  }
  const query = String(params.q ?? '').trim().toLowerCase()
  if (query) {
    filtered = filtered.filter(row => [
      row.subjective,
      row.objective,
      row.assessment,
      row.plan,
    ].some(value => String(value ?? '').toLowerCase().includes(query)))
  }

  filtered.sort((a, b) => Number(b.id) - Number(a.id))

  return filtered
}

export function mockListClinicalNotes(clientId, params = {}) {
  const notes = ensureClientNotes(clientId)
  const filtered = filterNotes(
    notes.map(row => normalizeClinicalNoteDetail(row)),
    params,
  )
  const limit = Number(params.limit) > 0 ? Number(params.limit) : 20
  const page = Number(params.page) >= 0 ? Number(params.page) : 0
  const offset = page * limit
  const items = filtered.slice(offset, offset + limit)
  const total = filtered.length

  return {
    items: items.map(row => normalizeClinicalNoteSummary(row)),
    pagination: {
      limit,
      offset,
      total,
      page,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export function mockGetClinicalNote(clientId, noteId) {
  const notes = ensureClientNotes(clientId)
  const found = notes.find(row => Number(row.id) === Number(noteId))
  if (!found) {
    throw new Error('Clinical note not found')
  }

  return normalizeClinicalNoteDetail(found)
}

export function mockCreateClinicalNote(clientId, payload) {
  const notes = ensureClientNotes(clientId)
  const created = normalizeClinicalNoteDetail({
    id: nextId(),
    client_id: Number(clientId) || clientId,
    clinician_id: payload.clinician_id,
    clinician: { id: payload.clinician_id },
    note_date_time: payload.note_date_time ?? new Date().toISOString(),
    subjective: payload.subjective ?? '',
    objective: payload.objective ?? '',
    assessment: payload.assessment ?? '',
    plan: payload.plan ?? '',
    signature_data: null,
    status: clinicalNoteStatuses.draft,
    signed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  notes.unshift(created)
  writeNotes(clientId, notes)

  return created
}

export function mockUpdateClinicalNote(clientId, noteId, payload) {
  const notes = ensureClientNotes(clientId)
  const index = notes.findIndex(row => Number(row.id) === Number(noteId))
  if (index < 0) {
    throw new Error('Clinical note not found')
  }
  const current = notes[index]
  if (current.status !== clinicalNoteStatuses.draft) {
    throw Object.assign(
      new Error('Only draft clinical notes can be modified or deleted'),
      { response: { status: 409 } },
    )
  }
  const updated = normalizeClinicalNoteDetail({
    ...current,
    clinician_id: payload.clinician_id ?? current.clinicianId,
    note_date_time: payload.note_date_time ?? current.noteDateTime,
    subjective: payload.subjective ?? current.subjective,
    objective: payload.objective ?? current.objective,
    assessment: payload.assessment ?? current.assessment,
    plan: payload.plan ?? current.plan,
    id: current.id,
    client_id: current.clientId,
    status: clinicalNoteStatuses.draft,
    updated_at: new Date().toISOString(),
  })
  notes[index] = updated
  writeNotes(clientId, notes)

  return updated
}

export function mockSignClinicalNote(clientId, noteId, signatureData) {
  const notes = ensureClientNotes(clientId)
  const index = notes.findIndex(row => Number(row.id) === Number(noteId))
  if (index < 0) {
    throw new Error('Clinical note not found')
  }
  const current = notes[index]
  if (current.status !== clinicalNoteStatuses.draft) {
    throw Object.assign(
      new Error('Only draft clinical notes can be signed'),
      { response: { status: 409 } },
    )
  }
  const signed = normalizeClinicalNoteDetail({
    ...current,
    signature_data: signatureData,
    status: clinicalNoteStatuses.signed,
    signed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  notes[index] = signed
  writeNotes(clientId, notes)

  return signed
}

export function mockDeleteClinicalNote(clientId, noteId) {
  const notes = ensureClientNotes(clientId)
  const current = notes.find(row => Number(row.id) === Number(noteId))
  if (!current) {
    throw new Error('Clinical note not found')
  }
  if (current.status !== clinicalNoteStatuses.draft) {
    throw Object.assign(
      new Error('Only draft clinical notes can be modified or deleted'),
      { response: { status: 409 } },
    )
  }
  writeNotes(
    clientId,
    notes.filter(row => Number(row.id) !== Number(noteId)),
  )
}

export function mockDownloadClinicalNote(clientId, noteId) {
  const note = mockGetClinicalNote(clientId, noteId)
  if (note.status !== clinicalNoteStatuses.signed) {
    throw new Error('Clinical note must be signed before download')
  }
  const text = [
    `Clinical Note #${note.id}`,
    `Date: ${note.noteDateTimeDisplay}`,
    `Clinician: ${note.clinicianLabel}`,
    '',
    'Subjective:',
    note.subjective,
    '',
    'Objective:',
    note.objective,
    '',
    'Assessment:',
    note.assessment,
    '',
    'Plan:',
    note.plan,
    '',
    '[electronic signature on file]',
  ].join('\n')

  return new Blob([text], { type: 'text/plain' })
}
