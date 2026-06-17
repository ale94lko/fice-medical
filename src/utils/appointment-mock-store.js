/* eslint-disable camelcase -- mock API uses snake_case */
import { appointmentStatuses } from 'components/constants.js'

const mockAppointmentsByClient = {}
const mockSlots = buildMockSlots()

function buildMockSlots() {
  const slots = []
  const base = new Date()
  base.setUTCHours(13, 0, 0, 0)
  for (let day = 0; day < 60; day += 1) {
    const dayStart = new Date(base)
    dayStart.setUTCDate(base.getUTCDate() + day)
    const times = [
      [13, 0, 13, 30],
      [13, 40, 14, 10],
      [14, 20, 14, 50],
      [15, 0, 15, 30],
    ]
    times.forEach(([sh, sm, eh, em], idx) => {
      const start = new Date(dayStart)
      start.setUTCHours(sh, sm, 0, 0)
      const end = new Date(dayStart)
      end.setUTCHours(eh, em, 0, 0)
      slots.push({
        slot_id: 1000 + day * 10 + idx,
        clinician_id: 12,
        appointment_type_id: 1,
        start_at_utc: start.toISOString(),
        end_at_utc: end.toISOString(),
        duration_min: 30,
        status: 'AVAILABLE',
      })
    })
  }

  return slots
}

function seedClientAppointments(clientId) {
  const key = String(clientId)
  if (mockAppointmentsByClient[key]?.length) {
    return mockAppointmentsByClient[key]
  }
  const start = new Date()
  start.setUTCDate(start.getUTCDate() + 2)
  start.setUTCHours(13, 0, 0, 0)
  const end = new Date(start)
  end.setUTCMinutes(30)
  mockAppointmentsByClient[key] = [
    {
      appointment_id: 501,
      appointment_number: 'APT-1718467200000-12',
      status: appointmentStatuses.confirmed,
      client_id: Number(clientId),
      clinician_id: 12,
      clinician_display_name: 'Dr. Sarah Mitchell',
      appointment_type_id: 1,
      appointment_type_code: 'FOLLOW_UP',
      appointment_type_name: 'Follow Up',
      slot_id: 1000,
      start_at_utc: start.toISOString(),
      end_at_utc: end.toISOString(),
      duration_min: 30,
      telemedicine: false,
      telemedicine_allowed: true,
      notes: null,
      referral_id: 123,
      referral_number: 'REF-000123',
      referral_label: 'REF-000123 – Dr. James Wilson',
    },
  ]

  return mockAppointmentsByClient[key]
}

export function mockListClientAppointments(clientId) {
  return seedClientAppointments(clientId)
}

export function mockGetAppointment(appointmentId) {
  for (const list of Object.values(mockAppointmentsByClient)) {
    const match = list.find(
      row => String(row.appointment_id) === String(appointmentId),
    )
    if (match) {
      return match
    }
  }

  return null
}

export function mockListAppointmentTypes() {
  return [
    {
      id: 1,
      code: 'FOLLOW_UP',
      name: 'Follow Up',
      default_duration_min: 30,
      telemedicine_allowed: true,
    },
    {
      id: 2,
      code: 'INITIAL_EVAL',
      name: 'Initial Evaluation',
      default_duration_min: 60,
      telemedicine_allowed: true,
    },
    {
      id: 3,
      code: 'THERAPY',
      name: 'Therapy Session',
      default_duration_min: 45,
      telemedicine_allowed: false,
    },
    {
      id: 4,
      code: 'MED_MGMT',
      name: 'Medication Management',
      default_duration_min: 20,
      telemedicine_allowed: true,
    },
  ]
}

export function mockListAppointmentClinicians() {
  return [
    { id: 12, display_name: 'Dr. Sarah Mitchell' },
    { id: 18, display_name: 'Dr. James Wilson' },
  ]
}

export function mockListSlots(params = {}) {
  let list = [...mockSlots]
  if (params.from_utc) {
    const fromMs = Date.parse(String(params.from_utc))
    if (Number.isFinite(fromMs)) {
      list = list.filter(row =>
        Date.parse(String(row.start_at_utc)) >= fromMs,
      )
    }
  }
  if (params.to_utc) {
    const toMs = Date.parse(String(params.to_utc))
    if (Number.isFinite(toMs)) {
      list = list.filter(row =>
        Date.parse(String(row.start_at_utc)) <= toMs,
      )
    }
  }
  if (params.appointment_type_id) {
    list = list.filter(
      row => row.appointment_type_id === Number(params.appointment_type_id),
    )
  }
  if (params.clinician_id) {
    list = list.filter(
      row => row.clinician_id === Number(params.clinician_id),
    )
  }

  return list
}

export function mockBookAppointment(body) {
  const appt = {
    appointment_id: Date.now(),
    appointment_number: `APT-${Date.now()}`,
    status: appointmentStatuses.pending,
    client_id: body.client_id,
    clinician_id: body.clinician_id ?? 12,
    clinician_display_name: 'Dr. Sarah Mitchell',
    appointment_type_id: 1,
    appointment_type_code: 'FOLLOW_UP',
    appointment_type_name: 'Follow Up',
    slot_id: body.slot_id,
    start_at_utc: mockSlots.find(s => s.slot_id === body.slot_id)
      ?.start_at_utc ?? new Date().toISOString(),
    end_at_utc: mockSlots.find(s => s.slot_id === body.slot_id)
      ?.end_at_utc ?? new Date().toISOString(),
    duration_min: 30,
    telemedicine: Boolean(body.telemedicine),
    telemedicine_allowed: true,
    notes: body.notes ?? null,
    referral_id: body.referral_id ?? null,
    referral_number: body.referral_id ? 'REF-000123' : null,
    referral_label: body.referral_id ? 'REF-000123 – Dr. James Wilson' : null,
  }
  const key = String(body.client_id)
  if (!mockAppointmentsByClient[key]) {
    mockAppointmentsByClient[key] = []
  }
  mockAppointmentsByClient[key].unshift(appt)

  return appt
}

export function mockListClientReferrals() {
  return [
    {
      id: 123,
      referral_number: 'REF-000123',
      referring_provider_name: 'Dr. James Wilson',
      label: 'REF-000123 – Dr. James Wilson',
    },
  ]
}

export function mockListClientCarePlans() {
  return [
    {
      id: 45,
      number: 'CP-00045',
      name: 'Anxiety Disorder',
      label: 'CP-00045 – Anxiety Disorder',
    },
  ]
}

export function mockPatchAppointment(appointmentId, body) {
  const row = mockGetAppointment(appointmentId)
  if (!row) {
    throw new Error('Appointment not found')
  }
  Object.assign(row, body)

  return row
}

export function mockLifecycleAppointment(appointmentId, status) {
  const row = mockGetAppointment(appointmentId)
  if (!row) {
    throw new Error('Appointment not found')
  }
  row.status = status

  return row
}

export function mockRescheduleAppointment(appointmentId, newSlotId) {
  const row = mockGetAppointment(appointmentId)
  if (!row) {
    throw new Error('Appointment not found')
  }
  const slot = mockSlots.find(s => s.slot_id === Number(newSlotId))
  if (slot) {
    row.slot_id = slot.slot_id
    row.start_at_utc = slot.start_at_utc
    row.end_at_utc = slot.end_at_utc
  }
  row.status = appointmentStatuses.rescheduled

  return row
}
