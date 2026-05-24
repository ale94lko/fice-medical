import { computed, watch } from 'vue'
import { ageFromUsDateString } from 'src/utils/client-form.js'

export function useAddClientAgeSync(form, dobKey, ageKey) {
  const ageReadonly = computed(() => {
    const dob = String(form.value[dobKey] ?? '').trim()

    return dob.length > 0
  })

  watch(
    () => form.value[dobKey],
    dob => {
      const trimmed = String(dob ?? '').trim()
      if (!trimmed) {
        return
      }
      const age = ageFromUsDateString(trimmed)
      if (age != null) {
        form.value[ageKey] = String(age)
      }
    },
  )

  return { ageReadonly }
}
