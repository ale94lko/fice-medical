import { ref, watch } from 'vue'
import { clientAgeUnitValues } from 'components/constants.js'
import {
  ageAndUnitFromUsDateString,
  dobUsDateFromAgeAndUnit,
  isCompleteUsDateString,
} from 'src/utils/client-form.js'

export function useAddClientAgeSync(
  form,
  dobKey,
  ageKey,
  ageUnitKey,
  options = {},
) {
  const syncingFromDob = ref(false)
  const syncingFromAge = ref(false)

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

  function syncDobFromAge() {
    const ageStr = String(form.value[ageKey] ?? '').trim()
    if (!ageStr) {
      return
    }
    const age = Number(ageStr)
    if (!Number.isFinite(age) || age < 0) {
      return
    }
    const unit = form.value[ageUnitKey]
    const dob = dobUsDateFromAgeAndUnit(age, unit)
    if (!dob) {
      return
    }
    form.value[dobKey] = dob
  }

  watch(
    () => form.value[dobKey],
    () => {
      if (syncingFromAge.value) {
        return
      }
      syncingFromDob.value = true
      try {
        syncAgeFromDob()
      } finally {
        syncingFromDob.value = false
      }
    },
    { immediate: true },
  )

  watch(
    () => [form.value[ageKey], form.value[ageUnitKey]],
    () => {
      if (syncingFromDob.value) {
        return
      }
      syncingFromAge.value = true
      try {
        syncDobFromAge()
      } finally {
        syncingFromAge.value = false
      }
    },
  )

  watch(
    () => options.watchAgeUnitOptions?.(),
    () => {
      const dob = String(form.value[dobKey] ?? '').trim()
      if (dob && isCompleteUsDateString(dob)) {
        syncingFromDob.value = true
        try {
          syncAgeFromDob()
        } finally {
          syncingFromDob.value = false
        }

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

  return { syncAgeFromDob, syncDobFromAge }
}
