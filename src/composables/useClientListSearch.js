import { computed, ref, watch } from 'vue'
import { clientRowMatchesSearch } from 'src/utils/client-list-search.js'

export function useClientListSearch(sourceRows, tablePagination) {
  const searchQuery = ref('')

  const trimmedQuery = computed(() => searchQuery.value.trim())

  const isSearchActive = computed(() => trimmedQuery.value.length > 0)

  const filteredRows = computed(() => {
    if (!isSearchActive.value) {
      return sourceRows.value
    }

    return sourceRows.value.filter(row =>
      clientRowMatchesSearch(row, trimmedQuery.value),
    )
  })

  const rows = computed(() => {
    if (!isSearchActive.value) {
      return sourceRows.value
    }

    const { page, rowsPerPage } = tablePagination.value
    const start = (page - 1) * rowsPerPage

    return filteredRows.value.slice(start, start + rowsPerPage)
  })

  const paginationRowsNumber = computed(() => {
    if (!isSearchActive.value) {
      return tablePagination.value.rowsNumber
    }

    return filteredRows.value.length
  })

  watch(searchQuery, () => {
    tablePagination.value = {
      ...tablePagination.value,
      page: 1,
    }
  })

  return {
    searchQuery,
    trimmedQuery,
    isSearchActive,
    rows,
    paginationRowsNumber,
  }
}
