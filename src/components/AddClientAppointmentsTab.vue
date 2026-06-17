<template>
  <div class="add-client-appointments-tab">
    <div v-if="!hasClientId" class="appointments-panel q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('appointmentSaveClientFirst') }}
      </p>
    </div>

    <template v-else>
      <div class="row items-center justify-between q-mb-md">
        <h3 class="appointments-panel__title q-mb-none">
          {{ t('appointmentsTitle') }}
        </h3>
        <q-btn
          v-if="canBookAppointment"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="add"
          :disable="loading"
          :label="t('appointmentAddButton')"
          :data-testid="tid.btn('add')"
          @click="openBookDrawer"
        />
      </div>

      <div v-if="loading" class="appointments-panel q-pa-xl flex flex-center">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else class="appointments-panel q-pa-md">
        <AppointmentsTable
          :rows="paginatedAppointments"
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

        <div
          v-if="appointments.length"
          class="row items-center justify-between q-mt-md">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{
              t('appointmentPaginationSummary', {
                from: pageFrom,
                to: pageTo,
                total: appointments.length,
              })
            }}
          </p>
          <q-pagination
            v-model="page"
            :max="pageCount"
            max-pages="6"
            direction-links
            boundary-links
            color="primary"
            size="sm"
          />
        </div>
      </div>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
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
  listClientAppointments,
  noShowAppointment,
  patchAppointment,
  rescheduleAppointment,
} from 'src/utils/appointment-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()
const {
  canViewAppointments,
  canBookAppointment,
  canCancelAppointment,
  canRescheduleAppointment,
  canManageAppointmentSlots,
} = useClientAppointmentPermissions()

const appointments = ref([])
const loading = ref(false)
const actionSaving = ref(false)
const page = ref(1)
const pageSize = 10

const bookDrawerOpen = ref(false)
const rescheduleDrawerOpen = ref(false)
const detailOpen = ref(false)
const editOpen = ref(false)
const cancelDialogOpen = ref(false)
const activeAppointment = ref(null)

const hasClientId = computed(() =>
  String(props.clientId ?? '').trim().length > 0,
)

const pageCount = computed(() =>
  Math.max(1, Math.ceil(appointments.value.length / pageSize)),
)

const paginatedAppointments = computed(() => {
  const start = (page.value - 1) * pageSize

  return appointments.value.slice(start, start + pageSize)
})

const pageFrom = computed(() =>
  appointments.value.length ? (page.value - 1) * pageSize + 1 : 0,
)

const pageTo = computed(() =>
  Math.min(page.value * pageSize, appointments.value.length),
)

const tablePermissions = computed(() => ({
  canView: canViewAppointments.value,
  canBook: canBookAppointment.value,
  canCancel: canCancelAppointment.value,
  canReschedule: canRescheduleAppointment.value,
  canManage: canManageAppointmentSlots.value,
}))

async function loadAppointments() {
  if (!hasClientId.value) {
    return
  }
  loading.value = true
  try {
    appointments.value = await listClientAppointments(props.clientId)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    loading.value = false
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
    await loadAppointments()
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
    await loadAppointments()
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
    await loadAppointments()
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
    await loadAppointments()
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
    await loadAppointments()
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
    await loadAppointments()
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
    await loadAppointments()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      notifyError(error)
    }
  } finally {
    actionSaving.value = false
  }
}

watch(hasClientId, id => {
  if (id) {
    void loadAppointments()
  }
})

onMounted(() => {
  if (hasClientId.value) {
    void loadAppointments()
  }
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.add-client-appointments-tab {
  width: 100%;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.appointments-panel {
  &__title {
    font-size: 1rem;
    font-weight: 600;
    color: $primary;
  }
}
</style>
