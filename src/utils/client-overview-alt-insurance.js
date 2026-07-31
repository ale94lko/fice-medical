import {
  clientFormSections,
} from 'components/constants.js'
import { visibleInsuranceProfiles } from 'src/utils/client-insurance.js'

function trim(value) {
  return String(value ?? '').trim()
}

function displayOrDash(value) {
  const text = trim(value)

  return text || '—'
}

/**
 * Read-only Insurance panel model for Client Overview (Alt).
 */
export function buildClientOverviewAltInsurance(form, t) {
  const section = form?.[clientFormSections.insurance] ?? {}
  const profiles = visibleInsuranceProfiles(section).map((profile, index) => ({
    key: profile.id || `insurance-${index}`,
    payerName: displayOrDash(
      [profile.payerName, profile.planName]
        .map(trim)
        .filter(Boolean)
        .join(' / '),
    ),
    memberId: displayOrDash(profile.memberId),
    priority: displayOrDash(profile.priority),
    insuranceType: displayOrDash(profile.insuranceType),
    status: displayOrDash(profile.status),
    effective: displayOrDash(profile.policyEffectiveDate),
    expiration: displayOrDash(profile.policyExpirationDate),
  }))

  return {
    profiles,
    emptyLabel: t('insuranceProfilesEmpty'),
  }
}
