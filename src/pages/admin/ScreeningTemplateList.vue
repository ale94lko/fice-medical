<template>
  <q-page
    class="admin-page admin-list-page screening-template-list-page"
    :data-testid="screeningTemplateListTestIds.page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="t('screeningTemplateListTitle')"
      :subtitle="t('screeningTemplateListSubtitle')">
      <template #center>
        <div
          class="screening-template-list-page__toolbar
            row items-center no-wrap">
          <q-input
            v-model="searchQuery"
            outlined
            clearable
            hide-bottom-space
            class="admin-list-page__search-input
              screening-template-list-page__search"
            :data-testid="screeningTemplateListTestIds.search"
            :disable="loading"
            :placeholder="t('screeningTemplateListSearchPlaceholder')"
            :aria-label="t('screeningTemplateListSearchPlaceholder')">
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>
          <FormSelect
            :model-value="statusFilter"
            :options="statusFilterOptions"
            clearable
            outlined
            hide-bottom-space
            class="screening-template-list-page__filter"
            :disable="loading"
            :placeholder="t('screeningTemplateStatusFilterPlaceholder')"
            :test-id="screeningTemplateListTestIds.statusFilter"
            @update:model-value="onStatusFilterChange"
          />
        </div>
      </template>
      <template #actions>
        <div
          class="admin-list-page__actions row items-center
            q-gutter-sm no-wrap">
          <q-btn
            v-if="canAddScreeningTemplate"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :data-testid="screeningTemplateListTestIds.add"
            :disable="loading"
            :label="t('screeningTemplateListAdd')"
            @click="openAddDialog"
          />
        </div>
      </template>
    </AdminListPageHeader>

    <AdminTablePanel class="admin-list-page__table-panel">
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :grid="showGrid"
        :rows="filteredRows"
        :columns="visibleColumns"
        :loading="false">
        <template #body-cell-name="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              v-if="canViewScreeningTemplates"
              type="button"
              class="admin-data-table__link"
              :data-testid="screeningTemplateListTestIds.rowView(scope.row.id)"
              @click="viewRow(scope.row)">
              {{ scope.row.name || '—' }}
            </button>
            <span v-else>{{ scope.row.name || '—' }}</span>
          </q-td>
        </template>

        <template #body-cell-category="scope">
          <q-td :props="scope" class="admin-data-table__secondary-cell">
            {{ scope.row.category || '—' }}
          </q-td>
        </template>

        <template #body-cell-version="scope">
          <q-td :props="scope">
            {{ scope.row.version }}
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

        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              v-if="canViewScreeningTemplates"
              flat
              round
              dense
              size="sm"
              icon="visibility"
              class="app-btn-icon-action"
              :title="t('view')"
              :aria-label="t('view')"
              :data-testid="screeningTemplateListTestIds.rowView(row.id)"
              @click="viewRow(row)"
            />
            <q-btn
              v-if="canViewScreeningTemplates"
              flat
              round
              dense
              size="sm"
              icon="preview"
              class="app-btn-icon-action"
              :title="t('screeningTemplatePreview')"
              :aria-label="t('screeningTemplatePreview')"
              :data-testid="screeningTemplateListTestIds.rowPreview(row.id)"
              @click="openPreview(row)"
            />
            <q-btn
              v-if="canEditScreeningTemplates && !isArchived(row)"
              flat
              round
              dense
              size="sm"
              icon="edit"
              class="app-btn-icon-action"
              :title="t('edit')"
              :aria-label="t('edit')"
              :data-testid="screeningTemplateListTestIds.rowEdit(row.id)"
              @click="editRow(row)"
            />
            <q-btn
              v-if="canManageScreeningTemplates && !isActive(row)
                && !isArchived(row)"
              flat
              round
              dense
              size="sm"
              icon="check_circle"
              color="positive"
              class="app-btn-icon-action"
              :title="t('screeningTemplateActivate')"
              :aria-label="t('screeningTemplateActivate')"
              :data-testid="screeningTemplateListTestIds.rowActivate(row.id)"
              @click="setStatus(row, statusValues.active)"
            />
            <q-btn
              v-if="canManageScreeningTemplates && isActive(row)"
              flat
              round
              dense
              size="sm"
              icon="block"
              color="warning"
              class="app-btn-icon-action"
              :title="t('screeningTemplateDeactivate')"
              :aria-label="t('screeningTemplateDeactivate')"
              :data-testid="screeningTemplateListTestIds.rowDeactivate(row.id)"
              @click="setStatus(row, statusValues.inactive)"
            />
            <q-btn
              v-if="canManageScreeningTemplates && !isArchived(row)"
              flat
              round
              dense
              size="sm"
              icon="delete_outline"
              color="negative"
              class="app-btn-icon-action"
              :title="t('screeningTemplateDelete')"
              :aria-label="t('screeningTemplateDelete')"
              :data-testid="screeningTemplateListTestIds.rowDelete(row.id)"
              @click="confirmDelete(row)"
            />
          </div>
        </template>

        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>{{ t('screeningTemplateListEmpty') }}</span>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <ScreeningTemplateDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :template="activeTemplate"
      :saving="dialogSaving"
      :copy-sources="copySourceOptions"
      @save="onDialogSave"
      @cancel="closeDialog"
    />

    <ScreeningTemplatePreviewDialog
      v-model="previewOpen"
      :template="previewTemplate"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  screeningTemplateStatusValues as statusValues,
  siteBreakpointsPx,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import FormSelect from 'components/FormSelect.vue'
import ScreeningTemplateDialog from
  'components/admin/ScreeningTemplateDialog.vue'
import ScreeningTemplatePreviewDialog from
  'components/admin/ScreeningTemplatePreviewDialog.vue'
import {
  buildScreeningTemplateStatusOptions,
  useScreeningTemplatePermissions,
} from 'src/composables/useScreeningTemplatePermissions.js'
import {
  createScreeningTemplate,
  deleteScreeningTemplate,
  fetchManageScreeningTemplate,
  listManageScreeningTemplates,
  screeningTemplateApiErrorMessage,
  updateScreeningTemplate,
  updateScreeningTemplateStatus,
} from 'src/utils/screening-template-api.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { screeningTemplateListTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()

const {
  setFooterPagination,
  patchFooterPagination,
  clearFooterPagination,
} = useAppFooterPagination()

const {
  canManageScreeningTemplates,
  canViewScreeningTemplates,
  canEditScreeningTemplates,
  canAddScreeningTemplate,
} = useScreeningTemplatePermissions()

const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const statusFilter = ref(null)
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeTemplate = ref(null)
const previewOpen = ref(false)
const previewTemplate = ref(null)

const tablePagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 20,
})

const showGrid = computed(() => $q.screen.width < siteBreakpointsPx.MD)

const statusFilterOptions = computed(() =>
  buildScreeningTemplateStatusOptions(t),
)

const copySourceOptions = computed(() =>
  rows.value.map(row => ({ label: row.name, value: row.id })),
)

const filteredRows = computed(() => {
  const needle = searchQuery.value.trim().toLowerCase()
  if (!needle) {
    return rows.value
  }

  return rows.value.filter(row =>
    row.name.toLowerCase().includes(needle)
    || row.category.toLowerCase().includes(needle),
  )
})

function onPageChange(page) {
  tablePagination.value = { ...tablePagination.value, page }
}

function onRowsPerPageChange(rowsPerPage) {
  tablePagination.value = {
    ...tablePagination.value,
    rowsPerPage,
    page: 1,
  }
}

function syncFooterPaginationBar() {
  patchFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: filteredRows.value.length,
    disable: loading.value,
    onPageChange,
    onRowsPerPageChange,
  })
}

const visibleColumns = computed(() => [
  {
    name: 'name',
    label: t('screeningTemplateNameLabel'),
    align: 'left',
    field: row => row.name,
    sortable: true,
    headerStyle: 'min-width: 220px',
    style: 'min-width: 220px',
  },
  {
    name: 'category',
    label: t('screeningTemplateCategoryLabel'),
    align: 'left',
    field: row => row.category,
    sortable: true,
    headerStyle: 'min-width: 160px',
    style: 'min-width: 160px',
    classes: 'admin-data-table__secondary-cell',
  },
  {
    name: 'version',
    label: t('screeningTemplateVersionLabel'),
    align: 'left',
    field: row => row.version,
    sortable: true,
    headerStyle: 'min-width: 90px',
    style: 'min-width: 90px',
  },
  {
    name: 'status',
    label: t('status'),
    align: 'left',
    field: row => row.statusLabel,
    sortable: false,
    headerStyle: 'min-width: 120px',
    style: 'min-width: 120px',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'center',
    field: () => '',
    sortable: false,
    headerStyle: 'min-width: 132px',
    style: 'min-width: 132px',
  },
])

function isActive(row) {
  return row.status === statusValues.active
}

function isArchived(row) {
  return row.status === statusValues.archived
}

async function loadTemplates() {
  loading.value = true
  try {
    const wantsArchived = statusFilter.value === statusValues.archived
    rows.value = await listManageScreeningTemplates({
      status: statusFilter.value ?? undefined,
      includeArchived: wantsArchived,
    }, t)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningTemplateListError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function reload() {
  void loadTemplates()
}

function onStatusFilterChange(value) {
  statusFilter.value = value ?? null
  reload()
}

function openAddDialog() {
  activeTemplate.value = null
  dialogMode.value = 'add'
  dialogOpen.value = true
}

async function openRowDialog(mode, row) {
  dialogMode.value = mode
  dialogSaving.value = false
  loading.value = true
  try {
    activeTemplate.value = await fetchManageScreeningTemplate(row.id)
    dialogOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningTemplateLoadError'),
      })
    }
  } finally {
    loading.value = false
  }
}

async function openPreview(row) {
  loading.value = true
  try {
    previewTemplate.value = await fetchManageScreeningTemplate(row.id)
    previewOpen.value = true
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningTemplateLoadError'),
      })
    }
  } finally {
    loading.value = false
  }
}

function viewRow(row) {
  void openRowDialog('view', row)
}

function editRow(row) {
  void openRowDialog('edit', row)
}

function closeDialog() {
  dialogOpen.value = false
  activeTemplate.value = null
}

async function onDialogSave({ form, includeStructure }) {
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      await createScreeningTemplate(form)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('screeningTemplateCreateSuccess'),
      })
    } else {
      await updateScreeningTemplate(form.id, form, { includeStructure })
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('screeningTemplateUpdateSuccess'),
      })
    }
    closeDialog()
    await loadTemplates()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: screeningTemplateApiErrorMessage(
          error, t('screeningTemplateSaveError'),
        ),
      })
    }
  } finally {
    dialogSaving.value = false
  }
}

async function setStatus(row, status) {
  loading.value = true
  try {
    await updateScreeningTemplateStatus(row.id, status)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('screeningTemplateStatusSuccess'),
    })
    await loadTemplates()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: screeningTemplateApiErrorMessage(
          error, t('screeningTemplateStatusError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

async function removeTemplate(row) {
  loading.value = true
  try {
    await deleteScreeningTemplate(row.id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('screeningTemplateDeleteSuccess'),
    })
    await loadTemplates()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: screeningTemplateApiErrorMessage(
          error, t('screeningTemplateDeleteError'),
        ),
      })
    }
  } finally {
    loading.value = false
  }
}

function confirmDelete(row) {
  $q.dialog({
    title: t('screeningTemplateDeleteConfirmTitle'),
    message: t('screeningTemplateDeleteConfirmMessage', { name: row.name }),
    cancel: t('cancel'),
    ok: {
      label: t('screeningTemplateDelete'),
      color: 'negative',
      unelevated: true,
    },
    persistent: true,
  }).onOk(() => {
    void removeTemplate(row)
  })
}

function maybeOpenAddFromRoute() {
  if (route.meta?.screeningTemplateListAutoOpen === 'add'
    && canAddScreeningTemplate.value) {
    openAddDialog()
  }
}

watch(() => route.name, () => {
  maybeOpenAddFromRoute()
})

watch(searchQuery, () => {
  tablePagination.value = { ...tablePagination.value, page: 1 }
})

watch(
  () => [
    tablePagination.value.page,
    tablePagination.value.rowsPerPage,
    filteredRows.value.length,
    loading.value,
  ],
  () => {
    syncFooterPaginationBar()
  },
)

onMounted(async() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: filteredRows.value.length,
    disable: loading.value,
    summaryKey: 'screeningTemplateListPaginationSummary',
    onPageChange,
    onRowsPerPageChange,
  })
  await loadTemplates()
  maybeOpenAddFromRoute()
})

onBeforeUnmount(() => {
  clearFooterPagination()
})
</script>
