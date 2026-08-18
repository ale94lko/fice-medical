import { computed, ref, watch } from 'vue'
import {
  listActiveCliniciansForAssignment,
  listClientClinicians,
  mergeClientCliniciansForMany,
  replaceClientClinicians,
} from 'src/utils/client-clinician-api.js'
import {
  idsKey,
  matchesClinicianQuery,
  mergeAssignedClinicians,
} from 'src/utils/client-clinician-normalize.js'

const PAGE_SIZE = 6

function toggleId(ids, id) {
  if (ids.includes(id)) {
    return ids.filter(item => item !== id)
  }

  return [...ids, id]
}

function normalizeClientNumbers(clientIds, clientId) {
  const fromList = (Array.isArray(clientIds) ? clientIds : [])
    .map(id => String(id ?? '').trim())
    .filter(Boolean)
  if (fromList.length) {
    return fromList
  }
  const one = String(clientId ?? '').trim()

  return one ? [one] : []
}

export function useAssignClientClinicians({
  clientId,
  clientIds,
  open,
  onError,
}) {
  const loading = ref(false)
  const saving = ref(false)
  const catalog = ref([])
  const assigned = ref([])
  const originalKey = ref('')
  const selectedAvailable = ref([])
  const selectedAssigned = ref([])
  const search = ref('')
  const page = ref(1)

  const resolvedClientIds = computed(() =>
    normalizeClientNumbers(clientIds?.value, clientId?.value),
  )

  const isBatch = computed(() => resolvedClientIds.value.length > 1)

  const assignedIds = computed(() =>
    new Set(assigned.value.map(row => row.id)),
  )

  const availablePool = computed(() =>
    catalog.value.filter(row => !assignedIds.value.has(row.id)),
  )

  const filteredAvailable = computed(() =>
    availablePool.value.filter(row =>
      matchesClinicianQuery(row, search.value),
    ),
  )

  const pagesNumber = computed(() =>
    Math.max(1, Math.ceil(filteredAvailable.value.length / PAGE_SIZE)),
  )

  const pagedAvailable = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE

    return filteredAvailable.value.slice(start, start + PAGE_SIZE)
  })

  const hasChanges = computed(() =>
    idsKey(assigned.value.map(row => row.id)) !== originalKey.value,
  )

  const noCatalog = computed(() =>
    !loading.value && catalog.value.length === 0,
  )

  const noSearchResults = computed(() =>
    !loading.value
    && availablePool.value.length > 0
    && filteredAvailable.value.length === 0,
  )

  function resetDraft() {
    selectedAvailable.value = []
    selectedAssigned.value = []
    search.value = ''
    page.value = 1
  }

  function byId(id) {
    return catalog.value.find(row => row.id === id)
      || assigned.value.find(row => row.id === id)
      || null
  }

  function assignSelected() {
    const next = []
    for (const id of selectedAvailable.value) {
      const row = byId(id)
      if (row && !assignedIds.value.has(row.id)) {
        next.push(row)
      }
    }
    assigned.value = [...assigned.value, ...next]
    selectedAvailable.value = []
  }

  function unassignSelected() {
    const remove = new Set(selectedAssigned.value)
    assigned.value = assigned.value.filter(row => !remove.has(row.id))
    selectedAssigned.value = []
  }

  function removeAssigned(id) {
    assigned.value = assigned.value.filter(row => row.id !== id)
    selectedAssigned.value = selectedAssigned.value.filter(
      selected => selected !== id,
    )
  }

  function clearAssigned() {
    assigned.value = []
    selectedAssigned.value = []
  }

  async function loadAssigned(available, ids) {
    if (ids.length !== 1) {
      assigned.value = []

      return
    }
    try {
      const assignedRows = await listClientClinicians(ids[0])
      assigned.value = mergeAssignedClinicians(
        assignedRows,
        available,
      )
    } catch (error) {
      onError(error, 'assignCliniciansLoadError')
      assigned.value = []
    }
  }

  async function load() {
    const ids = resolvedClientIds.value
    if (!ids.length) {
      return
    }
    loading.value = true
    resetDraft()
    try {
      const available = await listActiveCliniciansForAssignment()
      catalog.value = available
      await loadAssigned(available, ids)
      originalKey.value = idsKey(assigned.value.map(row => row.id))
    } catch (error) {
      onError(error, 'assignCliniciansLoadError')
      catalog.value = []
      assigned.value = []
    } finally {
      loading.value = false
    }
  }

  function toggleAvailable(id) {
    selectedAvailable.value = toggleId(selectedAvailable.value, id)
  }

  function toggleAssigned(id) {
    selectedAssigned.value = toggleId(selectedAssigned.value, id)
  }

  const pageFrom = computed(() => {
    if (!filteredAvailable.value.length) {
      return 0
    }

    return (page.value - 1) * PAGE_SIZE + 1
  })

  const pageTo = computed(() =>
    Math.min(
      page.value * PAGE_SIZE,
      filteredAvailable.value.length,
    ),
  )

  async function saveSingle(id) {
    const saved = await replaceClientClinicians(
      id,
      assigned.value.map(row => row.id),
    )
    assigned.value = mergeAssignedClinicians(saved, catalog.value)
    originalKey.value = idsKey(assigned.value.map(row => row.id))
  }

  async function saveBatch(ids) {
    await mergeClientCliniciansForMany(
      ids,
      assigned.value.map(row => row.id),
    )
  }

  async function save() {
    const ids = resolvedClientIds.value
    if (!ids.length || !hasChanges.value) {
      return false
    }
    saving.value = true
    try {
      if (ids.length === 1) {
        await saveSingle(ids[0])
      } else {
        await saveBatch(ids)
      }

      return true
    } catch (error) {
      onError(error, 'assignCliniciansSaveError')

      return false
    } finally {
      saving.value = false
    }
  }

  watch(search, () => {
    page.value = 1
  })

  watch(filteredAvailable, () => {
    if (page.value > pagesNumber.value) {
      page.value = pagesNumber.value
    }
  })

  watch(open, isOpen => {
    if (isOpen) {
      void load()
    }
  })

  return {
    loading,
    saving,
    assigned,
    selectedAvailable,
    selectedAssigned,
    search,
    page,
    pageSize: PAGE_SIZE,
    filteredAvailable,
    pagedAvailable,
    pagesNumber,
    hasChanges,
    noCatalog,
    noSearchResults,
    pageFrom,
    pageTo,
    isBatch,
    clientCount: computed(() => resolvedClientIds.value.length),
    toggleAvailable,
    toggleAssigned,
    assignSelected,
    unassignSelected,
    removeAssigned,
    clearAssigned,
    save,
  }
}
