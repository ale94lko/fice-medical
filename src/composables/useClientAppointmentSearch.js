import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { searchClientAppointments } from 'src/utils/appointment-api.js'
import {
  APPOINTMENT_LIST_SEARCH_DEBOUNCE_MS,
  APPOINTMENT_LIST_SEARCH_MIN_LENGTH,
  isAppointmentListServerSearchQuery,
} from 'src/utils/appointment-list-search.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const DEFAULT_ROWS_PER_PAGE = 20

/**
 * Server search for appointments of one client (LIKE across
 * number, status, notes, POS, clinician, services, dates).
 */
export function useClientAppointmentSearch({
  clientId,
  embeddedRows,
  onError,
}) {
  const searchQuery = ref('')
  const searchLoading = ref(false)
  const searchRows = ref([])
  const tablePagination = ref({
    page: 1,
    rowsPerPage: DEFAULT_ROWS_PER_PAGE,
    rowsNumber: 0,
  })

  let debounceTimer = null
  let skipNextQueryWatch = false
  let requestId = 0

  const trimmedQuery = computed(() =>
    String(searchQuery.value ?? '').trim(),
  )

  const isSearchActive = computed(() =>
    isAppointmentListServerSearchQuery(trimmedQuery.value),
  )

  const appointmentRows = computed(() => {
    if (isSearchActive.value) {
      return searchRows.value
    }

    return Array.isArray(embeddedRows.value)
      ? embeddedRows.value
      : []
  })

  const showSearchPagination = computed(() =>
    isSearchActive.value
    && Number(tablePagination.value.rowsNumber) > 0,
  )

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  async function runSearch(paginationPayload = tablePagination.value) {
    const id = String(clientId.value ?? '').trim()
    const q = trimmedQuery.value

    if (!id || !isAppointmentListServerSearchQuery(q)) {
      searchRows.value = []
      tablePagination.value = {
        ...tablePagination.value,
        rowsNumber: 0,
      }

      return
    }

    const page = Number(paginationPayload.page ?? 1) || 1
    const limit = Number(
      paginationPayload.rowsPerPage ?? DEFAULT_ROWS_PER_PAGE,
    ) || DEFAULT_ROWS_PER_PAGE
    const currentRequest = requestId + 1
    requestId = currentRequest
    searchLoading.value = true

    try {
      const result = await searchClientAppointments(id, {
        q,
        page,
        limit,
      })
      if (currentRequest !== requestId) {
        return
      }

      searchRows.value = result.items
      const total = Number(result.pagination?.total ?? 0)
      let resolvedPage = page
      if (Number.isFinite(Number(result.pagination?.page))) {
        resolvedPage = Number(result.pagination.page) + 1
      }
      const resolvedLimit = Number(result.pagination?.limit) || limit

      tablePagination.value = {
        page: resolvedPage,
        rowsPerPage: resolvedLimit,
        rowsNumber: Number.isFinite(total) ? total : result.items.length,
      }
    } catch (error) {
      if (currentRequest !== requestId) {
        return
      }
      searchRows.value = []
      tablePagination.value = {
        ...tablePagination.value,
        rowsNumber: 0,
      }
      if (!isAuthSessionEndUIError(error)) {
        onError?.(error)
      }
    } finally {
      if (currentRequest === requestId) {
        searchLoading.value = false
      }
    }
  }

  function scheduleSearch(delay = APPOINTMENT_LIST_SEARCH_DEBOUNCE_MS) {
    clearDebounce()
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void runSearch({
        ...tablePagination.value,
        page: 1,
      })
    }, delay)
  }

  watch(trimmedQuery, (next, previous) => {
    tablePagination.value = {
      ...tablePagination.value,
      page: 1,
    }

    if (skipNextQueryWatch) {
      skipNextQueryWatch = false
      return
    }

    if (!next) {
      searchRows.value = []
      tablePagination.value = {
        ...tablePagination.value,
        rowsNumber: 0,
      }
      clearDebounce()
      requestId += 1
      searchLoading.value = false

      return
    }

    if (
      next.length >= APPOINTMENT_LIST_SEARCH_MIN_LENGTH
      || (previous && isAppointmentListServerSearchQuery(previous))
    ) {
      scheduleSearch(
        next.length >= APPOINTMENT_LIST_SEARCH_MIN_LENGTH
          ? APPOINTMENT_LIST_SEARCH_DEBOUNCE_MS
          : 0,
      )
    }
  })

  watch(
    () => String(clientId.value ?? '').trim(),
    () => {
      skipNextQueryWatch = true
      searchQuery.value = ''
      searchRows.value = []
      tablePagination.value = {
        page: 1,
        rowsPerPage: DEFAULT_ROWS_PER_PAGE,
        rowsNumber: 0,
      }
      clearDebounce()
      requestId += 1
      searchLoading.value = false
    },
  )

  onBeforeUnmount(() => {
    clearDebounce()
    requestId += 1
  })

  function setSearchQuery(value) {
    searchQuery.value = value == null ? '' : String(value)
  }

  function resetSearchQuery() {
    clearDebounce()
    skipNextQueryWatch = true
    searchQuery.value = ''
    searchRows.value = []
    tablePagination.value = {
      ...tablePagination.value,
      page: 1,
      rowsNumber: 0,
    }
    requestId += 1
    searchLoading.value = false
  }

  async function reloadIfSearching() {
    if (!isSearchActive.value) {
      return
    }
    await runSearch(tablePagination.value)
  }

  function onPageChange(page) {
    if (page === tablePagination.value.page) {
      return
    }
    tablePagination.value = {
      ...tablePagination.value,
      page,
    }
    void runSearch(tablePagination.value)
  }

  function onRowsPerPageChange(rowsPerPage) {
    if (rowsPerPage === tablePagination.value.rowsPerPage) {
      return
    }
    tablePagination.value = {
      ...tablePagination.value,
      page: 1,
      rowsPerPage,
    }
    void runSearch(tablePagination.value)
  }

  return {
    searchQuery,
    setSearchQuery,
    resetSearchQuery,
    trimmedQuery,
    isSearchActive,
    searchLoading,
    appointmentRows,
    tablePagination,
    showSearchPagination,
    minSearchLength: APPOINTMENT_LIST_SEARCH_MIN_LENGTH,
    reloadIfSearching,
    onPageChange,
    onRowsPerPageChange,
  }
}
