import { computed, ref } from 'vue'
import {
  clinicBrowserTimezonesDiffer,
  clearSessionDisplayTzMode,
  getSessionDisplayTzMode,
  resolveBrowserTimeZone,
  resolveClinicTimeZone,
  setSessionDisplayTzMode,
} from 'src/utils/app-datetime.js'

const tick = ref(0)

export function bumpDisplayTimezoneTick() {
  tick.value += 1
}

export function clearSessionDisplayTimezone() {
  clearSessionDisplayTzMode()
  bumpDisplayTimezoneTick()
}

export function useSessionDisplayTimezone() {
  const mode = computed(() => {
    void tick.value

    return getSessionDisplayTzMode()
  })
  const clinicZone = computed(() => {
    void tick.value

    return resolveClinicTimeZone()
  })
  const browserZone = computed(() => resolveBrowserTimeZone())
  const mismatch = computed(() => clinicBrowserTimezonesDiffer())
  const usingBrowser = computed(() => mode.value === 'browser')
  const showBanner = computed(() => mismatch.value)

  function useBrowserZone() {
    setSessionDisplayTzMode('browser')
    bumpDisplayTimezoneTick()
  }

  function keepClinicZone() {
    setSessionDisplayTzMode('dismissed')
    bumpDisplayTimezoneTick()
  }

  function revertToClinicZone() {
    setSessionDisplayTzMode(null)
    bumpDisplayTimezoneTick()
  }

  return {
    mode,
    clinicZone,
    browserZone,
    mismatch,
    usingBrowser,
    showBanner,
    useBrowserZone,
    keepClinicZone,
    revertToClinicZone,
  }
}
