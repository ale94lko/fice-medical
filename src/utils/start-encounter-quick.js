import { encounterTypes } from 'components/constants.js'
import { resolveDefaultResponsibleClinicianOption } from
  'src/utils/care-plan-orders.js'
import { fetchAllCliniciansSelectOptions } from
  'src/utils/clinicians-api.js'
import {
  isTelemedicinePlaceOfService,
  listActivePlacesOfService,
  resolveDefaultPlaceOfServiceId,
} from 'src/utils/place-of-service-api.js'

function resolvePlaceOptionForType(type, placeOptions = []) {
  const options = Array.isArray(placeOptions) ? placeOptions : []
  if (!options.length) {
    return null
  }
  if (type === encounterTypes.telehealth) {
    const tele = options.find(opt =>
      isTelemedicinePlaceOfService(opt.raw),
    )

    return tele
      ?? options.find(
        opt => Number(opt.value)
          === Number(resolveDefaultPlaceOfServiceId(options)),
      )
      ?? options[0]
      ?? null
  }
  const office = options.find(opt =>
    String(opt.raw?.code ?? '').trim() === '11',
  )
  const defaultId = resolveDefaultPlaceOfServiceId(options)

  return options.find(opt => Number(opt.value) === Number(defaultId))
    ?? office
    ?? options[0]
    ?? null
}

/**
 * Build payload to start an encounter immediately from the type menu.
 * Appointment starts use only appointmentId (server fills the rest).
 */
export async function buildQuickStartEncounterPayload({
  encounterType = null,
  appointmentId = null,
  staffMember = null,
  clinicName = null,
} = {}) {
  if (appointmentId != null && String(appointmentId).trim() !== '') {
    return { appointmentId }
  }

  const type = String(encounterType ?? '').trim().toUpperCase()
  if (!type) {
    return null
  }

  const [cliniciansResult, placesResult] = await Promise.allSettled([
    fetchAllCliniciansSelectOptions(),
    listActivePlacesOfService(),
  ])
  const clinicianOptions = cliniciansResult.status === 'fulfilled'
    ? cliniciansResult.value
    : []
  const placeOptions = placesResult.status === 'fulfilled'
    ? placesResult.value
    : []

  const clinicianOption = resolveDefaultResponsibleClinicianOption(
    clinicianOptions,
    { staffMember },
  )
  const clinicianId = clinicianOption?.value != null
    ? clinicianOption.value
    : (
      staffMember?.isClinician && staffMember.id != null
        ? staffMember.id
        : null
    )
  if (clinicianId == null) {
    return {
      error: 'encounterClinicianRequired',
    }
  }

  const place = resolvePlaceOptionForType(type, placeOptions)
  const placeCode = String(place?.raw?.code ?? '').trim()
  if (!placeCode) {
    return {
      error: 'appointmentPlaceOfServiceRequired',
    }
  }

  const location = String(clinicName ?? '').trim()
    || String(place?.label ?? place?.raw?.name ?? '').trim()

  return {
    encounterType: type,
    clinicianId,
    placeOfServiceCode: placeCode,
    locationName: location || undefined,
    telemedicine: isTelemedicinePlaceOfService(place?.raw)
      || type === encounterTypes.telehealth,
  }
}
