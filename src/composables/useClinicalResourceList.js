import { ref } from 'vue'
import {
  quasarNotifyTypes,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  archiveClinicalResource,
  clinicalResourceApiErrorMessage,
  favoriteClinicalResource,
  listClinicalResources,
  pinClinicalResource,
  unfavoriteClinicalResource,
  unpinClinicalResource,
  updateClinicalResourceStatus,
} from 'src/utils/clinical-resource-api.js'
import { sortClinicalResourceRows } from
  'src/utils/clinical-resource-list-normalize.js'

export function useClinicalResourceListState() {
  const loading = ref(false)
  const rows = ref([])
  const searchQuery = ref('')
  const tablePagination = ref({
    sortBy: 'title',
    descending: false,
    page: 1,
    rowsPerPage: 20,
    rowsNumber: 0,
  })

  return {
    loading,
    rows,
    searchQuery,
    tablePagination,
  }
}

export function buildClinicalResourceListParams(state) {
  return {
    page: state.tablePagination.value.page,
    limit: state.tablePagination.value.rowsPerPage,
    q: state.searchQuery.value,
    // Omit status so ACTIVE + INACTIVE are returned (archived excluded
    // by API default). Client-side sort: active (pinned+favorite → pinned
    // → favorite → rest), then inactive last (even if favorite).
  }
}

export function applyClinicalResourceListSort(state) {
  state.rows.value = sortClinicalResourceRows(
    state.rows.value,
    state.tablePagination.value.sortBy,
    state.tablePagination.value.descending,
  )
}

export async function loadClinicalResourceRows(state, t) {
  state.loading.value = true
  try {
    const result = await listClinicalResources(
      buildClinicalResourceListParams(state),
      t,
    )
    state.rows.value = result.items
    applyClinicalResourceListSort(state)
    const total = result.pagination?.total
    if (total != null && Number.isFinite(Number(total))) {
      state.tablePagination.value = {
        ...state.tablePagination.value,
        rowsNumber: Number(total),
      }
    } else {
      state.tablePagination.value = {
        ...state.tablePagination.value,
        rowsNumber: result.items.length,
      }
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      throw error
    }
  } finally {
    state.loading.value = false
  }
}

export async function runClinicalResourceMutation(
  mutation,
  { t, $q, fallbackKey },
) {
  try {
    return await mutation()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(error, t(fallbackKey)),
      })
    }

    return null
  }
}

export {
  archiveClinicalResource,
  favoriteClinicalResource,
  pinClinicalResource,
  unfavoriteClinicalResource,
  unpinClinicalResource,
  updateClinicalResourceStatus,
}
