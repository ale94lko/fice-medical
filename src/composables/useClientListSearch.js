import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  CLIENT_LIST_SEARCH_DEBOUNCE_MS,
  CLIENT_LIST_SEARCH_MIN_LENGTH,
  isClientListServerSearchQuery,
} from 'src/utils/client-list-search.js'

export function useClientListSearch({
  sourceRows,
  tablePagination,
  onQueryChange,
}) {
  const searchQuery = ref('')
  let debounceTimer = null
  let skipNextQueryWatch = false

  const trimmedQuery = computed(() =>
    String(searchQuery.value ?? '').trim(),
  )

  const isSearchActive = computed(() =>
    isClientListServerSearchQuery(trimmedQuery.value),
  )

  const highlightQuery = computed(() =>
    isSearchActive.value ? trimmedQuery.value : '',
  )

  const rows = computed(() => sourceRows.value)

  const paginationRowsNumber = computed(
    () => tablePagination.value.rowsNumber,
  )

  function scheduleQueryChange(delay = CLIENT_LIST_SEARCH_DEBOUNCE_MS) {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null
      onQueryChange?.()
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
      scheduleQueryChange(0)
      return
    }

    if (
      next.length >= CLIENT_LIST_SEARCH_MIN_LENGTH
      || (previous && isClientListServerSearchQuery(previous))
    ) {
      scheduleQueryChange()
    }
  })

  onBeforeUnmount(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  })

  function setSearchQuery(value) {
    searchQuery.value = value == null ? '' : String(value)
  }

  function resetSearchQuery() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    skipNextQueryWatch = true
    searchQuery.value = ''
    tablePagination.value = {
      ...tablePagination.value,
      page: 1,
    }
    onQueryChange?.()
  }

  function clearSearchQueryWithoutReload() {
    skipNextQueryWatch = true
    searchQuery.value = ''
  }

  return {
    searchQuery,
    setSearchQuery,
    resetSearchQuery,
    trimmedQuery,
    isSearchActive,
    highlightQuery,
    rows,
    paginationRowsNumber,
    clearSearchQueryWithoutReload,
  }
}
