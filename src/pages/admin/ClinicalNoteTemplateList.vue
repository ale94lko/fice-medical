<template>
  <q-page
    class="admin-page admin-list-page"
    :data-testid="tid.page">
    <AppLoadingOverlay scope="content" :showing="loading" />
    <AdminListPageHeader
      :title="t('clinicalNoteTemplateListTitle')"
      :subtitle="t('clinicalNoteTemplateListSubtitle')">
      <template #center>
        <q-input
          v-model="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="admin-list-page__search-input"
          :data-testid="tid.search"
          :placeholder="t('clinicalNoteTemplateListSearchPlaceholder')">
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>
      </template>
      <template #actions>
        <AdminListPageActions :actions="pageActions" />
      </template>
    </AdminListPageHeader>
    <AdminTablePanel class="admin-list-page__table-panel">
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[20, 50, 100]"
        :rows="filteredRows"
        :columns="columns">
        <template #body-cell-name="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            <button
              type="button"
              class="admin-data-table__link"
              @click="viewRow(scope.row)">
              {{ scope.row.name || '—' }}
            </button>
          </q-td>
        </template>
        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row.status === 'ACTIVE'
                ? t('clinicalNoteTemplateStatusActive')
                : t('clinicalNoteTemplateStatusInactive')"
              :variant="scope.row.status === 'ACTIVE'
                ? 'positive' : 'warning'"
            />
          </q-td>
        </template>
        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              flat round dense size="sm" icon="visibility"
              class="app-btn-icon-action"
              :aria-label="t('view')"
              @click="viewRow(row)"
            />
            <q-btn
              v-if="canEdit && !row.systemTemplate"
              flat round dense size="sm" icon="edit"
              class="app-btn-icon-action"
              :aria-label="t('edit')"
              @click="editRow(row)"
            />
            <q-btn
              v-if="canDuplicate"
              flat round dense size="sm" icon="content_copy"
              class="app-btn-icon-action"
              :aria-label="t('clinicalNoteTemplateDuplicate')"
              @click="duplicateRow(row)"
            />
            <q-btn
              v-if="canActivate && row.status !== 'ACTIVE'"
              flat round dense size="sm" icon="check_circle"
              color="positive" class="app-btn-icon-action"
              :aria-label="t('clinicalNoteTemplateActivate')"
              @click="setStatus(row, 'ACTIVE')"
            />
            <q-btn
              v-if="canDeactivate && row.status === 'ACTIVE'
                && !row.systemTemplate"
              flat round dense size="sm" icon="block"
              color="warning" class="app-btn-icon-action"
              :aria-label="t('clinicalNoteTemplateDeactivate')"
              @click="setStatus(row, 'INACTIVE')"
            />
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>
    <ClinicalNoteTemplateDialog
      v-model="dialogOpen"
      :template="activeTemplate"
      :mode="dialogMode"
      :saving="dialogSaving"
      :assessment-options="assessmentOptions"
      @save="onSave"
      @preview="openPreview"
    />
    <ClinicalNoteTemplatePreviewDialog
      v-model="previewOpen"
      :template="previewTemplate"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClinicalNoteTemplateDialog from
  'components/admin/ClinicalNoteTemplateDialog.vue'
import ClinicalNoteTemplatePreviewDialog from
  'components/admin/ClinicalNoteTemplatePreviewDialog.vue'
import { useClinicalNoteTemplatePermissions } from
  'src/composables/useClinicalNoteTemplatePermissions.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { clinicalNoteTemplateListTestIds as tid } from
  'src/test-ids/index.js'
import {
  createClinicalNoteTemplate,
  duplicateClinicalNoteTemplate,
  fetchClinicalNoteTemplate,
  listClinicalNoteTemplates,
  clinicalNoteTemplateApiErrorMessage,
  updateClinicalNoteTemplate,
  updateClinicalNoteTemplateStatus,
} from 'src/utils/clinical-note-template-api.js'
import { fetchScreeningTemplates } from 'src/utils/screening-api.js'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const {
  canCreate,
  canEdit,
  canDuplicate,
  canActivate,
  canDeactivate,
} = useClinicalNoteTemplatePermissions()
const { setFooterPagination, clearFooterPagination } = useAppFooterPagination()

const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('add')
const dialogSaving = ref(false)
const activeTemplate = ref(null)
const previewOpen = ref(false)
const previewTemplate = ref(null)
const assessmentOptions = ref([])
const tablePagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const columns = computed(() => [
  {
    name: 'name',
    label: t('clinicalNoteTemplateNameLabel'),
    field: 'name',
    align: 'left',
  },
  {
    name: 'version',
    label: t('clinicalNoteTemplateVersionLabel'),
    field: 'version',
    align: 'left',
  },
  {
    name: 'status',
    label: t('clinicalNoteTemplateStatusLabel'),
    field: 'status',
    align: 'left',
  },
  { name: 'actions', label: t('actions'), field: 'actions', align: 'right' },
])

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    return rows.value
  }

  return rows.value.filter(row => row.name.toLowerCase().includes(q))
})

const pageActions = computed(() => canCreate.value
  ? [{
    key: 'add',
    label: t('clinicalNoteTemplateListAdd'),
    icon: 'add',
    testId: tid.add,
    onClick: openAdd,
  }]
  : [])

async function loadRows() {
  loading.value = true
  try {
    rows.value = await listClinicalNoteTemplates()
    tablePagination.value.rowsNumber = rows.value.length
    setFooterPagination({
      page: 1,
      rowsPerPage: tablePagination.value.rowsPerPage,
      rowsNumber: rows.value.length,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: clinicalNoteTemplateApiErrorMessage(
        error,
        t('clinicalNoteTemplateListError'),
      ),
    })
  } finally {
    loading.value = false
  }
}

async function loadAssessments() {
  try {
    const templates = await fetchScreeningTemplates()
    assessmentOptions.value = (templates || []).map(item => ({
      label: item.name || item.templateName,
      value: item.id,
    }))
  } catch {
    assessmentOptions.value = []
  }
}

function openAdd() {
  dialogMode.value = 'add'
  activeTemplate.value = null
  dialogOpen.value = true
}

async function viewRow(row) {
  try {
    dialogMode.value = 'view'
    activeTemplate.value = await fetchClinicalNoteTemplate(row.id)
    dialogOpen.value = true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: clinicalNoteTemplateApiErrorMessage(
        error,
        t('clinicalNoteTemplateListError'),
      ),
    })
  }
}

async function editRow(row) {
  try {
    dialogMode.value = 'edit'
    activeTemplate.value = await fetchClinicalNoteTemplate(row.id)
    dialogOpen.value = true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: clinicalNoteTemplateApiErrorMessage(
        error,
        t('clinicalNoteTemplateListError'),
      ),
    })
  }
}

function openPreview(template) {
  previewTemplate.value = template
  previewOpen.value = true
}

async function onSave(form) {
  dialogSaving.value = true
  try {
    if (form.id) {
      await updateClinicalNoteTemplate(form.id, form)
    } else {
      await createClinicalNoteTemplate(form)
    }
    dialogOpen.value = false
    $q.notify({
      type: 'positive',
      message: t('clinicalNoteTemplateSaveSuccess'),
    })
    await loadRows()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: clinicalNoteTemplateApiErrorMessage(
        error,
        t('clinicalNoteTemplateSaveError'),
      ),
    })
  } finally {
    dialogSaving.value = false
  }
}

async function duplicateRow(row) {
  try {
    await duplicateClinicalNoteTemplate(row.id)
    $q.notify({
      type: 'positive',
      message: t('clinicalNoteTemplateDuplicateSuccess'),
    })
    await loadRows()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: clinicalNoteTemplateApiErrorMessage(
        error,
        t('clinicalNoteTemplateDuplicateError'),
      ),
    })
  }
}

async function setStatus(row, status) {
  try {
    await updateClinicalNoteTemplateStatus(row.id, status)
    await loadRows()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: clinicalNoteTemplateApiErrorMessage(
        error,
        t('clinicalNoteTemplateStatusError'),
      ),
    })
  }
}

onMounted(() => {
  void loadRows()
  void loadAssessments()
  if (route.meta?.clinicalNoteTemplateListAutoOpen === 'add') {
    openAdd()
  }
})

onBeforeUnmount(() => {
  clearFooterPagination()
})
</script>
