import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  displayDateMask,
  displayDatePlaceholder,
  getAppDateTimeConfig,
  normalizeAppDateTimeConfig,
  quasarDatePickerMask,
} from 'src/utils/app-datetime.js'

export function useAppDateTime() {
  const authStore = useAuthStore()
  const { configData } = storeToRefs(authStore)

  const dateTimeConfig = computed(() =>
    normalizeAppDateTimeConfig(
      configData.value ?? getAppDateTimeConfig(),
    ),
  )

  const dateMask = computed(() => displayDateMask(dateTimeConfig.value))
  const datePlaceholder = computed(() =>
    displayDatePlaceholder(dateTimeConfig.value),
  )
  const datePickerMask = computed(() =>
    quasarDatePickerMask(dateTimeConfig.value),
  )

  return {
    dateTimeConfig,
    dateMask,
    datePlaceholder,
    datePickerMask,
  }
}
