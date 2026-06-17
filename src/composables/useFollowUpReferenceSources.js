import { computed, ref, unref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiInstance } from 'boot/axios'
import { apiPaths, followUpRelatedToValues } from 'components/constants.js'
import { extractEnvelopeList } from 'components/helpers.js'
import {
  buildReferenceOptionsForRelatedTo,
  resolveReferenceLabel,
  resolveFollowUpRelatedDisplay,
} from 'src/utils/follow-up-reference.js'

function extractListFromResponse(data) {
  const root = data?.data ?? data
  if (Array.isArray(root)) {
    return root
  }

  return extractEnvelopeList(root) ?? []
}

export function useFollowUpReferenceSources(clientId, referenceContext) {
  const { t } = useI18n()
  const clinicalNotes = ref([])
  const appointments = ref([])
  const notesLoading = ref(false)
  const appointmentsLoading = ref(false)
  const notesLoaded = ref(false)
  const appointmentsLoaded = ref(false)
  const activeRelatedTo = ref(null)

  const resolvedClientId = computed(() =>
    String(unref(clientId) ?? '').trim(),
  )

  const contextSnapshot = computed(() => {
    const ctx = unref(referenceContext) ?? {}

    return {
      ...ctx,
      clinicalNotes: clinicalNotes.value,
      appointments: appointments.value,
    }
  })

  const referenceLoading = computed(() =>
    notesLoading.value || appointmentsLoading.value,
  )

  const referenceOptions = computed(() =>
    buildReferenceOptionsForRelatedTo(
      activeRelatedTo.value,
      contextSnapshot.value,
      t,
    ),
  )

  async function loadClinicalNotes() {
    const id = resolvedClientId.value
    if (!id || notesLoaded.value) {
      return
    }
    notesLoading.value = true
    try {
      const response = await apiInstance.get(
        apiPaths.clientClinicalNotes(id),
      )
      clinicalNotes.value = extractListFromResponse(response.data)
      notesLoaded.value = true
    } catch {
      clinicalNotes.value = []
    } finally {
      notesLoading.value = false
    }
  }

  async function loadAppointments() {
    const id = resolvedClientId.value
    if (!id || appointmentsLoaded.value) {
      return
    }
    appointmentsLoading.value = true
    try {
      const response = await apiInstance.get(
        apiPaths.clientAppointments(id),
      )
      appointments.value = extractListFromResponse(response.data)
      appointmentsLoaded.value = true
    } catch {
      appointments.value = []
    } finally {
      appointmentsLoading.value = false
    }
  }

  async function ensureLoadedForRelatedTo(relatedTo) {
    const type = String(relatedTo ?? '').trim().toUpperCase()
    activeRelatedTo.value = type || null
    if (type === followUpRelatedToValues.clinicalNote) {
      await loadClinicalNotes()
    }
    if (type === followUpRelatedToValues.appointment) {
      await loadAppointments()
    }
  }

  function resolveRelatedDisplay(relatedTo, reference, storedLabel = '') {
    if (storedLabel) {
      return resolveFollowUpRelatedDisplay(
        relatedTo,
        reference,
        contextSnapshot.value,
        {},
        t,
        storedLabel,
      )
    }

    return resolveFollowUpRelatedDisplay(
      relatedTo,
      reference,
      contextSnapshot.value,
      {},
      t,
    )
  }

  function resolveReferenceLabelFor(relatedTo, reference) {
    return resolveReferenceLabel(
      relatedTo,
      reference,
      contextSnapshot.value,
      {},
      t,
    )
  }

  watch(resolvedClientId, () => {
    clinicalNotes.value = []
    appointments.value = []
    notesLoaded.value = false
    appointmentsLoaded.value = false
  })

  return {
    referenceOptions,
    referenceLoading,
    ensureLoadedForRelatedTo,
    resolveRelatedDisplay,
    resolveReferenceLabelFor,
  }
}
