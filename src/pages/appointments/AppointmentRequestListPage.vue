<template>
  <q-page
    class="admin-page admin-list-page
      appointment-request-list-page"
    :data-testid="tid.page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading || actionSaving"
    />

    <AdminListPageHeader
      :title="t('appointmentRequestsTitle')"
      :subtitle="isMobile ? '' : t('appointmentRequestsSubtitle')">
      <template
        v-if="!isMobile"
        #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="tid.refresh"
          :label="t('claimQueueRefresh')"
          @click="loadRows"
        />
      </template>
    </AdminListPageHeader>

    <div class="billing-queue-filters">
      <q-input
        v-model="searchQuery"
        outlined
        clearable
        hide-bottom-space
        class="billing-queue-filters__search"
        :data-testid="tid.search"
        :disable="loading"
        :placeholder="t('appointmentRequestSearchPlaceholder')"
        :aria-label="t('appointmentRequestSearchPlaceholder')">
        <template #prepend>
          <q-icon name="search" size="18px" />
        </template>
      </q-input>
      <FormSelect
        v-if="!isMobile"
        v-model="statusFilter"
        :options="statusFilterOptions"
        emit-value
        map-options
        outlined
        hide-bottom-space
        :clearable="false"
        :disable="loading"
        :test-id="tid.statusFilter"
        :aria-label="t('appointmentRequestColumnStatus')"
      />
      <AdminListPageActions
        v-if="isMobile"
        :compact="true"
        :actions="mobilePageActions"
        :menu-test-id="tid.actionsMenu">
        <template #menu-extra>
          <FormSelect
            v-model="statusFilter"
            :options="statusFilterOptions"
            emit-value
            map-options
            outlined
            dense
            hide-bottom-space
            :clearable="false"
            :disable="loading"
            :test-id="tid.statusFilter"
            :aria-label="t('appointmentRequestColumnStatus')"
          />
        </template>
      </AdminListPageActions>
    </div>

    <AdminTablePanel
      class="admin-list-page__table-panel"
      :show-column-settings="false">
      <AdminQTable
        class="table admin-data-table"
        flat
        row-key="id"
        v-model:pagination="tablePagination"
        :rows-per-page-options="[10, 20, 50]"
        :grid="showGrid"
        :rows="filteredRows"
        :columns="columns"
        :loading="false">
        <template #body-cell-client="scope">
          <q-td
            :props="scope"
            class="admin-data-table__primary-cell">
            <button
              v-if="scope.row.clientNumber"
              type="button"
              class="admin-data-table__link"
              :data-testid="tid.rowClient(scope.row.id)"
              @click="openClient(scope.row)">
              {{ clientLabel(scope.row) }}
            </button>
            <span v-else>{{ clientLabel(scope.row) }}</span>
          </q-td>
        </template>
        <template #body-cell-status="scope">
          <q-td :props="scope">
            <AdminTableStatusCell
              :label="statusLabel(scope.row.status)"
              :variant="appointmentRequestStatusVariant(
                scope.row.status,
              )"
            />
          </q-td>
        </template>
        <template #row-actions="{ row }">
          <div class="admin-table-row-actions">
            <q-btn
              v-if="canCreateClient(row)"
              flat
              round
              dense
              icon="person_add"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :data-testid="tid.rowCreateClient(row.id)"
              :aria-label="t('appointmentRequestCreateClient')"
              @click="openCreateClient(row)">
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('appointmentRequestCreateClient') }}
              </q-tooltip>
            </q-btn>
            <q-btn
              v-if="canActOn(row)"
              flat
              round
              dense
              icon="event"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :data-testid="tid.rowSchedule(row.id)"
              :aria-label="t('appointmentRequestSchedule')"
              @click="openSchedule(row)">
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('appointmentRequestSchedule') }}
              </q-tooltip>
            </q-btn>
            <q-btn
              v-if="canActOn(row)"
              flat
              round
              dense
              icon="block"
              color="warning"
              class="app-btn-icon-action"
              :size="siteBreakpoints.SM"
              :data-testid="tid.rowDecline(row.id)"
              :aria-label="t('appointmentRequestDecline')"
              @click="openDecline(row)">
              <q-tooltip
                class="app-info-tooltip"
                anchor="top middle"
                self="bottom middle"
                :offset="[0, 6]">
                {{ t('appointmentRequestDecline') }}
              </q-tooltip>
            </q-btn>
          </div>
        </template>
        <template #no-data>
          <div class="q-pa-lg text-grey-7">
            {{ t('appointmentRequestEmpty') }}
          </div>
        </template>
      </AdminQTable>
    </AdminTablePanel>

    <AppointmentBookDialog
      v-model="bookDialogOpen"
      mode="book"
      :client-id="activeRequest?.clientId ?? null"
      :saving="actionSaving"
      :booking-hint="bookHint"
      :initial-service-procedure-ids="initialServiceIds"
      :initial-clinician-id="activeRequest?.clinicianId ?? null"
      :initial-notes="activeRequest?.notes ?? ''"
      @booked="onBookAppointment"
      @cancel="onBookDialogCancel"
    />

    <ModalComponent
      v-model="declineOpen"
      :title="t('appointmentRequestDeclineTitle')"
      :message="t('appointmentRequestDeclineMessage')"
      :confirm-text="t('appointmentRequestDecline')"
      :cancel-text="t('cancel')"
      test-id="appointment-request-decline"
      @confirm="onConfirmDecline"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  siteBreakpoints,
} from 'components/constants.js'
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminQTable from 'components/AdminQTable.vue'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import AppointmentBookDialog from 'components/AppointmentBookDialog.vue'
import FormSelect from 'components/FormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { useAdminTableMobileGrid } from
  'src/composables/useAdminTableMobileGrid.js'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { useCalendarPermissions } from
  'src/composables/useCalendarPermissions.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { appointmentConflictI18nKey } from
  'src/utils/appointment-api.js'
import {
  appointmentRequestApiErrorMessage,
  fulfillAppointmentRequest,
  listStaffAppointmentRequests,
  rejectAppointmentRequest,
} from 'src/utils/appointment-request-api.js'
import {
  appointmentRequestMatchesQuery,
  appointmentRequestStatusFilterValues as statusFilters,
  appointmentRequestStatusI18nKey,
  appointmentRequestStatusVariant,
  bookingHintFromRequest,
  preferredTimeLabel,
} from 'src/utils/appointment-request-normalize.js'
import { formatUtcDateLong } from 'src/utils/appointment-datetime.js'
import { notifyBookedAppointment } from
  'src/utils/telehealth-appointment-ui.js'
import { appointmentRequestListTestIds as tid } from
  'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { isMobile } = useViewportLayout()
const { showGrid } = useAdminTableMobileGrid()
const { canBookAppointment } = useCalendarPermissions()
const { canAddClient } = useClientPermissions()
const {
  setFooterPagination,
  patchFooterPagination,
  clearFooterPagination,
} = useAppFooterPagination()

useSyncAppPageTitle(computed(() => t('appointmentRequestsTitle')))

const loading = ref(false)
const actionSaving = ref(false)
const searchQuery = ref('')
const statusFilter = ref(statusFilters.pending)
const rows = ref([])
const bookDialogOpen = ref(false)
const bookHint = ref(null)
const activeRequest = ref(null)
const declineOpen = ref(false)
const declineTarget = ref(null)
const tablePagination = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
})

const statusFilterOptions = computed(() => [
  {
    label: t('appointmentRequestFilterPending'),
    value: statusFilters.pending,
  },
  {
    label: t('appointmentRequestFilterAll'),
    value: statusFilters.all,
  },
  {
    label: t('appointmentRequestFilterFulfilled'),
    value: statusFilters.fulfilled,
  },
  {
    label: t('appointmentRequestFilterRejected'),
    value: statusFilters.rejected,
  },
  {
    label: t('appointmentRequestFilterCancelled'),
    value: statusFilters.cancelled,
  },
])

const filteredRows = computed(() => rows.value.filter(row =>
  appointmentRequestMatchesQuery(row, searchQuery.value),
))

const initialServiceIds = computed(() => {
  const id = activeRequest.value?.serviceProcedureId
  return id ? [id] : []
})

const columns = computed(() => [
  {
    name: 'client',
    label: t('appointmentRequestColumnClient'),
    align: 'left',
    field: row => clientLabel(row),
  },
  {
    name: 'preferredTime',
    label: t('appointmentRequestColumnPreferredTime'),
    align: 'left',
    field: row => preferredTimeLabel(
      row,
      t('appointmentRequestTimeUnset'),
    ),
  },
  {
    name: 'service',
    label: t('appointmentRequestColumnService'),
    align: 'left',
    field: row => row.serviceName || '—',
  },
  {
    name: 'clinician',
    label: t('appointmentRequestColumnClinician'),
    align: 'left',
    field: row => row.clinicianName || '—',
  },
  {
    name: 'notes',
    label: t('appointmentRequestColumnNotes'),
    align: 'left',
    field: row => row.notes || '—',
  },
  {
    name: 'status',
    label: t('appointmentRequestColumnStatus'),
    align: 'left',
    field: row => row.status,
  },
  {
    name: 'requested',
    label: t('appointmentRequestColumnRequested'),
    align: 'left',
    field: row => formatUtcDateLong(row.createdAt) || '—',
  },
  {
    name: 'actions',
    label: t('actions'),
    field: 'actions',
    align: 'right',
  },
])

function clientLabel(row) {
  return row.clientName
    || row.clientNumber
    || t('appointmentRequestNoClient')
}

function statusLabel(status) {
  const key = appointmentRequestStatusI18nKey(status)
  return key ? t(key) : (status || '—')
}

function canActOn(row) {
  return Boolean(canBookAppointment.value && row?.canReject)
}

function canCreateClient(row) {
  return Boolean(canAddClient.value && row?.canCreateClient)
}

function openCreateClient(row) {
  const accountId = row?.clientAccountId
  if (!accountId) {
    return
  }
  void router.push({
    path: '/clients/add',
    query: { portalAccountId: String(accountId) },
  })
}

function openClient(row) {
  const number = String(row?.clientNumber ?? '').trim()
  if (!number) {
    return
  }
  void router.push({
    name: 'ClientOverview',
    params: { id: number },
  })
}

function openSchedule(row) {
  if (!row?.canFulfill) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('appointmentRequestFulfillNeedClient'),
    })
    return
  }
  activeRequest.value = row
  bookHint.value = bookingHintFromRequest(row)
  bookDialogOpen.value = true
}

function onBookDialogCancel() {
  bookDialogOpen.value = false
  bookHint.value = null
  activeRequest.value = null
}

function openDecline(row) {
  declineTarget.value = row
  declineOpen.value = true
}

function notifyError(error, fallbackKey) {
  if (isAuthSessionEndUIError(error)) {
    return
  }
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: appointmentRequestApiErrorMessage(
      error,
      t(fallbackKey),
    ),
  })
}

function syncFooterPaginationBar() {
  patchFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    disable: loading.value || actionSaving.value,
    onPageChange,
    onRowsPerPageChange,
  })
}

function onPageChange(page) {
  tablePagination.value.page = page
  syncFooterPaginationBar()
}

function onRowsPerPageChange(rowsPerPage) {
  tablePagination.value.rowsPerPage = rowsPerPage
  tablePagination.value.page = 1
  syncFooterPaginationBar()
}

async function loadRows() {
  loading.value = true
  try {
    rows.value = await listStaffAppointmentRequests(
      statusFilter.value,
    )
    tablePagination.value.page = 1
    tablePagination.value.rowsNumber = filteredRows.value.length
    syncFooterPaginationBar()
  } catch (error) {
    notifyError(error, 'appointmentRequestLoadError')
  } finally {
    loading.value = false
    syncFooterPaginationBar()
  }
}

const mobilePageActions = computed(() => [
  {
    key: 'refresh',
    label: t('claimQueueRefresh'),
    icon: 'sync',
    testId: tid.refresh,
    disable: loading.value,
    onClick: loadRows,
  },
])

async function onBookAppointment(body) {
  const requestId = activeRequest.value?.id
  if (!requestId) {
    return
  }
  actionSaving.value = true
  try {
    const result = await fulfillAppointmentRequest(requestId, body)
    bookDialogOpen.value = false
    bookHint.value = null
    activeRequest.value = null
    const message = result.appointments?.length
      ? t('appointmentBookSeriesSuccess', {
        count: result.appointments.length,
      })
      : t('appointmentBookSuccess')
    notifyBookedAppointment($q, t, result, message)
    await loadRows()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const conflictKey = appointmentConflictI18nKey(error)
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: conflictKey
          ? t(conflictKey)
          : appointmentRequestApiErrorMessage(
            error,
            t('appointmentBookError'),
          ),
      })
    }
  } finally {
    actionSaving.value = false
  }
}

async function onConfirmDecline() {
  const requestId = declineTarget.value?.id
  declineOpen.value = false
  if (!requestId) {
    declineTarget.value = null
    return
  }
  actionSaving.value = true
  try {
    await rejectAppointmentRequest(requestId)
    declineTarget.value = null
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('appointmentRequestDeclineSuccess'),
    })
    await loadRows()
  } catch (error) {
    notifyError(error, 'appointmentRequestDeclineError')
  } finally {
    actionSaving.value = false
  }
}

watch(statusFilter, () => {
  void loadRows()
})

watch(searchQuery, () => {
  tablePagination.value.page = 1
  tablePagination.value.rowsNumber = filteredRows.value.length
  syncFooterPaginationBar()
})

watch(filteredRows, next => {
  tablePagination.value.rowsNumber = next.length
  syncFooterPaginationBar()
})

onMounted(() => {
  setFooterPagination({
    page: tablePagination.value.page,
    rowsPerPage: tablePagination.value.rowsPerPage,
    rowsNumber: tablePagination.value.rowsNumber,
    rowsPerPageChoices: [10, 20, 50],
    disable: loading.value,
    perPageKey: 'adminTablePerPage',
    onPageChange,
    onRowsPerPageChange,
  })
  void loadRows()
})

onBeforeUnmount(() => {
  clearFooterPagination()
})
</script>
