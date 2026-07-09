import { ref } from 'vue'
import {
  clinicalResourceStatusValues,
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
    status: clinicalResourceStatusValues.active,
  }
}

export async function loadClinicalResourceRows(state, t) {
  state.loading.value = true
  try {
    const result = await listClinicalResources(
      buildClinicalResourceListParams(state),
      t,
    )
    state.rows.value = result.items
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
