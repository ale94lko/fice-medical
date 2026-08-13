<template>
  <q-page
    class="admin-page admin-list-page consent-template-list-page"
    :data-testid="listTid.page">
    <AppLoadingOverlay scope="content" :showing="loading" />

    <AdminListPageHeader
      :title="t('consentTemplateListTitle')"
      :subtitle="t('consentTemplateListSubtitle')">
      <template #center>
        <q-input
          v-model="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="admin-list-page__search-input"
          :data-testid="listTid.search"
          :disable="loading"
          :placeholder="t('consentTemplateListSearchPlaceholder')"
        >
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>
      </template>
      <template #actions>
        <AdminListPageActions :actions="pageActions" />
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
        :rows="filteredRows"
        :columns="columns"
        :loading="false">
        <template #body-cell-name="scope">
          <q-td :props="scope" class="admin-data-table__primary-cell">
            {{ scope.row.name || '—' }}
          </q-td>
        </template>
        <template #body-cell-consentType="scope">
          <q-td :props="scope">
            {{ typeLabel(scope.row.consentType) }}
          </q-td>
        </template>
        <template #body-cell-required="scope">
          <q-td :props="scope">
            {{ scope.row.required ? t('yes') : t('no') }}
          </q-td>
        </template>
        <template #body-cell-signatureRequired="scope">
          <q-td :props="scope">
            {{ scope.row.signatureRequired ? t('yes') : t('no') }}
          </q-td>
        </template>
        <template #body-cell-active="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="scope.row.active
                ? t('consentTemplateActive')
                : t('consentTemplateInactive')"
              :variant="scope.row.active ? 'active' : 'inactive'"
            />
          </q-td>
        </template>
        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="visibility"
              class="app-btn-icon-action"
              :data-testid="listTid.rowView(row.id)"
              :aria-label="t('view')"
              @click="openView(row)"
            />
            <q-btn
              v-if="canEdit"
              flat
              round
              dense
              size="sm"
              icon="edit"
              class="app-btn-icon-action"
              :data-testid="listTid.rowEdit(row.id)"
              :aria-label="t('edit')"
              @click="openEdit(row)"
            />
            <q-btn
              v-if="canDelete"
              flat
              round
              dense
              size="sm"
              icon="delete"
              class="app-btn-icon-action"
              :data-testid="listTid.rowDelete(row.id)"
              :aria-label="t('delete')"
              @click="requestDeleteTemplate(row)"
            />
          </div>
        </template>
        <template #no-data>
          <div
            class="full-width row flex-center text-grey-7
              q-gutter-sm q-pa-lg">
            <q-icon name="inbox" size="md" />
            <span>{{ t('consentTemplateListEmpty') }}</span>
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <ConsentTemplateDialog
      v-model="templateDialogOpen"
      :mode="templateDialogMode"
      :template="activeTemplate"
      :versions="activeVersions"
      :versions-loading="versionsLoading"
      :saving="templateSaving"
      :can-edit-versions="canEdit"
      :can-publish="canPublish"
      :can-delete-versions="canDelete"
      @save="onSaveTemplate"
      @add-version="openAddVersion"
      @edit-version="openEditVersion"
      @preview-version="onPreviewVersion"
      @publish-version="onPublishVersion"
      @delete-version="requestDeleteVersion"
    />

    <ConsentVersionDialog
      v-model="versionDialogOpen"
      :mode="versionDialogMode"
      :version="activeVersion"
      :saving="versionSaving"
      @save="onSaveVersion"
    />

    <ConsentContentPreviewDialog
      v-model="previewOpen"
      :title="previewTitle"
      :content-html="previewHtml"
    />

    <ModalComponent
      v-model="deleteConfirmOpen"
      test-id="consent-template-delete"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      @confirm="confirmDelete"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ModalComponent from 'components/ModalComponent.vue'
import ConsentContentPreviewDialog from
  'components/admin/ConsentContentPreviewDialog.vue'
import ConsentTemplateDialog from
  'components/admin/ConsentTemplateDialog.vue'
import ConsentVersionDialog from
  'components/admin/ConsentVersionDialog.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useConsentPermissions } from
  'src/composables/useConsentPermissions.js'
import { consentTemplateListTestIds as listTid } from
  'src/test-ids/index.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  consentApiErrorMessage,
  createConsentTemplate,
  createConsentVersion,
  deleteConsentTemplate,
  deleteConsentVersion,
  listConsentTemplates,
  listConsentVersions,
  publishConsentVersion,
  updateConsentTemplate,
  updateConsentVersion,
} from 'src/utils/consent-api.js'
import { consentTypeI18nKey } from 'src/utils/consent-i18n.js'

const { t, te } = useI18n()
const $q = useQuasar()
const {
  canCreate,
  canEdit,
  canPublish,
  canDelete,
} = useConsentPermissions()

const loading = ref(false)
const rows = ref([])
const searchQuery = ref('')
const tablePagination = ref({
  page: 1,
  rowsPerPage: 20,
  sortBy: 'name',
  descending: false,
})

const templateDialogOpen = ref(false)
const templateDialogMode = ref('add')
const activeTemplate = ref(null)
const activeVersions = ref([])
const versionsLoading = ref(false)
const templateSaving = ref(false)

const versionDialogOpen = ref(false)
const versionDialogMode = ref('add')
const activeVersion = ref(null)
const versionSaving = ref(false)

const previewOpen = ref(false)
const previewTitle = ref('')
const previewHtml = ref('')

const deleteConfirmOpen = ref(false)
const deleteTarget = ref(null)

const pageActions = computed(() => {
  if (!canCreate.value) {
    return []
  }

  return [{
    key: 'add',
    label: t('consentTemplateAdd'),
    icon: 'add',
    variant: 'primary',
    testId: listTid.add,
    disable: loading.value,
    onClick: openAdd,
  }]
})

const filteredRows = computed(() => {
  const query = String(searchQuery.value ?? '').trim().toLowerCase()
  if (!query) {
    return rows.value
  }

  return rows.value.filter(row => {
    const haystack = [
      row.name,
      row.consentType,
      row.description,
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
})

const columns = computed(() => [
  {
    name: 'name',
    label: t('consentTemplateName'),
    align: 'left',
    field: 'name',
    sortable: true,
  },
  {
    name: 'consentType',
    label: t('consentTemplateType'),
    align: 'left',
    field: 'consentType',
    sortable: true,
  },
  {
    name: 'required',
    label: t('consentTemplateRequired'),
    align: 'left',
    field: 'required',
  },
  {
    name: 'signatureRequired',
    label: t('consentTemplateSignatureRequired'),
    align: 'left',
    field: 'signatureRequired',
  },
  {
    name: 'active',
    label: t('consentTemplateActive'),
    align: 'left',
    field: 'active',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: 'right',
    field: 'id',
  },
])

const deleteConfirmTitle = computed(() => {
  if (deleteTarget.value?.kind === 'version') {
    return t('consentVersionDeleteTitle')
  }

  return t('consentTemplateDeleteTitle')
})

const deleteConfirmMessage = computed(() => {
  if (deleteTarget.value?.kind === 'version') {
    return t('consentVersionDeleteMessage')
  }

  return t('consentTemplateDeleteMessage')
})

function typeLabel(type) {
  const key = consentTypeI18nKey(type)

  return te(key) ? t(key) : (type || '—')
}

function notifyError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: consentApiErrorMessage(error, t(fallbackKey)),
  })
}

async function loadTemplates() {
  loading.value = true
  try {
    rows.value = await listConsentTemplates()
  } catch (error) {
    notifyError(error, 'consentTemplateListLoadError')
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadVersions(templateId) {
  if (!templateId) {
    activeVersions.value = []

    return
  }
  versionsLoading.value = true
  try {
    activeVersions.value = await listConsentVersions(templateId)
  } catch (error) {
    notifyError(error, 'consentVersionsLoadError')
    activeVersions.value = []
  } finally {
    versionsLoading.value = false
  }
}

function openAdd() {
  activeTemplate.value = null
  activeVersions.value = []
  templateDialogMode.value = 'add'
  templateDialogOpen.value = true
}

async function openView(row) {
  activeTemplate.value = row
  templateDialogMode.value = 'view'
  templateDialogOpen.value = true
  await loadVersions(row.id)
}

async function openEdit(row) {
  activeTemplate.value = row
  templateDialogMode.value = 'edit'
  templateDialogOpen.value = true
  await loadVersions(row.id)
}

async function onSaveTemplate(form) {
  templateSaving.value = true
  try {
    if (activeTemplate.value?.id) {
      activeTemplate.value = await updateConsentTemplate(
        activeTemplate.value.id,
        form,
      )
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('consentTemplateUpdateSuccess'),
      })
    } else {
      activeTemplate.value = await createConsentTemplate(form)
      templateDialogMode.value = 'edit'
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('consentTemplateCreateSuccess'),
      })
    }
    await loadTemplates()
    await loadVersions(activeTemplate.value.id)
  } catch (error) {
    notifyError(error, 'consentTemplateSaveError')
  } finally {
    templateSaving.value = false
  }
}

function openAddVersion() {
  activeVersion.value = null
  versionDialogMode.value = 'add'
  versionDialogOpen.value = true
}

function openEditVersion(version) {
  activeVersion.value = version
  versionDialogMode.value = 'edit'
  versionDialogOpen.value = true
}

function onPreviewVersion(version) {
  previewTitle.value = version?.version || t('consentContentPreviewTitle')
  previewHtml.value = version?.contentHtml || ''
  previewOpen.value = true
}

async function onSaveVersion(form) {
  if (!activeTemplate.value?.id) {
    return
  }
  versionSaving.value = true
  try {
    if (activeVersion.value?.id) {
      await updateConsentVersion(
        activeTemplate.value.id,
        activeVersion.value.id,
        form,
      )
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('consentVersionUpdateSuccess'),
      })
    } else {
      await createConsentVersion(activeTemplate.value.id, form)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('consentVersionCreateSuccess'),
      })
    }
    versionDialogOpen.value = false
    await loadVersions(activeTemplate.value.id)
  } catch (error) {
    notifyError(error, 'consentVersionSaveError')
  } finally {
    versionSaving.value = false
  }
}

async function onPublishVersion(version) {
  if (!activeTemplate.value?.id || !version?.id) {
    return
  }
  try {
    await publishConsentVersion(activeTemplate.value.id, version.id)
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('consentVersionPublishSuccess'),
    })
    await loadVersions(activeTemplate.value.id)
  } catch (error) {
    notifyError(error, 'consentVersionPublishError')
  }
}

function requestDeleteTemplate(row) {
  deleteTarget.value = { kind: 'template', row }
  deleteConfirmOpen.value = true
}

function requestDeleteVersion(version) {
  deleteTarget.value = { kind: 'version', version }
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  const target = deleteTarget.value
  deleteConfirmOpen.value = false
  deleteTarget.value = null
  if (!target) {
    return
  }
  try {
    if (target.kind === 'version') {
      await deleteConsentVersion(
        activeTemplate.value.id,
        target.version.id,
      )
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('consentVersionDeleteSuccess'),
      })
      await loadVersions(activeTemplate.value.id)

      return
    }
    await deleteConsentTemplate(target.row.id)
    templateDialogOpen.value = false
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('consentTemplateDeleteSuccess'),
    })
    await loadTemplates()
  } catch (error) {
    notifyError(error, 'consentDeleteError')
  }
}

onMounted(() => {
  void loadTemplates()
})
</script>
