<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="allergy-dialog app-dialog-card appointment-book-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm
          appointment-book-dialog__body">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <template v-if="mode === 'book'">
          <SubsectionHeading
            icon="event"
            :title="t('appointmentSectionInfo')"
            :step="1"
          />
          <div class="row q-col-gutter-md q-mt-md q-mb-sm items-center">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentType')"
                required
                :test-id="tid.field('type')">
                <FormSelect
                  v-model="draft.appointmentTypeId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="typeOptions"
                  :placeholder="t('appointmentTypePlaceholder')"
                  :error="Boolean(errors.appointmentTypeId)"
                  :error-message="errors.appointmentTypeId"
                  :test-id="tid.field('type')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentDuration')"
                :test-id="tid.field('duration')">
                <q-input
                  :model-value="durationLabel"
                  outlined
                  hide-bottom-space
                  readonly
                  :data-testid="tid.field('duration')"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentClinicianOptional')"
                :test-id="tid.field('clinician')">
                <FormSelect
                  v-model="draft.clinicianId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :options="clinicianOptions"
                  :placeholder="t('appointmentClinicianPlaceholder')"
                  :test-id="tid.field('clinician')"
                />
                <template #hint>
                  {{ t('appointmentClinicianHint') }}
                </template>
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <FormToggle
                v-model="draft.telemedicine"
                :label="t('appointmentTelemedicine')"
                :disable="!telemedicineAllowed"
                :test-id="tid.field('telemedicine')"
              />
            </div>
          </div>
        </template>

        <div
          :class="mode === 'book'
            ? 'appointment-book-dialog__scheduling-section'
            : 'q-mt-lg'">
          <SubsectionHeading
            icon="calendar_month"
            :title="t('appointmentSectionScheduling')"
            :step="mode === 'book' ? 2 : 1"
          />
        <div class="q-mt-md">
          <AppointmentSlotPicker
            :month-label="monthLabel"
            :visible-month-key="visibleMonthKey"
            :calendar-days="calendarDays"
            :selected-day-key="selectedDayKey"
            :selected-day-slots="selectedDaySlots"
            :selected-slot-id="selectedSlotId"
            :slots-loading="slotsLoading"
            :day-has-availability="dayHasAvailability"
            :time-zone="timeZone"
            :empty-label="slotsEmptyLabel"
            :can-go-prev-month="canGoPrevMonth"
            :can-go-next-month="canGoNextMonth"
            @select-day="selectDay"
            @select-slot="selectSlot"
            @refresh="refreshSlots"
            @prev-month="shiftVisibleMonth(-1)"
            @next-month="shiftVisibleMonth(1)"
          />
          <p
            v-if="errors.slotId"
            class="form-field__error q-mt-sm">
            {{ errors.slotId }}
          </p>
        </div>
        </div>

        <div
          v-if="summaryVisible"
          class="appointment-book-dialog__summary q-mt-lg">
          <SubsectionHeading
            icon="summarize"
            :title="t('appointmentSummaryTitle')"
          />
          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-12 col-md-6">
              <div class="appointment-summary-item">
                <q-icon name="event" size="18px" />
                <span>{{ summaryDate }}</span>
              </div>
              <div class="appointment-summary-item">
                <q-icon name="schedule" size="18px" />
                <span>{{ summaryTime }}</span>
              </div>
              <div class="appointment-summary-item">
                <q-icon name="timelapse" size="18px" />
                <span>{{ durationLabel }}</span>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="appointment-summary-item">
                <q-icon name="person" size="18px" />
                <span>{{ summaryClinician }}</span>
              </div>
              <div class="appointment-summary-item">
                <q-icon name="videocam" size="18px" />
                <span>{{ summaryTelemedicine }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="q-mt-lg">
          <AddClientLabeledField
            :label="t('appointmentNotesOptional')"
            :test-id="tid.field('notes')">
            <q-input
              v-model="draft.notes"
              outlined
              hide-bottom-space
              type="textarea"
              autogrow
              counter
              :maxlength="appointmentNotesMaxLength"
              :placeholder="t('appointmentNotesPlaceholder')"
              :error="Boolean(errors.notes)"
              :error-message="errors.notes"
              :data-testid="tid.field('notes')"
            />
          </AddClientLabeledField>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="tid.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="check"
          :loading="saving"
          :label="primaryButtonLabel"
          :data-testid="tid.btn('book')"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppointmentSlotPicker from 'components/AppointmentSlotPicker.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import { appointmentNotesMaxLength } from 'components/constants.js'
import { useAppointmentScheduling } from
  'src/composables/useAppointmentScheduling.js'
import {
  listAppointmentClinicians,
  listAppointmentTypes,
} from 'src/utils/appointment-api.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
} from 'src/utils/appointment-datetime.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientId: { type: [String, Number], default: null },
  mode: { type: String, default: 'book' },
  appointment: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'booked',
  'rescheduled',
  'cancel',
])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const draft = ref(createDraft())
const errors = ref({})
const typeOptions = ref([])
const clinicianOptions = ref([])

const selectedType = computed(() =>
  typeOptions.value.find(
    opt => opt.value === draft.value.appointmentTypeId,
  )?.raw ?? null,
)

const telemedicineAllowed = computed(() =>
  selectedType.value?.telemedicineAllowed !== false,
)

const durationLabel = computed(() => {
  const mins = selectedType.value?.defaultDurationMin
  if (!mins) {
    return '—'
  }

  return t('appointmentDurationMinutes', { count: mins })
})

const schedulingFilters = computed(() => ({
  appointmentTypeId: props.mode === 'reschedule'
    ? props.appointment?.appointmentTypeId
    : draft.value.appointmentTypeId,
  clinicianId: props.mode === 'reschedule'
    ? props.appointment?.clinicianId
    : draft.value.clinicianId,
  telemedicine: props.mode === 'reschedule'
    ? props.appointment?.telemedicine
    : draft.value.telemedicine,
}))

const scheduling = useAppointmentScheduling(() => schedulingFilters.value)

const {
  timeZone,
  slotsLoading,
  selectedDayKey,
  selectedSlotId,
  visibleMonthKey,
  calendarDays,
  selectedDaySlots,
  selectedSlot,
  monthLabel,
  loadSlotsWindow,
  shiftVisibleMonth,
  refreshSlots,
  selectDay,
  selectSlot,
  dayHasAvailability,
  clearSelectedSlot,
  canGoPrevMonth,
  canGoNextMonth,
} = scheduling

const dialogTitle = computed(() =>
  props.mode === 'reschedule'
    ? t('appointmentRescheduleTitle')
    : t('appointmentAddTitle'),
)

const dialogSubtitle = computed(() =>
  props.mode === 'reschedule'
    ? t('appointmentRescheduleSubtitle')
    : t('appointmentAddSubtitle'),
)

const primaryButtonLabel = computed(() =>
  props.mode === 'reschedule'
    ? t('appointmentActionReschedule')
    : t('appointmentBookButton'),
)

const slotsEmptyLabel = computed(() =>
  schedulingFilters.value.appointmentTypeId
    ? t('appointmentSlotsEmpty')
    : t('appointmentSelectTypeFirst'),
)

const summaryVisible = computed(() => Boolean(selectedSlot.value))

const summaryDate = computed(() =>
  formatUtcDateLong(selectedSlot.value?.startAtUtc, timeZone),
)

const summaryTime = computed(() =>
  formatUtcTimeRange(
    selectedSlot.value?.startAtUtc,
    selectedSlot.value?.endAtUtc,
    timeZone,
  ),
)

const summaryClinician = computed(() => {
  const slotClinicianId = selectedSlot.value?.clinicianId
  const match = clinicianOptions.value.find(
    opt => opt.value === slotClinicianId,
  )

  return match?.label ?? t('appointmentClinicianAutoAssign')
})

const summaryTelemedicine = computed(() =>
  draft.value.telemedicine ? t('yes') : t('no'),
)

function createDraft() {
  return {
    appointmentTypeId: null,
    clinicianId: null,
    telemedicine: false,
    notes: '',
  }
}

async function loadFormOptions() {
  const [types, clinicians] = await Promise.all([
    listAppointmentTypes(),
    listAppointmentClinicians(),
  ])
  typeOptions.value = types.map(row => ({
    label: row.name,
    value: row.id,
    raw: row,
  }))
  clinicianOptions.value = clinicians
}

function validateDraft() {
  const next = {}
  if (props.mode === 'book' && !draft.value.appointmentTypeId) {
    next.appointmentTypeId = t('appointmentTypeRequired')
  }
  if (!selectedSlotId.value) {
    next.slotId = t('appointmentSlotRequired')
  }
  if (draft.value.notes.length > appointmentNotesMaxLength) {
    next.notes = t('appointmentNotesMaxLength', {
      max: appointmentNotesMaxLength,
    })
  }
  errors.value = next

  return Object.keys(next).length === 0
}

function onCancel() {
  open.value = false
  emit('cancel')
}

function buildBookPayload() {
  /* eslint-disable camelcase -- API book payload */
  const payload = {
    slot_id: selectedSlotId.value,
    client_id: Number(props.clientId),
    notes: draft.value.notes || null,
    telemedicine: Boolean(draft.value.telemedicine),
    clinician_id: draft.value.clinicianId ?? null,
    referral_id: null,
  }
  /* eslint-enable camelcase */

  return payload
}

async function onSubmit() {
  if (!validateDraft()) {
    return
  }
  if (props.mode === 'reschedule') {
    emit('rescheduled', {
      newSlotId: selectedSlotId.value,
      notes: draft.value.notes || null,
    })

    return
  }
  emit('booked', buildBookPayload())
}

watch(
  () => props.modelValue,
  async isOpen => {
    if (!isOpen) {
      return
    }
    draft.value = createDraft()
    errors.value = {}
    clearSelectedSlot()
    await loadFormOptions()
    if (schedulingFilters.value.appointmentTypeId) {
      await loadSlotsWindow()
    }
  },
)

watch(
  () => draft.value.appointmentTypeId,
  async(next, prev) => {
    if (next === prev || props.mode !== 'book') {
      return
    }
    clearSelectedSlot()
    if (!telemedicineAllowed.value) {
      draft.value.telemedicine = false
    }
    if (next) {
      await loadSlotsWindow()
    }
  },
)

watch(
  () => [draft.value.clinicianId, draft.value.telemedicine],
  async(next, prev) => {
    if (next[0] === prev?.[0] && next[1] === prev?.[1]) {
      return
    }
    if (props.mode !== 'book') {
      return
    }
    clearSelectedSlot()
    if (draft.value.appointmentTypeId) {
      await refreshSlots()
    }
  },
)

watch(
  () => props.appointment,
  async appt => {
    if (props.mode !== 'reschedule' || !appt) {
      return
    }
    if (appt.appointmentTypeId) {
      await loadSlotsWindow()
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-book-dialog {
  &__body {
    max-height: min(75vh, 720px);
    overflow-y: auto;
  }

  &__scheduling-section {
    margin-top: 2.75rem;
  }

  &__summary {
    background: rgba($primary, 0.06);
    border: 1px solid rgba($primary, 0.15);
    border-radius: 12px;
    padding: 16px;
  }
}

.appointment-summary-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: $text-strong;
}
</style>
