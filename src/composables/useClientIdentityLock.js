import { computed, ref } from 'vue'
import { clientFieldKeys } from 'components/constants.js'
import {
  hasSavedIdentityValue,
  identityOverrideFields,
  isIdentityFieldLocked,
  showIdentityAdminBadge,
  snapshotClientIdentity,
} from 'src/utils/client-identity-lock.js'

export function useClientIdentityLock({
  form,
  isEditMode,
  canOverride,
}) {
  const ck = clientFieldKeys
  const baseline = ref(null)

  function captureBaseline() {
    baseline.value = snapshotClientIdentity(form.value, ck)
  }

  function overrideFields() {
    if (!isEditMode.value) {
      return []
    }

    return identityOverrideFields(baseline.value, form.value, ck)
  }

  function hasOverrideChanges() {
    return overrideFields().length > 0
  }

  function isFieldLocked(field) {
    return isIdentityFieldLocked(
      baseline.value,
      field,
      isEditMode.value,
      Boolean(canOverride.value),
    )
  }

  function showAdminBadge(field) {
    return showIdentityAdminBadge(
      baseline.value,
      field,
      isEditMode.value,
    )
  }

  const firstNameLocked = computed(() => isFieldLocked('firstName'))
  const middleNameLocked = computed(() => isFieldLocked('middleName'))
  const lastNameLocked = computed(() => isFieldLocked('lastName'))
  const dobLocked = computed(() => isFieldLocked('dob'))
  const sexLocked = computed(() => isFieldLocked('sex'))
  const ssnLocked = computed(() => isFieldLocked('ssn'))

  const firstNameBadge = computed(() => showAdminBadge('firstName'))
  const middleNameBadge = computed(() => showAdminBadge('middleName'))
  const lastNameBadge = computed(() => showAdminBadge('lastName'))
  const dobBadge = computed(() => showAdminBadge('dob'))
  const sexBadge = computed(() => showAdminBadge('sex'))
  const ssnBadge = computed(() => showAdminBadge('ssn'))

  const hasSavedIdentity = computed(() =>
    hasSavedIdentityValue(baseline.value, 'firstName')
    || hasSavedIdentityValue(baseline.value, 'lastName')
    || hasSavedIdentityValue(baseline.value, 'dob')
    || hasSavedIdentityValue(baseline.value, 'sex')
    || hasSavedIdentityValue(baseline.value, 'ssn')
    || hasSavedIdentityValue(baseline.value, 'middleName'),
  )

  return {
    captureBaseline,
    hasOverrideChanges,
    overrideFields,
    firstNameLocked,
    middleNameLocked,
    lastNameLocked,
    dobLocked,
    sexLocked,
    ssnLocked,
    firstNameBadge,
    middleNameBadge,
    lastNameBadge,
    dobBadge,
    sexBadge,
    ssnBadge,
    hasSavedIdentity,
  }
}
