import {
  clientFormSections,
} from 'components/constants.js'
import { visibleInsuranceProfiles } from 'src/utils/client-insurance.js'

/**
 * Read-only Insurance panel model for Client Overview (Alt).
 */
export function buildClientOverviewAltInsurance(form, t) {
  const section = form?.[clientFormSections.insurance] ?? {}

  return {
    profiles: visibleInsuranceProfiles(section),
    emptyLabel: t('insuranceProfilesEmpty'),
  }
}
