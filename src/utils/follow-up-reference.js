
import { followUpRelatedToValues } from 'components/constants.js'
import { isoDateToUsDateString } from 'src/utils/client-form.js'

function trim(value) {
  return String(value ?? '').trim()
}

function parseEntityId(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) && n > 0 ? n : null
}

function formatDisplayDate(value) {
  const raw = trim(value)
  if (!raw) {
    return ''
  }
  if (raw.includes('/')) {
    return raw
  }

  return isoDateToUsDateString(raw) || raw
}

function formatDateTime(value) {
  const raw = trim(value)
  if (!raw) {
    return ''
  }
  if (raw.includes('/')) {
    return raw
  }
  const datePart = raw.split('T')[0]

  return isoDateToUsDateString(datePart) || raw
}

export function parseFollowUpReference(value) {
  return parseEntityId(value)
}

export function followUpRelatedToRequiresReference(relatedTo) {
  const type = trim(relatedTo).toUpperCase()
  if (!type) {
    return false
  }

  return type !== followUpRelatedToValues.general
    && type !== followUpRelatedToValues.medication
}

export function buildLabReferenceOptions(labs = [], t) {
  return (labs ?? [])
    .map(lab => {
      const reference = parseEntityId(lab?.id ?? lab?.lab_id)
      if (reference == null) {
        return null
      }
      const name = trim(
        lab?.lab_name ?? lab?.labName ?? lab?.test_name ?? lab?.testName,
      )
      const status = trim(lab?.status)
      const orderedDate = formatDisplayDate(
        lab?.ordered_date ?? lab?.orderedDate,
      )
      const parts = [name, status].filter(Boolean)
      if (orderedDate) {
        parts.push(t('followUpReferenceOrdered', { date: orderedDate }))
      }

      return {
        reference,
        label: parts.join(' — ') || `#${reference}`,
        subtitle: name || undefined,
      }
    })
    .filter(Boolean)
}

export function buildReferralReferenceOptions(referrals = []) {
  return (referrals ?? [])
    .map(row => {
      const reference = parseEntityId(row?.id)
      if (reference == null) {
        return null
      }
      const number = trim(row?.referral_number ?? row?.referralNumber)
      const type = trim(row?.type ?? row?.referral_type ?? row?.referralType)
      const status = trim(row?.status)
      const head = number || `#${reference}`
      const parts = [head, type, status].filter(Boolean)

      return {
        reference,
        label: parts.join(' — '),
      }
    })
    .filter(Boolean)
}

export function buildCarePlanReferenceOptions(carePlans = [], t) {
  return (carePlans ?? [])
    .map(row => {
      const reference = parseEntityId(row?.id)
      if (reference == null) {
        return null
      }
      const name = trim(row?.name)
      const status = trim(row?.status)
      const startDate = formatDisplayDate(
        row?.start_date ?? row?.startDate,
      )
      const parts = [name, status].filter(Boolean)
      if (startDate) {
        parts.push(t('followUpReferenceStart', { date: startDate }))
      }

      return {
        reference,
        label: parts.join(' — ') || `#${reference}`,
      }
    })
    .filter(Boolean)
}

export function buildAuthorizationReferenceOptions(
  insuranceRows = [],
  formProfiles = [],
) {
  const options = []

  for (const row of insuranceRows ?? []) {
    const reference = parseEntityId(row?.id)
    if (reference == null) {
      continue
    }
    const payer = trim(row?.payer_plan_name ?? row?.payerPlanName)
    const memberId = trim(row?.member_id ?? row?.memberId)
    const parts = [payer, memberId].filter(Boolean)
    options.push({
      reference,
      label: parts.join(' — ') || `#${reference}`,
    })
  }

  for (const profile of formProfiles ?? []) {
    if (profile?.deleted) {
      continue
    }
    const reference = parseEntityId(profile?.apiId ?? profile?.id)
    if (reference == null) {
      continue
    }
    const payer = trim(profile?.payerName ?? profile?.planName)
    const memberId = trim(profile?.memberId)
    const parts = [payer, memberId].filter(Boolean)
    if (options.some(opt => opt.reference === reference)) {
      continue
    }
    options.push({
      reference,
      label: parts.join(' — ') || `#${reference}`,
    })
  }

  return options
}

export function buildClinicalNoteReferenceOptions(notes = []) {
  return (notes ?? [])
    .map(row => {
      const reference = parseEntityId(row?.id)
      if (reference == null) {
        return null
      }
      const status = trim(row?.status)
      const noteDate = formatDateTime(
        row?.note_date_time ?? row?.noteDateTime ?? row?.note_date,
      )
      const parts = [`Note #${reference}`, status, noteDate].filter(Boolean)

      return {
        reference,
        label: parts.join(' — '),
      }
    })
    .filter(Boolean)
}

export function buildAppointmentReferenceOptions(appointments = []) {
  return (appointments ?? [])
    .map(row => {
      const reference = parseEntityId(
        row?.appointment_id ?? row?.appointmentId ?? row?.id,
      )
      if (reference == null) {
        return null
      }
      const number = trim(
        row?.appointment_number ?? row?.appointmentNumber,
      )
      const status = trim(row?.status)
      const startAt = formatDateTime(
        row?.start_at_utc ?? row?.startAtUtc ?? row?.start_at,
      )
      const head = number || `#${reference}`
      const parts = [head, status, startAt].filter(Boolean)

      return {
        reference,
        label: parts.join(' — '),
      }
    })
    .filter(Boolean)
}

/**
 * @param {string|null|undefined} relatedTo
 * @param {object} context
 * @param {(key: string, params?: object) => string} t
 */
export function buildReferenceOptionsForRelatedTo(relatedTo, context = {}, t) {
  const type = trim(relatedTo).toUpperCase()
  const client = context.client ?? {}

  switch (type) {
    case followUpRelatedToValues.labExam:
      return buildLabReferenceOptions(
        context.labs ?? client.labs ?? client.lab_orders ?? [],
        t,
      )
    case followUpRelatedToValues.referral:
      return buildReferralReferenceOptions(
        context.referrals ?? client.referrals ?? [],
      )
    case followUpRelatedToValues.carePlan:
      return buildCarePlanReferenceOptions(
        context.carePlans ?? client.care_plans ?? client.carePlans ?? [],
        t,
      )
    case followUpRelatedToValues.authorization:
      return buildAuthorizationReferenceOptions(
        context.insurance ?? client.insurance ?? client.insurances ?? [],
        context.insuranceProfiles ?? [],
      )
    case followUpRelatedToValues.clinicalNote:
      return buildClinicalNoteReferenceOptions(context.clinicalNotes ?? [])
    case followUpRelatedToValues.appointment:
      return buildAppointmentReferenceOptions(context.appointments ?? [])
    default:
      return []
  }
}

function findReferenceOption(reference, options = []) {
  const id = parseEntityId(reference)
  if (id == null) {
    return null
  }

  return (options ?? []).find(opt => opt.reference === id) ?? null
}

function resolveFromCollections(relatedTo, reference, context = {}, t) {
  const options = buildReferenceOptionsForRelatedTo(relatedTo, context, t)
  const match = findReferenceOption(reference, options)

  return match?.label ?? ''
}

/**
 * Resolves a human-readable label for follow-up reference in lists / read mode.
 */
export function resolveReferenceLabel(
  relatedTo,
  reference,
  context = {},
  extra = {},
  t = key => key,
) {
  const type = trim(relatedTo).toUpperCase()
  if (!type || !followUpRelatedToRequiresReference(type)) {
    return ''
  }
  const id = parseEntityId(reference)
  if (id == null) {
    return ''
  }

  const mergedContext = {
    ...context,
    clinicalNotes: extra.notes ?? extra.clinicalNotes
      ?? context.clinicalNotes ?? [],
    appointments: extra.appointments ?? context.appointments ?? [],
  }
  const label = resolveFromCollections(type, id, mergedContext, t)
  if (label) {
    return label
  }

  return `#${id}`
}

function followUpRelatedToLabelKey(relatedTo) {
  const suffix = String(relatedTo ?? '')
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

  return `followUpRelatedTo${suffix}`
}

export function resolveFollowUpRelatedDisplay(
  relatedTo,
  reference,
  context,
  extra,
  t,
  storedLabel = '',
) {
  const type = trim(relatedTo).toUpperCase()
  if (!type) {
    return ''
  }
  const typeLabel = t(followUpRelatedToLabelKey(type))
  if (!followUpRelatedToRequiresReference(type)) {
    return typeLabel
  }
  const refLabel = storedLabel
    || resolveReferenceLabel(type, reference, context, extra, t)

  return refLabel ? `${typeLabel}: ${refLabel}` : typeLabel
}

export function referenceLabelFromOptions(reference, options = []) {
  const match = findReferenceOption(reference, options)

  return match?.label ?? ''
}
