import { onBeforeUnmount, ref } from 'vue'
import { appointmentRecurrencePreviewDebounceMs }
  from 'components/constants.js'
import { previewRecurringAppointments }
  from 'src/utils/appointment-api.js'
import { mapRecurrencePreviewResponse }
  from 'src/utils/recurrence-preview.js'

export function useRecurrencePreview({ canLoad, buildPayload }) {
  const rows = ref([])
  const loading = ref(false)
  const failed = ref(false)
  let debounceTimer = null
  let requestSeq = 0
  let inflight = Promise.resolve()

  function clearDebounce() {
    if (!debounceTimer) {
      return
    }
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  function reset() {
    requestSeq += 1
    clearDebounce()
    rows.value = []
    loading.value = false
    failed.value = false
  }

  async function run(seq) {
    const work = (async() => {
      if (seq !== requestSeq) {
        return
      }
      if (!canLoad()) {
        rows.value = []
        loading.value = false
        failed.value = false

        return
      }
      loading.value = true
      failed.value = false
      try {
        const raw = await previewRecurringAppointments(
          buildPayload(),
        )
        if (seq !== requestSeq) {
          return
        }
        const mapped = mapRecurrencePreviewResponse(raw)
        rows.value = mapped.rows
        failed.value = mapped.rows.length === 0
      } catch {
        if (seq !== requestSeq) {
          return
        }
        rows.value = []
        failed.value = true
      } finally {
        if (seq === requestSeq) {
          loading.value = false
        }
      }
    })()
    inflight = work
    await work
  }

  function schedule() {
    requestSeq += 1
    const seq = requestSeq
    clearDebounce()
    if (!canLoad()) {
      rows.value = []
      loading.value = false
      failed.value = false

      return
    }
    loading.value = true
    failed.value = false
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void run(seq)
    }, appointmentRecurrencePreviewDebounceMs)
  }

  async function flush() {
    if (debounceTimer) {
      const seq = requestSeq
      clearDebounce()
      await run(seq)

      return
    }
    await inflight
  }

  onBeforeUnmount(() => {
    reset()
  })

  return {
    rows,
    loading,
    failed,
    schedule,
    flush,
    reset,
  }
}

