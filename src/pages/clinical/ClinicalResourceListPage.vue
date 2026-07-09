<template>
  <q-page
    class="admin-page admin-list-page clinical-resource-list-page"
    :data-testid="clinicalResourceTestIds.listPage">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="t('clinicalResourceListTitle')"
      :subtitle="t('clinicalResourceListSubtitle')">
      <template #center>
        <div
          class="clinical-resource-list-page__toolbar row items-center no-wrap">
          <q-input
            :model-value="searchQuery"
            outlined
            clearable
            hide-bottom-space
            class="admin-list-page__search-input
              clinical-resource-list-page__search"
            :data-testid="clinicalResourceTestIds.listSearch"
            :disable="loading"
            :placeholder="t('clinicalResourceListSearchPlaceholder')"
            @update:model-value="onSearchInput"
            @clear="resetSearch">
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>
        </div>
      </template>
      <template #actions>
        <q-btn
          v-if="canAddClinicalResource"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :data-testid="clinicalResourceTestIds.listAdd"
          :disable="loading"
          :label="t('clinicalResourceListAdd')"
          @click="openAddDialog"
        />
      </template>
    </AdminListPageHeader>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      :show-column-settings="false">
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :grid="showGrid"
        :rows="rows"
        :columns="visibleColumns"
        :loading="false"
        @request="onTableRequest">
        <template #body-cell-title="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <div class="row items-center no-wrap q-gutter-sm">
              <q-avatar
                size="28px"
                :icon="scope.row.typeIcon"
                color="primary"
                text-color="white"
              />
              <button
                type="button"
                class="admin-data-table__link text-left"
                :data-testid="clinicalResourceTestIds.rowOpen(scope.row.id)"
                @click="openResource(scope.row)">
                <div>{{ scope.row[fk.title] || '—' }}</div>
                <div
                  v-if="scope.row.subtitle"
                  class="text-caption text-grey-7">
                  {{ scope.row.subtitle }}
                </div>
              </button>
            </div>
          </q-td>
        </template>

        <template #body-cell-category="scope">
          <q-td :props="scope">
            <q-chip
              v-if="scope.row[fk.category]"
              dense
              :color="scope.row.categoryChip.color"
              :text-color="scope.row.categoryChip.textColor">
              {{ scope.row[fk.category] }}
            </q-chip>
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <template #body-cell-type="scope">
          <q-td :props="scope" class="admin-data-table__secondary-cell">
            {{ scope.row.typeLabel || '—' }}
          </q-td>
        </template>

        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row.statusLabel"
              :variant="scope.row.statusVariant"
            />
          </q-td>
        </template>

        <template #body-cell-pinned="scope">
          <q-td
            :props="scope"
            class="clinical-resource-list-page__pinned-cell">
            <q-btn
              v-if="canPinClinicalResources"
              flat
              round
              dense
              :icon="scope.row[fk.pinned] ? 'push_pin' : 'outlined_flag'"
              :color="scope.row[fk.pinned] ? 'primary' : 'grey-7'"
              :disable="!scope.row[fk.pinned] && pinnedCount >= pinnedMax"
              :aria-label="scope.row[fk.pinned]
                ? t('clinicalResourceUnpin')
                : t('clinicalResourcePin')"
              :data-testid="clinicalResourceTestIds.rowPin(scope.row.id)"
              @click="togglePin(scope.row)"
            />
            <q-icon
              v-else-if="scope.row[fk.pinned]"
              name="push_pin"
              size="20px"
              color="primary"
              :aria-label="t('clinicalResourcePin')"
            />
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <template #body-cell-favorite="scope">
          <q-td
            :props="scope"
            class="clinical-resource-list-page__toggle-cell">
            <q-btn
              flat
              round
              dense
              :icon="scope.row[fk.favorite] ? 'star' : 'star_border'"
              :color="scope.row[fk.favorite] ? 'amber-8' : 'grey-7'"
              :aria-label="t('clinicalResourceToggleFavorite')"
              :data-testid="clinicalResourceTestIds.rowFavorite(scope.row.id)"
              @click="toggleFavorite(scope.row)"
            />
          </q-td>
        </template>

        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              v-if="canEditClinicalResource"
              flat
              round
              dense
              :icon="adminTableActionIcons.edit"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :title="t('edit')"
              :aria-label="t('edit')"
              :data-testid="clinicalResourceTestIds.rowEdit(row.id)"
              @click="editResource(row)"
            />
            <q-btn
              v-if="canManageClinicalResources
                && row.status !== clinicalResourceStatusValues.active"
              flat
              round
              dense
              icon="check_circle"
              color="positive"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :title="t('clinicalResourceActivate')"
              :aria-label="t('clinicalResourceActivate')"
              :data-testid="clinicalResourceTestIds.rowActivate(row.id)"
              @click="toggleResourceStatus(row)"
            />
            <q-btn
              v-if="canManageClinicalResources
                && row.status === clinicalResourceStatusValues.active"
              flat
              round
              dense
              icon="block"
              color="warning"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :title="t('clinicalResourceDeactivate')"
              :aria-label="t('clinicalResourceDeactivate')"
              :data-testid="clinicalResourceTestIds.rowDeactivate(row.id)"
              @click="toggleResourceStatus(row)"
            />
            <q-btn
              v-if="canManageClinicalResources"
              flat
              round
              dense
              icon="delete_outline"
              color="negative"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :title="t('delete')"
              :aria-label="t('delete')"
              :data-testid="clinicalResourceTestIds.rowDelete(row.id)"
              @click="confirmArchive(row)"
            />
          </div>
        </template>

        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>{{ t('clinicalResourceListEmpty') }}</span>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <ClinicalResourceDetailDialog
      v-model="detailOpen"
      :resource="detailResource"
    />

    <ClinicalResourceDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :resource="activeResource"
      :saving="dialogSaving"
      @save="onDialogSave"
      @cancel="closeDialog"
    />
  </q-page>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  clinicalResourceFieldKeys as fk,
  clinicalResourceListColumnKeys as col,
  clinicalResourcePinnedMax,
  clinicalResourceStatusValues,
  clinicalResourceTypeValues,
  quasarNotifyTypes,
  siteBreakpoints,
  siteBreakpointsPx,
} from 'components/constants.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClinicalResourceDialog from
  'components/admin/ClinicalResourceDialog.vue'
import ClinicalResourceDetailDialog from
  'components/clinical/ClinicalResourceDetailDialog.vue'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import {
  archiveClinicalResource,
  favoriteClinicalResource,
  loadClinicalResourceRows,
  pinClinicalResource,
  runClinicalResourceMutation,
  unfavoriteClinicalResource,
  unpinClinicalResource,
  updateClinicalResourceStatus,
  useClinicalResourceListState,
} from 'src/composables/useClinicalResourceList.js'
import {
  resolveCanPinClinicalResources,
  useClinicalResourcePermissions,
} from 'src/composables/useClinicalResourcePermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { previewClinicalResourceDocument } from
  'src/utils/clinical-resource-document-actions.js'
import {
  clinicalResourceApiErrorMessage,
  createClinicalResource,
  fetchClinicalResourceById,
  listPinnedClinicalResources,
  updateClinicalResource,
  uploadClinicalResourceDocument,
} from 'src/utils/clinical-resource-api.js'
import { clinicalResourceTestIds } from 'src/test-ids/index.js'

const SEARCH_DEBOUNCE_MS = 300
const pinnedMax = clinicalResourcePinnedMax

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const {
  canViewClinicalResources,
  canAddClinicalResource,
  canEditClinicalResource,
  canManageClinicalResources,
} = useClinicalResourcePermissions()

const state = useClinicalResourceListState()
const {
  loading,
  rows,
  searchQuery,
  tablePagination,
} = state

const pinnedCount = ref(0)
const canPinClinicalResources = ref(false)
const detailOpen = ref(false)
const detailResource = ref(null)
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeResource = ref(null)
let searchDebounceTimer = null

const { setFooterPagination, patchFooterPagination, clearFooterPagination } =
  useAppFooterPagination()

const showGrid = computed(() => $q.screen.width < siteBreakpointsPx.MD)

const visibleColumns = computed(() => [
  {
    name: col.title,
    label: t('clinicalResourceNameColumn'),
    align: 'left',
    field: row => row[fk.title],
    sortable: false,
    headerStyle: 'min-width: 280px',
    style: 'min-width: 280px',
  },
  {
    name: col.category,
    label: t('clinicalResourceCategoryLabel'),
    align: 'left',
    field: row => row[fk.category],
    sortable: false,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
  },
  {
    name: col.type,
    label: t('clinicalResourceTypeLabel'),
    align: 'left',
    field: row => row.typeLabel,
    sortable: false,
    headerStyle: 'min-width: 140px',
    style: 'min-width: 140px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: col.status,
    label: t('status'),
    align: 'left',
    field: row => row.statusLabel,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: col.pinned,
    label: canPinClinicalResources.value
      ? t('clinicalResourcePinnedColumnWithCounter', {
        count: pinnedCount.value,
        max: pinnedMax,
      })
      : t('clinicalResourcePinnedColumn'),
    align: 'center',
    field: row => row[fk.pinned],
    sortable: false,
    headerStyle: 'width: 96px; min-width: 96px',
    style: 'width: 96px; min-width: 96px',
  },
  {
    name: col.favorite,
    label: t('clinicalResourceFavoriteColumn'),
    align: 'center',
    field: row => row[fk.favorite],
    sortable: false,
    headerStyle: 'width: 72px; min-width: 72px',
    style: 'width: 72px; min-width: 72px',
  },
  {
    name: col.actions,
    label: t('actions'),
    align: 'center',
    field: row => row.id,
    sortable: false,
    headerStyle: 'min-width: 148px',
    style: 'min-width: 148px',
  },
])

async function reloadList() {
  try {
    await loadClinicalResourceRows(state, t)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(
          error,
          t('clinicalResourceListError'),
        ),
      })
    }
  }
}

async function refreshPinnedCount() {
  try {
    const pinned = await listPinnedClinicalResources(t)
    pinnedCount.value = pinned.length
  } catch {
    pinnedCount.value = rows.value.filter(row => row[fk.pinned]).length
  }
}

function scheduleReload() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    tablePagination.value = { ...tablePagination.value, page: 1 }
    void reloadList()
  }, SEARCH_DEBOUNCE_MS)
}

function onSearchInput(value) {
  searchQuery.value = String(value ?? '')
  scheduleReload()
}

function resetSearch() {
  searchQuery.value = ''
  scheduleReload()
}

function onTableRequest(payload) {
  tablePagination.value = {
    ...tablePagination.value,
    ...payload.pagination,
  }
  void reloadList()
}

function onPageChange(page) {
  tablePagination.value = { ...tablePagination.value, page }
  void reloadList()
}

function onRowsPerPageChange(rowsPerPage) {
  tablePagination.value = { ...tablePagination.value, page: 1, rowsPerPage }
  void reloadList()
}

function openExternalLink(row) {
  const url = String(row[fk.url] ?? '').trim()
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

async function previewDocumentResource(row) {
  return previewClinicalResourceDocument(row.id, { t, $q })
}

async function openResource(row) {
  if (row.type === clinicalResourceTypeValues.externalLink) {
    openExternalLink(row)

    return
  }
  if (row.type === clinicalResourceTypeValues.document) {
    const previewed = await previewDocumentResource(row)
    if (!previewed) {
      detailResource.value = row
      detailOpen.value = true
    }

    return
  }
  detailResource.value = row
  detailOpen.value = true
}

function editResource(row) {
  void openRowDialog('edit', row)
}

function openAddDialog() {
  activeResource.value = null
  dialogMode.value = 'add'
  dialogOpen.value = true
}

async function openRowDialog(mode, row) {
  dialogMode.value = mode
  dialogSaving.value = false
  try {
    loading.value = true
    activeResource.value = await fetchClinicalResourceById(row.id, t)
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(
          error,
          t('clinicalResourceLoadError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function closeDialog() {
  dialogOpen.value = false
  activeResource.value = null
}

async function onDialogSave(form) {
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      await createClinicalResource(
        form,
        form.type === clinicalResourceTypeValues.document
          ? form.documentFile
          : null,
      )
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clinicalResourceCreateSuccess'),
      })
    } else {
      await updateClinicalResource(form.id, form)
      if (
        form.type === clinicalResourceTypeValues.document
        && form.documentFile
      ) {
        await uploadClinicalResourceDocument(form.id, form.documentFile)
      }
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clinicalResourceUpdateSuccess'),
      })
    }
    closeDialog()
    await reloadList()
    await refreshPinnedCount()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(
          error,
          t('clinicalResourceSaveError'),
        ),
      })
    }
  } finally {
    dialogSaving.value = false
  }
}

async function toggleFavorite(row) {
  const mutation = row[fk.favorite]
    ? () => unfavoriteClinicalResource(row.id)
    : () => favoriteClinicalResource(row.id)
  const updated = await runClinicalResourceMutation(mutation, {
    t,
    $q,
    fallbackKey: 'clinicalResourceFavoriteError',
  })
  if (updated) {
    row[fk.favorite] = updated.favorite
  }
}

async function togglePin(row) {
  const mutation = row[fk.pinned]
    ? () => unpinClinicalResource(row.id)
    : () => pinClinicalResource(row.id)
  const updated = await runClinicalResourceMutation(mutation, {
    t,
    $q,
    fallbackKey: 'clinicalResourcePinError',
  })
  if (updated) {
    row[fk.pinned] = updated.pinned
    await refreshPinnedCount()
    void reloadList()
  }
}

async function toggleResourceStatus(row) {
  const nextStatus = row.status === clinicalResourceStatusValues.active
    ? clinicalResourceStatusValues.inactive
    : clinicalResourceStatusValues.active
  const updated = await runClinicalResourceMutation(
    () => updateClinicalResourceStatus(row.id, nextStatus),
    { t, $q, fallbackKey: 'clinicalResourceStatusError' },
  )
  if (updated) {
    void reloadList()
  }
}

function confirmArchive(row) {
  $q.dialog({
    title: t('clinicalResourceArchiveConfirmTitle'),
    message: t('clinicalResourceArchiveConfirmMessage', { title: row.title }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void archiveRow(row)
  })
}

async function archiveRow(row) {
  const updated = await runClinicalResourceMutation(
    () => archiveClinicalResource(row.id),
    { t, $q, fallbackKey: 'clinicalResourceArchiveError' },
  )
  if (updated) {
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('clinicalResourceArchiveSuccess'),
    })
    void reloadList()
  }
}

async function openResourceFromQuery() {
  const resourceId = String(route.query.resourceId ?? '').trim()
  if (!resourceId || !canViewClinicalResources.value) {
    return
  }
  try {
    const resource = await fetchClinicalResourceById(resourceId, t)
    if (resource.type === clinicalResourceTypeValues.externalLink) {
      openExternalLink(resource)
    } else if (resource.type === clinicalResourceTypeValues.document) {
      const previewed = await previewDocumentResource(resource)
      if (!previewed) {
        detailResource.value = resource
        detailOpen.value = true
      }
    } else {
      detailResource.value = resource
      detailOpen.value = true
    }
    const nextQuery = { ...route.query }
    delete nextQuery.resourceId
    void router.replace({ query: nextQuery })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: clinicalResourceApiErrorMessage(
          error,
          t('clinicalResourceListError'),
        ),
      })
    }
  }
}

onMounted(async() => {
  if (route.query.q) {
    searchQuery.value = String(route.query.q)
  }
  canPinClinicalResources.value = await resolveCanPinClinicalResources(t)
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value,
    summaryKey: 'clinicalResourceListPaginationSummary',
    onPageChange,
    onRowsPerPageChange,
  })
  await Promise.all([reloadList(), refreshPinnedCount()])
  await openResourceFromQuery()
})

watch(
  () => [tablePagination.value.page, tablePagination.value.rowsPerPage,
    tablePagination.value.rowsNumber, loading.value],
  () => {
    patchFooterPagination({
      page: tablePagination.value.page,
      rowsPerPage: tablePagination.value.rowsPerPage,
      rowsNumber: tablePagination.value.rowsNumber,
      disable: loading.value,
    })
  },
)

onBeforeUnmount(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  clearFooterPagination()
})
</script>
