<template>
  <div class="add-client-appointments-tab">
    <div
      v-if="!hasClientId"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <div
      v-else-if="!canViewAppointments"
      class="fmh-list-card q-pa-lg text-center">
      <q-icon name="lock" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentNoPermission') }}
      </p>
    </div>

    <template v-else>
      <div
        class="appointments-header row items-center"
        :class="{
          'justify-end': !showTitle && !showSubtitle,
        }">
        <div
          v-if="showTitle || showSubtitle"
          class="col">
          <SectionHeading
            v-if="showTitle"
            icon="event"
            :title="t('appointmentsTitle')"
          />
          <p
            v-if="showSubtitle"
            class="appointments-subtitle text-body2">
            {{ t('appointmentsSubtitle') }}
          </p>
        </div>
        <div
          v-if="showAppointmentSearch && !isMobile"
          class="col-grow appointments-header__search">
          <q-input
            :model-value="searchQuery"
            outlined
            dense
            clearable
            hide-bottom-space
            class="admin-list-page__search-input
              appointments-header__search-input"
            :data-testid="tid.field('search')"
            :disable="actionSaving"
            :loading="searchLoading"
            :placeholder="t('appointmentListSearchPlaceholder')"
            :aria-label="t('appointmentListSearchPlaceholder')"
            @update:model-value="setSearchQuery"
            @clear="resetSearchQuery">
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>
          <p
            v-if="searchHint"
            class="appointments-header__search-hint text-caption
              text-grey-7 q-mb-none q-mt-xs">
            {{ searchHint }}
          </p>
        </div>
        <div
          v-if="canBookAppointment && !isMobile"
          class="col-auto">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :disable="actionSaving"
            :label="t('appointmentAddButton')"
            :data-testid="tid.btn('add')"
            @click="openBookDrawer"
          />
        </div>
        <div
          v-if="showMobileActionsMenu"
          class="col-auto appointments-header__actions
            appointments-header__actions--menu">
          <q-btn
            unelevated
            outline
            no-caps
            color="primary"
            :icon="adminTableActionIcons.more"
            class="app-btn-outline appointments-header__menu-btn"
            :disable="actionSaving"
            :data-testid="tid.btn('actions-menu')"
            :aria-label="t('moreActions')">
            <q-tooltip
              class="app-info-tooltip"
              anchor="top middle"
              self="bottom middle"
              :offset="[0, 6]">
              {{ t('moreActions') }}
            </q-tooltip>
            <q-menu
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
              class="app-light-menu appointments-header__actions-menu">
              <div
                v-if="showAppointmentSearch"
                class="appointments-header__actions-menu-extra"
                @click.stop>
                <q-input
                  :model-value="searchQuery"
                  outlined
                  dense
                  clearable
                  hide-bottom-space
                  class="admin-list-page__search-input
                    appointments-header__search-input"
                  :data-testid="tid.field('search')"
                  :disable="actionSaving"
                  :loading="searchLoading"
                  :placeholder="
                    t('appointmentListSearchPlaceholder')
                  "
                  :aria-label="
                    t('appointmentListSearchPlaceholder')
                  "
                  @update:model-value="setSearchQuery"
                  @clear="resetSearchQuery">
                  <template #prepend>
                    <q-icon name="search" size="18px" />
                  </template>
                </q-input>
                <p
                  v-if="searchHint"
                  class="appointments-header__search-hint
                    text-caption text-grey-7 q-mb-none q-mt-xs">
                  {{ searchHint }}
                </p>
              </div>
              <q-list
                v-if="canBookAppointment"
                dense
                style="min-width: 220px">
                <q-item
                  v-close-popup
                  clickable
                  :disable="actionSaving"
                  :data-testid="tid.btn('add')"
                  @click="openBookDrawer">
                  <q-item-section avatar>
                    <q-icon
                      name="add"
                      color="primary"
                      size="18px"
                    />
                  </q-item-section>
                  <q-item-section>
                    {{ t('appointmentAddButton') }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <AdminTablePanel
        class="appointments-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <AppointmentsTable
          :rows="appointmentRows"
          :empty-label="listEmptyLabel"
          :permissions="tablePermissions"
          @view="openView"
          @edit="openEdit"
          @cancel="confirmCancel"
          @delete="confirmDelete"
          @reschedule="openReschedule"
          @check-in="onCheckIn"
          @complete="onComplete"
          @no-show="onNoShow"
        />
      </AdminTablePanel>
      <AdminTablePaginationBar
        v-if="showSearchPagination"
        class="q-mt-sm"
        :page="tablePagination.page"
        :rows-per-page="tablePagination.rowsPerPage"
        :rows-number="tablePagination.rowsNumber"
        :disable="searchLoading || actionSaving"
        @update:page="onPageChange"
        @update:rows-per-page="onRowsPerPageChange"
      />
    </template>

    <AppointmentBookDialog
      v-model="bookDrawerOpen"
      :client-id="clientId"
      mode="book"
      :saving="actionSaving"
      :referral-id="bookingReferralId"
      :initial-clinician-id="bookingClinicianId"
      :assigned-clinician-id="assignedClinicianId"
      @booked="onBook"
      @cancel="onBookCancel"
    />

    <AppointmentBookDialog
      v-model="rescheduleDrawerOpen"
      :client-id="clientId"
      mode="reschedule"
      :appointment="activeAppointment"
      :saving="actionSaving"
      @rescheduled="onReschedule"
      @cancel="rescheduleDrawerOpen = false"
    />

    <AppointmentDetailDialog
      v-model="detailOpen"
      :record="activeAppointment"
      :show-view-client="false"
    />

    <AppointmentEditDialog
      v-model="editOpen"
      :record="activeAppointment"
      :saving="actionSaving"
      @save="onEditSave"
      @cancel="editOpen = false"
    />

    <ModalComponent
      v-model="cancelDialogOpen"
      :title="t('appointmentCancelConfirmTitle')"
      :message="t('appointmentCancelConfirmMessage')"
      :confirm-text="t('appointmentActionCancel')"
      :cancel-text="t('cancel')"
      test-id="appointment-cancel"
      @confirm="onCancelConfirmed"
    />

    <ModalComponent
      v-model="deleteDialogOpen"
      :title="t('appointmentDeleteConfirmTitle')"
      :message="t('appointmentDeleteConfirmMessage')"
      :confirm-text="t('appointmentActionDelete')"
      :cancel-text="t('cancel')"
      test-id="appointment-delete"
      @confirm="onDeleteConfirmed"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AdminTablePaginationBar from
  'components/admin-table/AdminTablePaginationBar.vue'
import AppointmentBookDialog from 'components/AppointmentBookDialog.vue'
import AppointmentDetailDialog from 'components/AppointmentDetailDialog.vue'
import AppointmentEditDialog from 'components/AppointmentEditDialog.vue'
import AppointmentsTable from 'components/AppointmentsTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import SectionHeading from './SectionHeading.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientAppointmentPermissions } from
  'src/composables/useClientAppointmentPermissions.js'
import { useClientAppointmentSearch } from
  'src/composables/useClientAppointmentSearch.js'
import {
  bookAppointment,
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  deleteAppointment,
  appointmentConflictI18nKey,
  noShowAppointment,
  patchAppointment,
  rescheduleAppointment,
} from 'src/utils/appointment-api.js'
import { mapAppointmentsList } from 'src/utils/appointment-normalize.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { fetchClientActiveEncounter } from 'src/utils/encounter-api.js'
import { notifyBookedAppointment } from
  'src/utils/telehealth-appointment-ui.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'
import { adminTableActionIcons } from 'src/constants/admin-table.js'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  appointments: {
    type: Array,
    default: () => [],
  },
  showSubtitle: {
    type: Boolean,
    default: false,
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
  bookingReferral: {
    type: Object,
    default: null,
  },
  assignedClinicianId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits([
  'checked-in',
  'booking-referral-consumed',
  'reassign-clinician',
])

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const { isMobile } = useViewportLayout()
const {
  canViewAppointments,
  canBookAppointment,
  canCancelAppointment,
  canRescheduleAppointment,
  canManageAppointmentSlots,
} = useClientAppointmentPermissions()

const canDeleteAppointment = computed(() =>
  canCancelAppointment.value || canManageAppointmentSlots.value,
)

const actionSaving = ref(false)

const bookDrawerOpen = ref(false)
const rescheduleDrawerOpen = ref(false)
const bookingReferralId = ref(null)
const bookingClinicianId = ref(null)
const detailOpen = ref(false)
const editOpen = ref(false)
const cancelDialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const activeAppointment = ref(null)

const hasClientId = computed(() =>
  String(props.clientId ?? '').trim().length > 0,
)

const clientId = computed(() => String(props.clientId ?? '').trim())

const embeddedRows = computed(() =>
  mapAppointmentsList(
    Array.isArray(props.appointments) ? props.appointments : [],
  ),
)

function notifyError(error) {
  $q.notify({
    type: quasarNotifyTypes.negative,
    message: String(
      error?.response?.data?.message
      ?? error?.message
      ?? t('appointmentActionError'),
    ),
  })
}

function notifySuccess(message) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message,
  })
}

const {
  searchQuery,
  setSearchQuery,
  resetSearchQuery,
  trimmedQuery,
  isSearchActive,
  searchLoading,
  appointmentRows,
  tablePagination,
  showSearchPagination,
  minSearchLength,
  reloadIfSearching,
  onPageChange,
  onRowsPerPageChange,
} = useClientAppointmentSearch({
  clientId,
  embeddedRows,
  onError: notifyError,
})

const searchHint = computed(() => {
  const q = trimmedQuery.value
  if (!q || isSearchActive.value) {
    return ''
  }

  return t('appointmentListSearchMinLength', {
    min: minSearchLength,
  })
})

const showAppointmentSearch = computed(() =>
  embeddedRows.value.length > 0 || isSearchActive.value,
)

const showMobileActionsMenu = computed(() =>
  isMobile.value
  && (canBookAppointment.value || showAppointmentSearch.value),
)

const listEmptyLabel = computed(() => {
  if (isSearchActive.value) {
    return t('appointmentListSearchEmpty')
  }

  return t('appointmentListEmpty')
})

const tablePermissions = computed(() => ({
  canView: canViewAppointments.value,
  canBook: canBookAppointment.value,
  canCancel: canCancelAppointment.value,
  canDelete: canDeleteAppointment.value,
  canReschedule: canRescheduleAppointment.value,
  canManage: canManageAppointmentSlots.value,
}))

async function refreshClientAppointments() {
  if (!hasClientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(clientId.value)
    await reloadIfSearching()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  }
}

function openBookDrawer() {
  bookingReferralId.value = null
  bookingClinicianId.value = firstPositiveClinicianId(
    props.assignedClinicianId,
  )
  bookDrawerOpen.value = true
}

function firstPositiveClinicianId(value) {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

function clearBookingReferral() {
  bookingReferralId.value = null
  bookingClinicianId.value = null
  emit('booking-referral-consumed')
}

function onBookCancel() {
  bookDrawerOpen.value = false
  clearBookingReferral()
}

watch(
  () => props.bookingReferral,
  row => {
    if (!row?.id || !hasClientId.value || !canBookAppointment.value) {
      return
    }
    bookingReferralId.value = row.id
    bookingClinicianId.value = firstPositiveClinicianId(
      row.assignedClinicianId ?? props.assignedClinicianId,
    )
    void nextTick(() => {
      bookDrawerOpen.value = true
    })
  },
  { immediate: true },
)

function openView(row) {
  activeAppointment.value = row
  detailOpen.value = true
}

function openEdit(row) {
  activeAppointment.value = row
  editOpen.value = true
}

function openReschedule(row) {
  activeAppointment.value = row
  rescheduleDrawerOpen.value = true
}

function confirmCancel(row) {
  activeAppointment.value = row
  cancelDialogOpen.value = true
}

function confirmDelete(row) {
  activeAppointment.value = row
  deleteDialogOpen.value = true
}

async function onBook(body) {
  actionSaving.value = true
  const referralId = bookingReferralId.value
  try {
    const clinicianId = Number(body?.clinician_id)
    const assignedId = Number(props.assignedClinicianId)
    if (
      Number.isFinite(assignedId)
      && assignedId > 0
      && Number.isFinite(clinicianId)
      && clinicianId > 0
      && clinicianId !== assignedId
    ) {
      emit('reassign-clinician', {
        clinicianId,
        referralId,
      })
    }
    const result = await bookAppointment(body)
    bookDrawerOpen.value = false
    clearBookingReferral()
    const message = result.appointments?.length
      ? t('appointmentBookSeriesSuccess', {
        count: result.appointments.length,
      })
      : t('appointmentBookSuccess')
    notifyBookedAppointment($q, t, result, message)
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const conflictKey = appointmentConflictI18nKey(error)
      notifyError(conflictKey ? new Error(t(conflictKey)) : error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onReschedule(payload) {
  if (!activeAppointment.value?.appointmentId) {
    return
  }
  actionSaving.value = true
  try {
    await rescheduleAppointment(
      activeAppointment.value.appointmentId,
      payload,
    )
    rescheduleDrawerOpen.value = false
    notifySuccess(t('appointmentRescheduleSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      const conflictKey = appointmentConflictI18nKey(error)
      notifyError(conflictKey ? new Error(t(conflictKey)) : error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onEditSave(body) {
  if (!activeAppointment.value?.appointmentId) {
    return
  }
  actionSaving.value = true
  try {
    await patchAppointment(activeAppointment.value.appointmentId, body)
    editOpen.value = false
    notifySuccess(t('appointmentEditSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onCancelConfirmed() {
  cancelDialogOpen.value = false
  if (!activeAppointment.value?.appointmentId) {
    return
  }
  actionSaving.value = true
  try {
    await cancelAppointment(activeAppointment.value.appointmentId)
    notifySuccess(t('appointmentCancelSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onDeleteConfirmed() {
  deleteDialogOpen.value = false
  if (!activeAppointment.value?.appointmentId) {
    return
  }
  actionSaving.value = true
  try {
    await deleteAppointment(activeAppointment.value.appointmentId)
    notifySuccess(t('appointmentDeleteSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onCheckIn(row) {
  actionSaving.value = true
  try {
    await checkInAppointment(row.appointmentId)
    notifySuccess(t('appointmentCheckInSuccess'))
    await refreshClientAppointments()
    try {
      await fetchClientActiveEncounter(clientId.value)
    } catch {
      // Banner/composable will retry; check-in already succeeded.
    }
    emit('checked-in', row)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onComplete(row) {
  actionSaving.value = true
  try {
    await completeAppointment(row.appointmentId)
    notifySuccess(t('appointmentCompleteSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}

async function onNoShow(row) {
  actionSaving.value = true
  try {
    await noShowAppointment(row.appointmentId)
    notifySuccess(t('appointmentNoShowSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}
</script>
