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
      <div class="appointments-header row items-start">
        <div class="col">
          <h2 class="appointments-title">
            {{ t('appointmentsTitle') }}
          </h2>
          <p class="appointments-subtitle text-body2">
            {{ t('appointmentsSubtitle') }}
          </p>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="canBookAppointment"
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
      </div>

      <AdminTablePanel
        class="appointments-table-panel admin-table-panel--wide q-mt-md"
        :show-column-settings="false">
        <AppointmentsTable
          :rows="appointmentRows"
          :empty-label="t('appointmentListEmpty')"
          :permissions="tablePermissions"
          @view="openView"
          @edit="openEdit"
          @cancel="confirmCancel"
          @reschedule="openReschedule"
          @check-in="onCheckIn"
          @complete="onComplete"
          @no-show="onNoShow"
        />
      </AdminTablePanel>
    </template>

    <AppointmentBookDialog
      v-model="bookDrawerOpen"
      :client-id="clientId"
      mode="book"
      :saving="actionSaving"
      @booked="onBook"
      @cancel="bookDrawerOpen = false"
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
    />

    <AppointmentEditDialog
      v-model="editOpen"
      :record="activeAppointment"
      :client-id="clientId"
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppointmentBookDialog from 'components/AppointmentBookDialog.vue'
import AppointmentDetailDialog from 'components/AppointmentDetailDialog.vue'
import AppointmentEditDialog from 'components/AppointmentEditDialog.vue'
import AppointmentsTable from 'components/AppointmentsTable.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useClientAppointmentPermissions } from
  'src/composables/useClientAppointmentPermissions.js'
import {
  bookAppointment,
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  noShowAppointment,
  patchAppointment,
  rescheduleAppointment,
} from 'src/utils/appointment-api.js'
import { mapAppointmentsList } from 'src/utils/appointment-normalize.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  appointments: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()
const {
  canViewAppointments,
  canBookAppointment,
  canCancelAppointment,
  canRescheduleAppointment,
  canManageAppointmentSlots,
} = useClientAppointmentPermissions()

const actionSaving = ref(false)

const bookDrawerOpen = ref(false)
const rescheduleDrawerOpen = ref(false)
const detailOpen = ref(false)
const editOpen = ref(false)
const cancelDialogOpen = ref(false)
const activeAppointment = ref(null)

const hasClientId = computed(() =>
  String(props.clientId ?? '').trim().length > 0,
)

const clientId = computed(() => String(props.clientId ?? '').trim())

const appointmentsRaw = computed(() =>
  Array.isArray(props.appointments) ? props.appointments : [],
)

const appointmentRows = computed(() =>
  mapAppointmentsList(appointmentsRaw.value),
)

const tablePermissions = computed(() => ({
  canView: canViewAppointments.value,
  canBook: canBookAppointment.value,
  canCancel: canCancelAppointment.value,
  canReschedule: canRescheduleAppointment.value,
  canManage: canManageAppointmentSlots.value,
}))

async function refreshClientAppointments() {
  if (!hasClientId.value) {
    return
  }
  try {
    await siteStore.fetchClientById(clientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  }
}

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

function openBookDrawer() {
  bookDrawerOpen.value = true
}

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

async function onBook(body) {
  actionSaving.value = true
  try {
    await bookAppointment(body)
    bookDrawerOpen.value = false
    notifySuccess(t('appointmentBookSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
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
      payload.newSlotId,
      payload.notes,
    )
    rescheduleDrawerOpen.value = false
    notifySuccess(t('appointmentRescheduleSuccess'))
    await refreshClientAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
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

async function onCheckIn(row) {
  actionSaving.value = true
  try {
    await checkInAppointment(row.appointmentId)
    notifySuccess(t('appointmentCheckInSuccess'))
    await refreshClientAppointments()
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
