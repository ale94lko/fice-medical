import { computed, watch } from 'vue'
import { clientAgeUnitValues } from 'components/constants.js'
import {
  ageAndUnitFromUsDateString,
  isCompleteUsDateString,
} from 'src/utils/client-form.js'

export function useAddClientAgeSync(
  form,
  dobKey,
  ageKey,
  ageUnitKey,
  options = {},
) {
  const ageFieldsLocked = computed(() => {
    const trimmed = String(form.value[dobKey] ?? '').trim()

    return trimmed.length > 0 && isCompleteUsDateString(trimmed)
  })

  function resolveAgeUnit(code) {
    const unit = String(code ?? '').trim().toLowerCase()
    const fromCatalog = options.resolveAgeUnitCode?.(unit)
    if (fromCatalog != null && fromCatalog !== '') {
      return fromCatalog
    }

    return clientAgeUnitValues[unit] ?? clientAgeUnitValues.years
  }

  function syncAgeFromDob() {
    const trimmed = String(form.value[dobKey] ?? '').trim()
    if (!trimmed) {
      form.value[ageKey] = ''
      form.value[ageUnitKey] = resolveAgeUnit(clientAgeUnitValues.years)

      return
    }
    if (!isCompleteUsDateString(trimmed)) {
      return
    }
    const result = ageAndUnitFromUsDateString(trimmed)
    if (result == null) {
      return
    }
    form.value[ageKey] = String(result.age)
    form.value[ageUnitKey] = resolveAgeUnit(result.unit)
  }

  watch(
    () => form.value[dobKey],
    () => {
      syncAgeFromDob()
    },
    { immediate: true },
  )

  watch(
    () => options.watchAgeUnitOptions?.(),
    () => {
      const dob = String(form.value[dobKey] ?? '').trim()
      if (dob && isCompleteUsDateString(dob)) {
        syncAgeFromDob()

        return
      }
      const ageStr = String(form.value[ageKey] ?? '').trim()
      if (ageStr && Number.isFinite(Number(ageStr))) {
        const resolved = resolveAgeUnit(
          form.value[ageUnitKey] ?? clientAgeUnitValues.years,
        )
        if (resolved !== form.value[ageUnitKey]) {
          form.value[ageUnitKey] = resolved
        }
      }
    },
    { deep: true },
  )

  return { ageFieldsLocked, syncAgeFromDob }
}
