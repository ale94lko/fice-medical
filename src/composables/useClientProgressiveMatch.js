import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { clientFieldKeys, clientFormSections } from 'components/constants.js'
import { fetchClientMatchCandidates } from 'src/utils/client-match-api.js'

const ck = clientFieldKeys

function trim(value) {
  return String(value ?? '').trim()
}

function watchSignature(form) {
  const contact = form?.[clientFormSections.contact] ?? {}
  const phoneSig = (contact.phones ?? [])
    .map(p => trim(p?.number))
    .join('|')
  const emailSig = (contact.emails ?? [])
    .map(e => trim(e?.address))
    .join('|')

  return [
    trim(form?.[ck.firstName]),
    trim(form?.[ck.lastName]),
    trim(form?.[ck.dob]),
    phoneSig,
    emailSig,
  ].join('\u0000')
}

export function useClientProgressiveMatch(form, isEnabled) {
  const rawMatches = ref([])
  const loading = ref(false)
  const fetchError = ref(false)
  const ignoredBanner = ref(false)
  const discardedPatientIds = ref(new Set())
  const openedAnyMatchForSaveGate = ref(false)
  let debounceTimer = null
  let requestSeq = 0

  const filteredMatches = computed(() => {
    const discard = discardedPatientIds.value

    return rawMatches.value.filter(m => !discard.has(m.patientId))
  })

  const hasActiveMatches = computed(
    () => filteredMatches.value.length > 0,
  )

  const highestMatchScore = computed(() => {
    let max = 0
    for (const m of filteredMatches.value) {
      const s = Number(m.matchScore) || 0
      if (s > max) {
        max = s
      }
    }

    return max
  })

  function resetDiscarded() {
    discardedPatientIds.value = new Set()
  }

  function discardMatch(patientId) {
    const next = new Set(discardedPatientIds.value)
    next.add(Number(patientId))
    discardedPatientIds.value = next
  }

  function markOpenedMatch() {
    openedAnyMatchForSaveGate.value = true
  }

  /** Stops all further match API calls for this add-client session. */
  function ignoreMatchesBanner() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    requestSeq += 1
    ignoredBanner.value = true
    rawMatches.value = []
    loading.value = false
    fetchError.value = false
  }

  async function runFetch() {
    if (!isEnabled.value) {
      rawMatches.value = []

      return
    }
    if (ignoredBanner.value) {
      return
    }
    const first = trim(form.value?.[ck.firstName])
    const last = trim(form.value?.[ck.lastName])
    if (!first || !last) {
      rawMatches.value = []

      return
    }

    const seq = ++requestSeq
    loading.value = true
    fetchError.value = false
    try {
      const { hasMatches, matches } = await fetchClientMatchCandidates(
        form.value,
      )
      if (seq !== requestSeq) {
        return
      }
      rawMatches.value = hasMatches ? matches : []
    } catch {
      if (seq === requestSeq) {
        fetchError.value = true
        rawMatches.value = []
      }
    } finally {
      if (seq === requestSeq) {
        loading.value = false
      }
    }
  }

  function scheduleFetch() {
    if (ignoredBanner.value) {
      return
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void runFetch()
    }, 450)
  }

  watch(
    () => (isEnabled.value ? watchSignature(form.value) : ''),
    () => {
      if (!isEnabled.value) {
        rawMatches.value = []

        return
      }
      if (ignoredBanner.value) {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }
        rawMatches.value = []

        return
      }
      const first = trim(form.value?.[ck.firstName])
      const last = trim(form.value?.[ck.lastName])
      if (!first || !last) {
        if (debounceTimer) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }
        rawMatches.value = []

        return
      }
      scheduleFetch()
    },
    { deep: true },
  )

  watch(isEnabled, enabled => {
    if (!enabled) {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
      rawMatches.value = []
      openedAnyMatchForSaveGate.value = false
      ignoredBanner.value = false
      resetDiscarded()
    }
  })

  onBeforeUnmount(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  function resetMatchSession() {
    rawMatches.value = []
    openedAnyMatchForSaveGate.value = false
    ignoredBanner.value = false
    resetDiscarded()
    fetchError.value = false
  }

  return {
    rawMatches,
    filteredMatches,
    loading,
    fetchError,
    hasActiveMatches,
    highestMatchScore,
    ignoredBanner,
    openedAnyMatchForSaveGate,
    ignoreMatchesBanner,
    discardMatch,
    markOpenedMatch,
    resetMatchSession,
  }
}
