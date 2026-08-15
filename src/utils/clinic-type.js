import { clinicTypeValues } from 'components/constants.js'

export const CLINIC_TYPE_I18N_KEYS = {
  [clinicTypeValues.primaryCare]: 'clinicTypePrimaryCare',
  [clinicTypeValues.specialty]: 'clinicTypeSpecialty',
  [clinicTypeValues.behavioralHealth]: 'clinicTypeBehavioralHealth',
  [clinicTypeValues.urgentCare]: 'clinicTypeUrgentCare',
  [clinicTypeValues.telehealth]: 'clinicTypeTelehealth',
  [clinicTypeValues.multiSpecialty]: 'clinicTypeMultiSpecialty',
}

export function clinicTypeSelectOptions(t) {
  return [
    clinicTypeValues.primaryCare,
    clinicTypeValues.specialty,
    clinicTypeValues.behavioralHealth,
    clinicTypeValues.urgentCare,
    clinicTypeValues.telehealth,
    clinicTypeValues.multiSpecialty,
  ].map(value => ({
    value,
    label: t(CLINIC_TYPE_I18N_KEYS[value]),
  }))
}

export function clinicTypeLabel(t, clinicType) {
  const key = CLINIC_TYPE_I18N_KEYS[clinicType]
  if (!key) {
    return String(clinicType ?? '').trim() || '—'
  }

  return t(key)
}
