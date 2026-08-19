<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card appointment-book-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-sm
          appointment-book-dialog__body">
        <template v-if="mode === 'book'">
          <SubsectionHeading
            icon="event"
            :title="t('appointmentSectionInfo')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div
              v-if="showClientPicker"
              class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('client')"
                required
                :test-id="tid.field('client')">
                <q-select
                  v-model="draft.clientId"
                  outlined
                  hide-bottom-space
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="350"
                  emit-value
                  map-options
                  clearable
                  option-value="value"
                  option-label="label"
                  :options="filteredClientOptions"
                  :loading="clientSearchLoading"
                  :placeholder="t('appointmentClientSearchPlaceholder')"
                  :error="Boolean(errors.clientId)"
                  :error-message="errors.clientId"
                  :data-testid="tid.field('client')"
                  @filter="onClientFilter"
                  @popup-show="onClientPopupShow"
                  @popup-hide="onClientPopupHide"
                  @virtual-scroll="onClientPickerVirtualScroll"
                  @update:model-value="onClientSelected">
                  <template #prepend>
                    <q-icon name="search" size="18px" />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-grey-7">
                        {{ clientSearchNoOptionLabel }}
                      </q-item-section>
                    </q-item>
                  </template>
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section
                        avatar
                        class="appointment-client-select__avatar-section">
                        <ClinicianSelectAvatar
                          :photo-file-id="scope.opt.photoFileId"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.name }}</q-item-label>
                        <q-item-label
                          v-if="scope.opt.clientNumber"
                          caption>
                          {{ scope.opt.clientNumber }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <template #hint>
                  {{ t('appointmentClientSearchHint') }}
                </template>
              </AddClientLabeledField>
            </div>

            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentPlaceOfService')"
                required
                :test-id="tid.field('place-of-service')">
                <div
                  v-if="catalogsLoading"
                  class="form-field-loading-shell"
                  role="status"
                  :aria-label="t('appLoading')"
                  :data-testid="tid.field('place-of-service-loading')">
                  <q-spinner color="grey-7" size="24px" />
                </div>
                <FormSelect
                  v-else
                  v-model="draft.placeOfServiceId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :options="placeOptions"
                  :placeholder="t('appointmentPlaceOfServicePlaceholder')"
                  :error="Boolean(errors.placeOfServiceId)"
                  :error-message="errors.placeOfServiceId"
                  :test-id="tid.field('place-of-service')"
                />
              </AddClientLabeledField>
              <p
                v-if="selectedPlaceIsTelemedicine"
                class="text-caption text-grey-7 q-mt-xs">
                {{ t('appointmentTelemedicineBookHint') }}
              </p>
            </div>

            <div class="col-12">
              <AppointmentServiceLinesField
                :lines="serviceLines"
                :catalog="serviceCatalog"
                :loading="catalogsLoading"
                @add="addService"
                @remove="removeService"
                @duration-change="onServiceDurationChange"
                @fee-change="onServiceFeeChange"
              />
              <p
                v-if="errors.serviceProcedureIds"
                class="form-field__error q-mt-xs">
                {{ errors.serviceProcedureIds }}
              </p>
            </div>

            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('clinician')"
                required
                :test-id="tid.field('clinician')">
                <ClinicianFormSelect
                  v-model="draft.clinicianId"
                  :options="clinicianOptions"
                  :disable="mode === 'book' && !serviceLines.length"
                  :placeholder="t('appointmentClinicianPlaceholder')"
                  :error="Boolean(errors.clinicianId)"
                  :error-message="errors.clinicianId"
                  :test-id="tid.field('clinician')"
                />
              </AddClientLabeledField>
              <p
                v-if="eligibilityHint"
                class="text-caption text-grey-7 q-mt-xs">
                {{ eligibilityHint }}
              </p>
            </div>

            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentSupervisorOptional')"
                :test-id="tid.field('supervisor')">
                <ClinicianFormSelect
                  v-model="draft.supervisorId"
                  clearable
                  :options="supervisorOptions"
                  :placeholder="t('appointmentSupervisorPlaceholder')"
                  :test-id="tid.field('supervisor')"
                />
                <template #hint>
                  {{ t('appointmentSupervisorHint') }}
                </template>
              </AddClientLabeledField>
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
          />
          <div class="q-mt-md">
            <AppointmentAvailabilityPicker
              :month-label="monthLabel"
              :calendar-days="calendarDays"
              :selected-day-key="selectedDayKey"
              :selected-day-windows="selectedDayWindows"
              :selected-day-blocks="selectedDayBlocks"
              :selected-window="selectedWindow"
              :selected-window-key="selectedWindowKey"
              :picker-mode="pickerMode"
              :loading="availabilityLoading"
              :day-has-availability="dayHasAvailability"
              :time-zone="timeZone"
              :duration-minutes="totalDurationMinutes"
              :scheduling-fields="schedulingFields"
              :scheduling-field-error="schedulingFieldError"
              :scheduling-needs-overlapping="schedulingNeedsOverlapping"
              :allow-over-schedule-blocks="allowOverScheduleBlocks"
              :schedule-block-overlap-types="scheduleBlockOverlapTypes"
              :empty-label="availabilityEmptyLabel"
              :readonly="schedulingLocked"
              @select-day="selectDay"
              @select-window="selectWindow"
              @select-grid-time="selectGridTime"
              @update-scheduling-start-time="setSchedulingStartTime"
              @update-scheduling-end-time="setSchedulingEndTime"
              @commit-scheduling-start-time="commitSchedulingStartTime"
              @commit-scheduling-end-time="commitSchedulingEndTime"
              @update:allow-over-schedule-blocks="setAllowOverScheduleBlocks"
              @refresh="reloadAvailability"
              @prev-month="shiftVisibleMonth(-1)"
              @next-month="shiftVisibleMonth(1)"
            />
            <p
              v-if="errors.availability"
              class="form-field__error q-mt-sm">
              {{ errors.availability }}
            </p>
          </div>
        </div>

        <AppointmentRecurrenceSection
          v-if="mode === 'book'"
          v-model="draft"
          class="q-mt-lg"
          :start-day-key="selectedDayKey"
          :end-date-error="errors.endOnDate"
          :days-of-week-error="errors.daysOfWeek"
          :working-weekdays="workingWeekdays"
        >
          <template #occurrences>
            <AppointmentRecurrencePreviewList
              v-if="showRecurrencePreview"
              :model-value="previewRows"
              :loading="previewLoading"
              :failed="previewFailed"
            />
          </template>
        </AppointmentRecurrenceSection>

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
                <span>
                  {{
                    totalDurationMinutes
                      ? t('appointmentDurationMinutes', {
                        count: totalDurationMinutes,
                      })
                      : '—'
                  }}
                </span>
              </div>
              <div class="appointment-summary-item">
                <q-icon name="place" size="18px" />
                <span>{{ summaryPlaceOfService }}</span>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="appointment-summary-item">
                <q-icon name="medical_services" size="18px" />
                <span>{{ summaryServices }}</span>
              </div>
              <div class="appointment-summary-item">
                <q-icon name="person" size="18px" />
                <span>{{ summaryClinician }}</span>
              </div>
              <div
                v-if="summarySupervisor"
                class="appointment-summary-item">
                <q-icon name="supervisor_account" size="18px" />
                <span>{{ summarySupervisor }}</span>
              </div>
              <div class="appointment-summary-item">
                <q-icon name="payments" size="18px" />
                <span>{{ suggestedFeeLabel }}</span>
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

      <q-card-actions
        align="between"
        class="app-dialog-card__actions appointment-book-dialog__actions">
        <q-btn
          no-caps
          outline
          color="primary"
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
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useViewportLayout } from 'src/composables/useViewportLayout.js'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppointmentAvailabilityPicker from
  'components/appointment/AppointmentAvailabilityPicker.vue'
import AppointmentRecurrencePreviewList from
  'components/appointment/AppointmentRecurrencePreviewList.vue'
import AppointmentRecurrenceSection from
  'components/appointment/AppointmentRecurrenceSection.vue'
import AppointmentServiceLinesField from
  'components/appointment/AppointmentServiceLinesField.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import ClinicianSelectAvatar from 'components/ClinicianSelectAvatar.vue'
import FormSelect from 'components/FormSelect.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import {
  appointmentNotesMaxLength,
  appointmentRecurrenceEndTypeValues,
  appointmentRecurrenceFrequencyValues,
  clientFieldKeys as ck,
} from 'components/constants.js'
import {
  buildServiceLinesFromCatalog,
  useAppointmentBooking,
} from 'src/composables/useAppointmentBooking.js'
import { useRecurrencePreview }
  from 'src/composables/useRecurrencePreview.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  formatFeeLabel,
  isDurationWithinServiceRange,
  sumServiceLineDurations,
  sumSuggestedFees,
} from 'src/utils/appointment-booking.js'
import {
  listBookableServiceProcedures,
  listClinicianWorkingWeekdays,
  listEligibleClinicians,
} from 'src/utils/appointment-api.js'
import { buildOccurrenceOverrides }
  from 'src/utils/recurrence-preview.js'
import { fetchAllCliniciansSelectOptions } from 'src/utils/clinicians-api.js'
import { buildSupervisorSelectOptions } from
  'src/utils/clinician-supervisor.js'
import {
  isTelemedicinePlaceOfService,
  listActivePlacesOfService,
  resolveDefaultPlaceOfServiceId,
} from 'src/utils/place-of-service-api.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
  todayLocalDayKey,
  usDateStringToLocalDayKey,
  usDateStringToUtcStartIso,
} from 'src/utils/appointment-datetime.js'
import { clientChartKey } from 'components/helpers.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'
import {
  CLIENT_LIST_SEARCH_MIN_LENGTH,
  isClientListServerSearchQuery,
} from 'src/utils/client-list-search.js'
import { CLINIC_DEFAULT_WEEKDAYS }
  from 'src/utils/working-weekdays.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientId: { type: [String, Number], default: null },
  mode: { type: String, default: 'book' },
  appointment: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  bookingHint: { type: Object, default: null },
  initialServiceProcedureIds: {
    type: Array,
    default: () => [],
  },
  initialClinicianId: { type: [String, Number], default: null },
  initialNotes: { type: String, default: '' },
  referralId: { type: [String, Number], default: null },
})

const emit = defineEmits([
  'update:modelValue',
  'booked',
  'rescheduled',
  'cancel',
])

const { t } = useI18n()
const { isMobile } = useViewportLayout()
const siteStore = useSiteStore()
const authStore = useAuthStore()
const { linkedStaffProfile } = storeToRefs(authStore)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const draft = ref(createDraft())
const errors = ref({})
const serviceCatalog = ref([])
const catalogsLoading = ref(false)
const serviceLines = ref([])
const clinicianOptions = ref([])
const allClinicianOptions = ref([])
const eligibilityHint = ref('')
const placeOptions = ref([])
const filteredClientOptions = ref([])
const clientSearchLoading = ref(false)
const clientFilterNeedle = ref('')
const selectedClientOption = ref(null)
const clientPickerBrowseOptions = ref([])
const clientPickerBrowsePage = ref(1)
const clientPickerBrowseHasMore = ref(false)
const clientPickerSearchOptions = ref([])
const clientPickerSearchPage = ref(1)
const clientPickerSearchHasMore = ref(false)
const clientPickerLoadingMore = ref(false)
const clientPickerUserScrolled = ref(false)
let clientPickerRequestId = 0
const workingWeekdays = ref([...CLINIC_DEFAULT_WEEKDAYS])
let workingWeekdaysSeq = 0

const showClientPicker = computed(() =>
  props.mode === 'book' && !String(props.clientId ?? '').trim(),
)

const resolvedClientId = computed(() => {
  if (!showClientPicker.value) {
    return props.clientId
  }

  return draft.value.clientId
})

const serviceProcedureIds = computed(() =>
  serviceLines.value.map(line => line.serviceId),
)

const totalDurationMinutes = computed(() =>
  sumServiceLineDurations(serviceLines.value) || null,
)

const resolvedSchedulingClinicianId = computed(() =>
  props.mode === 'reschedule'
    ? props.appointment?.clinicianId ?? null
    : draft.value.clinicianId,
)

const schedulingFilters = computed(() => ({
  serviceProcedureIds: serviceProcedureIds.value,
  durationMinutes: totalDurationMinutes.value,
  clinicianId: resolvedSchedulingClinicianId.value,
  clientId: resolvedClientId.value,
  excludeAppointmentId: props.mode === 'reschedule'
    ? props.appointment?.appointmentId ?? null
    : null,
}))

const booking = useAppointmentBooking(() => schedulingFilters.value)

const {
  timeZone,
  pickerMode,
  availabilityLoading,
  selectedDayKey,
  selectedWindowKey,
  selectedWindow,
  calendarDays,
  selectedDayWindows,
  selectedDayBlocks,
  monthLabel,
  dayHasAvailability,
  clearAvailability,
  clearSelectedWindow,
  selectDay,
  selectWindow,
  selectGridTime,
  setSchedulingStartTime,
  setSchedulingEndTime,
  commitSchedulingStartTime,
  commitSchedulingEndTime,
  schedulingFields,
  schedulingFieldError,
  schedulingNeedsOverlapping,
  allowOverScheduleBlocks,
  scheduleBlockOverlapTypes,
  setAllowOverScheduleBlocks,
  refreshDurationPreview,
  beginAvailabilityLoading,
  loadAvailability,
  applyBookingHint,
  shiftVisibleMonth,
} = booking

const schedulingLocked = computed(() =>
  !serviceLines.value.length
  || !resolvedSchedulingClinicianId.value,
)

const dialogTitle = computed(() =>
  props.mode === 'reschedule'
    ? t('appointmentRescheduleTitle')
    : t('appointmentAddTitle'),
)

const dialogSubtitle = computed(() =>
  props.mode === 'reschedule'
    ? t('appointmentRescheduleSubtitle')
    : '',
)

const primaryButtonLabel = computed(() => {
  if (props.mode === 'reschedule') {
    return t('appointmentActionReschedule')
  }

  return isMobile.value
    ? t('appointmentBookButtonShort')
    : t('appointmentBookButton')
})

const {
  rows: previewRows,
  loading: previewLoading,
  failed: previewFailed,
  schedule: scheduleRecurrencePreview,
  flush: flushRecurrencePreview,
  reset: resetRecurrencePreview,
} = useRecurrencePreview({
  canLoad: canLoadRecurrencePreview,
  buildPayload: () => buildBookPayload(false),
})

const showRecurrencePreview = computed(() =>
  Boolean(draft.value.repeatAppointment)
  && (
    previewLoading.value
    || previewFailed.value
    || previewRows.value.length > 0
  ),
)

const recurrencePreviewSignature = computed(() => {
  if (!draft.value.repeatAppointment) {
    return ''
  }
  const rec = draft.value.recurrence ?? {}
  const days = [...(rec.daysOfWeek ?? [])]
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right)
    .join(',')

  return [
    selectedWindow.value?.startAtUtc ?? '',
    selectedWindow.value?.clinicianId
      ?? draft.value.clinicianId
      ?? '',
    resolvedClientId.value ?? '',
    serviceProcedureIds.value.join(','),
    totalDurationMinutes.value ?? '',
    rec.frequency ?? '',
    rec.intervalCount ?? '',
    rec.endType ?? '',
    rec.endAfterCount ?? '',
    rec.endOnDate ?? '',
    days,
  ].join('|')
})

const availabilityEmptyLabel = computed(() => {
  if (!serviceLines.value.length) {
    return t('appointmentSelectServicesFirst')
  }
  if (!resolvedSchedulingClinicianId.value) {
    return t('appointmentSelectClinicianFirst')
  }
  if (!draft.value.placeOfServiceId) {
    return t('appointmentSelectPlaceFirst')
  }
  if (!totalDurationMinutes.value) {
    return t('appointmentSelectDurationFirst')
  }

  return t('appointmentAvailabilityEmpty')
})

const suggestedFeeLabel = computed(() =>
  formatFeeLabel(sumSuggestedFees(serviceLines.value), t),
)

const summaryVisible = computed(() => Boolean(selectedWindow.value))

const summaryDate = computed(() =>
  formatUtcDateLong(selectedWindow.value?.startAtUtc, timeZone),
)

const summaryTime = computed(() =>
  formatUtcTimeRange(
    selectedWindow.value?.startAtUtc,
    selectedWindow.value?.endAtUtc,
    timeZone,
  ),
)

const summaryClinician = computed(() => {
  const windowClinician = selectedWindow.value?.clinicianDisplayName
  if (windowClinician) {
    return windowClinician
  }
  const match = clinicianOptions.value.find(
    opt => Number(opt.value) === Number(draft.value.clinicianId),
  )

  return match?.name ?? match?.label ?? '—'
})

const supervisorOptions = computed(() => {
  const selected = clinicianOptions.value.find(
    opt => Number(opt.value) === Number(draft.value.supervisorId),
  )

  return buildSupervisorSelectOptions({
    options: clinicianOptions.value,
    excludeClinicianId: draft.value.clinicianId,
    supervisorId: draft.value.supervisorId,
    supervisorDisplayName: selected?.label
      || selected?.name
      || selected?.supervisorDisplayName
      || '',
  }).map(option => {
    const value = Number(option.value)
    if (!Number.isFinite(value)) {
      return null
    }

    return {
      ...option,
      value: String(value),
    }
  }).filter(Boolean)
})

const summarySupervisor = computed(() => {
  const match = supervisorOptions.value.find(
    opt => Number(opt.value) === Number(draft.value.supervisorId),
  )

  return match?.label ?? match?.name ?? ''
})

const selectedPlaceOption = computed(() =>
  placeOptions.value.find(
    opt => opt.value === draft.value.placeOfServiceId,
  ) ?? null,
)

const selectedPlaceIsTelemedicine = computed(() =>
  isTelemedicinePlaceOfService(selectedPlaceOption.value?.raw ?? {}),
)

const summaryPlaceOfService = computed(() =>
  selectedPlaceOption.value?.label ?? '—',
)

const summaryServices = computed(() =>
  serviceLines.value
    .map(line => `${line.name} (${line.durationMin} min)`)
    .join(', ') || '—',
)

const clientSearchNoOptionLabel = computed(() => {
  const needle = clientFilterNeedle.value.trim()
  if (!needle) {
    return t('appointmentClientSearchHint')
  }
  if (needle.length < CLIENT_LIST_SEARCH_MIN_LENGTH) {
    return t('appointmentClientSearchMinLength', {
      min: CLIENT_LIST_SEARCH_MIN_LENGTH,
    })
  }

  return t('appointmentClientSearchEmpty')
})

const CLIENT_PICKER_LIST_LIMIT = 20

function createDraft() {
  return {
    clientId: null,
    placeOfServiceId: null,
    clinicianId: null,
    supervisorId: null,
    notes: '',
    repeatAppointment: false,
    recurrence: {
      frequency: appointmentRecurrenceFrequencyValues.weekly,
      intervalCount: 1,
      daysOfWeek: [...CLINIC_DEFAULT_WEEKDAYS],
      endType: appointmentRecurrenceEndTypeValues.afterCount,
      endAfterCount: 10,
      endOnDate: '',
    },
  }
}

function buildClientOptionLabel(row) {
  const name = String(row?.[ck.name] ?? '').trim()
  const clientNumber = String(row?.[ck.clientNumber] ?? '').trim()
  if (name && clientNumber) {
    return `${name} (${clientNumber})`
  }

  return name || clientNumber || String(row?.id ?? '')
}

function mapRowToClientOption(row) {
  const name = String(row?.[ck.name] ?? '').trim()
  const clientNumber = String(row?.[ck.clientNumber] ?? '').trim()

  return {
    label: buildClientOptionLabel(row),
    value: clientChartKey(row) || row.id,
    name: name || clientNumber || String(row?.id ?? ''),
    clientNumber,
    photoFileId: row?.[ck.photoFileId] ?? null,
  }
}

function ensureSelectedClientInOptions(options = []) {
  const selected = selectedClientOption.value
  if (selected && !options.some(option => option.value === selected.value)) {
    return [selected, ...options]
  }

  return options
}

function clientOptionsFromRows(rows = []) {
  return ensureSelectedClientInOptions(mapRowsToClientOptions(rows))
}

function mapRowsToClientOptions(rows = []) {
  return rows
    .map(mapRowToClientOption)
    .filter(option => option.value != null)
}

function mergeUniqueClientOptions(existing, incoming) {
  const seen = new Set(existing.map(option => String(option.value)))
  const next = [...existing]

  for (const option of incoming) {
    const key = String(option.value)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    next.push(option)
  }

  return next
}

function resolveClientPickerHasMore(pagination, loadedCount) {
  const total = Number(pagination?.total)
  if (Number.isFinite(total) && total >= 0) {
    return loadedCount < total
  }

  const totalPages = Number(pagination?.totalPages)
  const page = Number(pagination?.page)
  if (
    Number.isFinite(totalPages)
    && totalPages > 0
    && Number.isFinite(page)
  ) {
    return page + 1 < totalPages
  }

  const pageItems = siteStore.clientList?.length ?? 0

  return pageItems >= CLIENT_PICKER_LIST_LIMIT
}

function restoreClientPickerBrowseList(update) {
  const apply = () => {
    filteredClientOptions.value = ensureSelectedClientInOptions(
      clientPickerBrowseOptions.value,
    )
  }

  if (update) {
    update(apply)
  } else {
    apply()
  }
}

async function loadClientPickerFirstPage({ query, requestId }) {
  const q = String(query ?? '').trim()
  const isServerSearch = isClientListServerSearchQuery(q)

  if (isServerSearch) {
    await siteStore.searchClientList({
      q,
      page: 1,
      limit: CLIENT_PICKER_LIST_LIMIT,
    }, t)
  } else {
    await siteStore.getClientList({
      page: 1,
      limit: CLIENT_PICKER_LIST_LIMIT,
    }, t)
  }

  if (requestId !== clientPickerRequestId) {
    return null
  }

  const options = clientOptionsFromRows(siteStore.clientList)
  const hasMore = resolveClientPickerHasMore(
    siteStore.clientListPagination,
    options.length,
  )

  if (isServerSearch) {
    clientPickerSearchOptions.value = options
    clientPickerSearchPage.value = 1
    clientPickerSearchHasMore.value = hasMore
  } else {
    clientPickerBrowseOptions.value = options
    clientPickerBrowsePage.value = 1
    clientPickerBrowseHasMore.value = hasMore
  }

  filteredClientOptions.value = options

  return options
}

async function loadClientPickerNextPage(virtualScrollRef) {
  const q = clientFilterNeedle.value.trim()
  const isServerSearch = isClientListServerSearchQuery(q)
  const hasMore = isServerSearch
    ? clientPickerSearchHasMore.value
    : clientPickerBrowseHasMore.value

  if (!hasMore || clientPickerLoadingMore.value || clientSearchLoading.value) {
    return
  }

  const requestId = clientPickerRequestId
  const nextPage = (
    isServerSearch
      ? clientPickerSearchPage.value
      : clientPickerBrowsePage.value
  ) + 1
  const scrollIndex = filteredClientOptions.value.length - 1

  clientPickerLoadingMore.value = true
  try {
    if (isServerSearch) {
      await siteStore.searchClientList({
        q,
        page: nextPage,
        limit: CLIENT_PICKER_LIST_LIMIT,
      }, t)
    } else {
      await siteStore.getClientList({
        page: nextPage,
        limit: CLIENT_PICKER_LIST_LIMIT,
      }, t)
    }

    if (requestId !== clientPickerRequestId) {
      return
    }

    const mapped = mapRowsToClientOptions(siteStore.clientList)
    const merged = mergeUniqueClientOptions(
      isServerSearch
        ? clientPickerSearchOptions.value
        : clientPickerBrowseOptions.value,
      mapped,
    )
    const options = ensureSelectedClientInOptions(merged)
    const hasMoreNext = resolveClientPickerHasMore(
      siteStore.clientListPagination,
      options.length,
    )

    if (isServerSearch) {
      clientPickerSearchOptions.value = options
      clientPickerSearchPage.value = nextPage
      clientPickerSearchHasMore.value = hasMoreNext
    } else {
      clientPickerBrowseOptions.value = options
      clientPickerBrowsePage.value = nextPage
      clientPickerBrowseHasMore.value = hasMoreNext
    }

    filteredClientOptions.value = options
    await nextTick()
    if (typeof virtualScrollRef?.refresh === 'function') {
      virtualScrollRef.refresh(scrollIndex)
    }
  } finally {
    if (requestId === clientPickerRequestId) {
      clientPickerLoadingMore.value = false
    }
  }
}

function resetClientSearchState() {
  clientFilterNeedle.value = ''
  clientSearchLoading.value = false
  selectedClientOption.value = null
  filteredClientOptions.value = []
  clientPickerBrowseOptions.value = []
  clientPickerBrowsePage.value = 1
  clientPickerBrowseHasMore.value = false
  clientPickerSearchOptions.value = []
  clientPickerSearchPage.value = 1
  clientPickerSearchHasMore.value = false
  clientPickerLoadingMore.value = false
  clientPickerUserScrolled.value = false
  clientPickerRequestId += 1
}

async function bootstrapClientPickerOptions() {
  if (!showClientPicker.value || clientPickerBrowseOptions.value.length) {
    return
  }

  const requestId = clientPickerRequestId
  try {
    await loadClientPickerFirstPage({ query: '', requestId })
  } catch {
    filteredClientOptions.value = []
    clientPickerBrowseOptions.value = []
    clientPickerBrowseHasMore.value = false
  }
}

function onClientFilter(val, update, abort) {
  clientFilterNeedle.value = String(val ?? '')
  const q = clientFilterNeedle.value.trim()
  const requestId = ++clientPickerRequestId

  if (q.length > 0 && !isClientListServerSearchQuery(q)) {
    update(() => {
      filteredClientOptions.value = selectedClientOption.value
        ? [selectedClientOption.value]
        : []
    })

    return
  }

  if (!q && clientPickerBrowseOptions.value.length) {
    clientPickerUserScrolled.value = false
    restoreClientPickerBrowseList(update)

    return
  }

  void (async() => {
    const isServerSearch = isClientListServerSearchQuery(q)
    if (isServerSearch) {
      clientPickerUserScrolled.value = false
      clientSearchLoading.value = true
    }

    try {
      await loadClientPickerFirstPage({ query: q, requestId })
      if (requestId !== clientPickerRequestId) {
        return
      }

      update(() => {
        filteredClientOptions.value = ensureSelectedClientInOptions(
          isServerSearch
            ? clientPickerSearchOptions.value
            : clientPickerBrowseOptions.value,
        )
      })
    } catch {
      if (requestId === clientPickerRequestId) {
        abort()
      }
    } finally {
      if (isServerSearch && requestId === clientPickerRequestId) {
        clientSearchLoading.value = false
      }
    }
  })()
}

function onClientPopupShow() {
  clientPickerUserScrolled.value = false
}

function onClientPopupHide() {
  clientPickerUserScrolled.value = false
}

function onClientPickerVirtualScroll({
  from,
  to,
  direction,
  ref: virtualScrollRef,
}) {
  if (from > 0) {
    clientPickerUserScrolled.value = true
  }

  const lastIndex = filteredClientOptions.value.length - 1
  if (
    !clientPickerUserScrolled.value
    || lastIndex < 0
    || to !== lastIndex
    || direction === 'decrease'
    || clientPickerLoadingMore.value
    || clientSearchLoading.value
  ) {
    return
  }

  void loadClientPickerNextPage(virtualScrollRef)
}

function onClientSelected(value) {
  if (!value) {
    selectedClientOption.value = null

    return
  }
  const match = filteredClientOptions.value.find(
    option => option.value === value,
  )
  if (match) {
    selectedClientOption.value = match
  }
}

async function loadFormOptions() {
  catalogsLoading.value = true
  try {
    const [servicesResult, clinicianResult, placesResult] =
      await Promise.allSettled([
        listBookableServiceProcedures(),
        fetchAllCliniciansSelectOptions(),
        listActivePlacesOfService(),
      ])

    serviceCatalog.value = servicesResult.status === 'fulfilled'
      ? servicesResult.value
      : []
    clinicianOptions.value = clinicianResult.status === 'fulfilled'
      ? clinicianResult.value
        .map(option => {
          const value = Number(option.value)
          if (!Number.isFinite(value) || value <= 0) {
            return null
          }

          return {
            ...option,
            value: String(value),
            supervisorId: option.supervisorId != null
              ? Number(option.supervisorId)
              : null,
          }
        })
        .filter(Boolean)
      : []
    allClinicianOptions.value = clinicianOptions.value
    placeOptions.value = placesResult.status === 'fulfilled'
      ? placesResult.value
      : []
    if (
      props.mode === 'book'
      && !draft.value.placeOfServiceId
      && placeOptions.value.length
    ) {
      draft.value.placeOfServiceId = resolveDefaultPlaceOfServiceId(
        placeOptions.value,
      )
    }
  } finally {
    catalogsLoading.value = false
  }
  await refreshEligibleClinicians()
}

function clinicianIdInOptions(options, id) {
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) {
    return false
  }

  return options.some(option => Number(option.value) === n)
}

function pickAutoClinicianId(options) {
  if (clinicianIdInOptions(options, draft.value.clinicianId)) {
    return Number(draft.value.clinicianId)
  }
  if (clinicianIdInOptions(options, props.initialClinicianId)) {
    return Number(props.initialClinicianId)
  }
  const linkedId = resolveLinkedClinicianId(options)
  if (linkedId != null) {
    return linkedId
  }
  if (options.length !== 1) {
    return null
  }
  const only = Number(options[0]?.value)

  return Number.isFinite(only) && only > 0 ? only : null
}

function applyAutoClinician(options) {
  if (props.mode !== 'book' || draft.value.clinicianId != null) {
    return
  }
  const nextId = pickAutoClinicianId(options)
  if (nextId == null) {
    return
  }
  draft.value.clinicianId = nextId
  applySupervisorFromSelectedClinician()
}

function mergeEligibleClinicianOptions(eligible) {
  return (eligible ?? []).map(row => {
    const match = allClinicianOptions.value.find(
      option => Number(option.value) === Number(row.value),
    )
    if (!match) {
      return {
        ...row,
        value: String(row.value),
      }
    }

    return {
      ...match,
      value: String(match.value),
    }
  })
}

function ensureSelectedClinicianInOptions(options) {
  if (clinicianIdInOptions(options, draft.value.clinicianId)) {
    return options
  }
  const selected = allClinicianOptions.value.find(
    option => Number(option.value) === Number(draft.value.clinicianId),
  )
  if (!selected) {
    return options
  }

  return [selected, ...options]
}

function eligibilityHintForSelection(eligible) {
  if (
    draft.value.clinicianId != null
    && !clinicianIdInOptions(eligible, draft.value.clinicianId)
  ) {
    return t('appointmentClinicianNotEligible')
  }

  return ''
}

async function refreshEligibleClinicians() {
  const ids = serviceProcedureIds.value.filter(id => id != null)
  if (!ids.length) {
    clinicianOptions.value = allClinicianOptions.value
    eligibilityHint.value = ''

    return
  }
  const dateOfService = selectedDayKey.value
    || todayLocalDayKey(timeZone)
  try {
    const eligible = mergeEligibleClinicianOptions(
      await listEligibleClinicians(ids, dateOfService),
    )
    if (!eligible.length) {
      clinicianOptions.value = ensureSelectedClinicianInOptions([])
      eligibilityHint.value = t('appointmentNoEligibleClinicians')

      return
    }
    clinicianOptions.value = ensureSelectedClinicianInOptions(eligible)
    applyAutoClinician(eligible)
    eligibilityHint.value = eligibilityHintForSelection(eligible)
  } catch {
    clinicianOptions.value = ensureSelectedClinicianInOptions([])
    eligibilityHint.value = t('appointmentNoEligibleClinicians')
  }
}

function resolveLinkedClinicianId(options = clinicianOptions.value) {
  const profile = linkedStaffProfile.value
  if (!profile?.isClinician || profile.id == null) {
    return null
  }
  const id = Number(profile.id)
  if (!Number.isFinite(id)) {
    return null
  }
  if (!options.some(option => Number(option.value) === id)) {
    return null
  }

  return id
}

function applySupervisorFromSelectedClinician() {
  const clinicianId = draft.value.clinicianId
  if (clinicianId == null) {
    return
  }
  if (Number(draft.value.supervisorId) === Number(clinicianId)) {
    draft.value.supervisorId = null
  }
  const option = clinicianOptions.value.find(
    row => Number(row.value) === Number(clinicianId),
  )
  const supervisorId = option?.supervisorId
  if (supervisorId == null || !Number.isFinite(Number(supervisorId))) {
    return
  }
  if (Number(supervisorId) === Number(clinicianId)) {
    return
  }
  draft.value.supervisorId = Number(supervisorId)
}

function addService(serviceId) {
  const service = serviceCatalog.value.find(row => row.id === serviceId)
  if (!service) {
    return
  }
  serviceLines.value = [
    ...serviceLines.value,
    ...buildServiceLinesFromCatalog(serviceCatalog.value, [serviceId]),
  ]
  void onSchedulingInputsChanged()
}

function applyInitialRequestPrefill() {
  const ids = (props.initialServiceProcedureIds ?? [])
    .map(Number)
    .filter(id => Number.isFinite(id) && id > 0)
  const seen = new Set()
  const nextIds = []
  for (const id of ids) {
    if (!seen.has(id) && serviceCatalog.value.some(row => row.id === id)) {
      seen.add(id)
      nextIds.push(id)
    }
  }
  if (nextIds.length) {
    serviceLines.value = buildServiceLinesFromCatalog(
      serviceCatalog.value,
      nextIds,
    )
  }
  const clinicianId = Number(props.initialClinicianId)
  if (Number.isFinite(clinicianId) && clinicianId > 0) {
    draft.value.clinicianId = clinicianId
  }
  const notes = String(props.initialNotes ?? '').trim()
  if (notes) {
    draft.value.notes = notes
  }
}

function removeService(index) {
  serviceLines.value = serviceLines.value.filter((_, i) => i !== index)
  void onSchedulingInputsChanged()
}

function onServiceDurationChange({ index, value }) {
  const line = serviceLines.value[index]
  if (!line || line.fixedDuration) {
    return
  }
  const next = Number(value)
  if (!isDurationWithinServiceRange(
    {
      minDurationMin: line.minDurationMin,
      maxDurationMin: line.maxDurationMin,
    },
    next,
  )) {
    return
  }
  serviceLines.value = serviceLines.value.map((row, i) =>
    i === index ? { ...row, durationMin: next } : row,
  )
  void onSchedulingInputsChanged()
}

function onServiceFeeChange({ index, value }) {
  const line = serviceLines.value[index]
  if (!line) {
    return
  }
  if (value === '' || value == null) {
    serviceLines.value = serviceLines.value.map((row, i) =>
      i === index ? { ...row, defaultFee: null } : row,
    )

    return
  }
  const fee = Number(value)
  if (!Number.isFinite(fee) || fee < 0) {
    return
  }
  serviceLines.value = serviceLines.value.map((row, i) =>
    i === index ? { ...row, defaultFee: fee } : row,
  )
}

async function onSchedulingInputsChanged() {
  const canLoad = Boolean(resolvedSchedulingClinicianId.value)
    && serviceLines.value.length > 0
    && Boolean(totalDurationMinutes.value)
  if (canLoad) {
    beginAvailabilityLoading()
    await nextTick()
  }
  try {
    const pending = [refreshEligibleClinicians()]
    if (canLoad) {
      pending.push(refreshDurationPreview(), loadAvailability())
    } else {
      pending.push(refreshDurationPreview())
      clearAvailability()
    }
    await Promise.all(pending)
    if (canLoad) {
      tryApplyBookingHint()
    }
  } catch {
    clearAvailability()
  }
}

function tryApplyBookingHint() {
  if (
    props.mode !== 'book'
    || !props.bookingHint
    || availabilityLoading.value
  ) {
    return
  }

  applyBookingHint(props.bookingHint)
}

function isRecurrenceEndDateAfterStart(endDateUs, startDayKey) {
  const endDayKey = usDateStringToLocalDayKey(endDateUs)
  const start = String(startDayKey ?? '').trim()
  if (!endDayKey || !start) {
    return false
  }

  return endDayKey > start
}

function validateDraft() {
  const next = {}
  if (showClientPicker.value && !draft.value.clientId) {
    next.clientId = t('appointmentClientRequired')
  }
  if (props.mode === 'book' && !serviceLines.value.length) {
    next.serviceProcedureIds = t('appointmentServiceRequired')
  }
  if (props.mode === 'book' && !draft.value.placeOfServiceId) {
    next.placeOfServiceId = t('appointmentPlaceOfServiceRequired')
  }
  if (props.mode === 'book' && !draft.value.clinicianId) {
    next.clinicianId = t('appointmentClinicianRequired')
  }
  if (!selectedWindow.value) {
    next.availability = t('appointmentAvailabilityRequired')
  } else if (props.mode === 'book') {
    const windowMinutes = selectedWindowDurationMinutes()
    if (
      Number.isFinite(windowMinutes)
      && Number.isFinite(totalDurationMinutes.value)
      && totalDurationMinutes.value > windowMinutes
    ) {
      next.availability = t('appointmentSelectedRangeTooShort', {
        duration: totalDurationMinutes.value,
        range: windowMinutes,
      })
    }
  }
  if (draft.value.notes.length > appointmentNotesMaxLength) {
    next.notes = t('appointmentNotesMaxLength', {
      max: appointmentNotesMaxLength,
    })
  }
  if (
    props.mode === 'book'
    && draft.value.repeatAppointment
    && draft.value.recurrence.frequency
      === appointmentRecurrenceFrequencyValues.weekly
    && !(draft.value.recurrence.daysOfWeek ?? []).length
  ) {
    next.daysOfWeek = t('appointmentRecurrenceDaysRequired')
  }
  if (
    props.mode === 'book'
    && draft.value.repeatAppointment
    && draft.value.recurrence.endType
      === appointmentRecurrenceEndTypeValues.onDate
  ) {
    const endDate = String(draft.value.recurrence.endOnDate ?? '').trim()
    if (!endDate) {
      next.endOnDate = t('appointmentRecurrenceEndDateRequired')
    } else if (
      selectedDayKey.value
      && !isRecurrenceEndDateAfterStart(
        endDate,
        selectedDayKey.value,
      )
    ) {
      next.endOnDate = t('appointmentRecurrenceEndDateAfterStart')
    }
  }
  errors.value = next

  return Object.keys(next).length === 0
}

function onCancel() {
  open.value = false
  emit('cancel')
}

function buildRecurrencePayload() {
  if (!draft.value.repeatAppointment) {
    return null
  }

  /* eslint-disable camelcase -- API payload */
  return {
    frequency: draft.value.recurrence.frequency,
    interval_count: Number(draft.value.recurrence.intervalCount) || 1,
    days_of_week: draft.value.recurrence.daysOfWeek,
    end_type: draft.value.recurrence.endType,
    end_after_count: draft.value.recurrence.endType
      === appointmentRecurrenceEndTypeValues.afterCount
      ? Number(draft.value.recurrence.endAfterCount)
      : null,
    end_on_date_utc: draft.value.recurrence.endType
      === appointmentRecurrenceEndTypeValues.onDate
      ? usDateStringToUtcStartIso(
        draft.value.recurrence.endOnDate,
        timeZone,
      ) || null
      : null,
  }
  /* eslint-enable camelcase */
}

function selectedWindowDurationMinutes() {
  const window = selectedWindow.value
  if (!window) {
    return null
  }
  const fromField = Number(window.durationMin)
  if (Number.isFinite(fromField) && fromField > 0) {
    return fromField
  }
  const start = Date.parse(window.startAtUtc)
  const end = Date.parse(window.endAtUtc)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null
  }

  return Math.round((end - start) / 60000)
}

function buildBookPayload(includeOccurrences = false) {
  /* eslint-disable camelcase -- API book payload */
  const payload = {
    start_at_utc: selectedWindow.value?.startAtUtc,
    service_procedure_ids: serviceProcedureIds.value,
    duration_minutes: totalDurationMinutes.value,
    place_of_service_id: draft.value.placeOfServiceId,
    // Backend creates meet + invite when true (no front session POST).
    telemedicine: selectedPlaceIsTelemedicine.value,
    notes: draft.value.notes || null,
    clinician_id: selectedWindow.value?.clinicianId
      ?? draft.value.clinicianId
      ?? null,
    supervisor_id: draft.value.supervisorId ?? null,
    repeat_appointment: Boolean(draft.value.repeatAppointment),
    recurrence: buildRecurrencePayload(),
  }

  const clientKey = String(resolvedClientId.value ?? '').trim()
  if (clientKey) {
    payload.client_number = clientKey
  }

  if (allowOverScheduleBlocks.value) {
    payload.allow_over_schedule_blocks = true
  }

  if (includeOccurrences && previewRows.value.length) {
    payload.occurrences = buildOccurrenceOverrides(
      previewRows.value,
    )
  }

  const referralId = Number(props.referralId)
  if (Number.isFinite(referralId) && referralId > 0) {
    payload.referral_id = referralId
  }

  return payload
  /* eslint-enable camelcase */
}

function canLoadRecurrencePreview() {
  if (!open.value || props.mode !== 'book') {
    return false
  }
  if (!draft.value.repeatAppointment) {
    return false
  }
  if (!selectedWindow.value?.startAtUtc) {
    return false
  }
  if (!String(resolvedClientId.value ?? '').trim()) {
    return false
  }
  if (!resolvedSchedulingClinicianId.value) {
    return false
  }
  if (!serviceProcedureIds.value.length) {
    return false
  }
  const rec = draft.value.recurrence ?? {}
  if (
    rec.frequency === appointmentRecurrenceFrequencyValues.weekly
    && !(rec.daysOfWeek ?? []).length
  ) {
    return false
  }
  if (
    rec.endType === appointmentRecurrenceEndTypeValues.onDate
    && !String(rec.endOnDate ?? '').trim()
  ) {
    return false
  }
  const count = Number(rec.endAfterCount)
  if (
    rec.endType === appointmentRecurrenceEndTypeValues.afterCount
    && !(count > 0)
  ) {
    return false
  }

  return true
}

async function onSubmit() {
  if (!validateDraft()) {
    return
  }
  if (props.mode === 'reschedule') {
    emit('rescheduled', {
      newStartAtUtc: selectedWindow.value?.startAtUtc,
      clinicianId: selectedWindow.value?.clinicianId
        ?? draft.value.clinicianId
        ?? null,
      notes: draft.value.notes || null,
    })

    return
  }
  if (draft.value.repeatAppointment) {
    await flushRecurrencePreview()
    emit('booked', buildBookPayload(true))

    return
  }
  emit('booked', buildBookPayload())
}

async function reloadAvailability() {
  await onSchedulingInputsChanged()
}

async function loadWorkingWeekdays() {
  const seq = workingWeekdaysSeq + 1
  workingWeekdaysSeq = seq
  const clinicianId = draft.value.clinicianId
  if (clinicianId == null) {
    workingWeekdays.value = [...CLINIC_DEFAULT_WEEKDAYS]

    return
  }
  try {
    const days = await listClinicianWorkingWeekdays(clinicianId)
    if (seq !== workingWeekdaysSeq) {
      return
    }
    workingWeekdays.value = days
  } catch {
    if (seq !== workingWeekdaysSeq) {
      return
    }
    workingWeekdays.value = [...CLINIC_DEFAULT_WEEKDAYS]
  }
}

watch(
  () => props.modelValue,
  async isOpen => {
    if (!isOpen) {
      resetRecurrencePreview()

      return
    }
    catalogsLoading.value = true
    draft.value = createDraft()
    serviceLines.value = []
    errors.value = {}
    resetRecurrencePreview()
    clearAvailability()
    resetClientSearchState()
    await loadFormOptions()
    applyInitialRequestPrefill()
    void bootstrapClientPickerOptions()
    await Promise.all([
      loadWorkingWeekdays(),
      onSchedulingInputsChanged(),
    ])
  },
)

watch(
  resolvedClientId,
  async(next, prev) => {
    if (!open.value || next === prev) {
      return
    }
    await onSchedulingInputsChanged()
  },
)

watch(
  () => draft.value.clinicianId,
  async(next, prev) => {
    if (next === prev) {
      return
    }
    applySupervisorFromSelectedClinician()
    clearSelectedWindow()
    await Promise.all([
      loadWorkingWeekdays(),
      onSchedulingInputsChanged(),
    ])
  },
)

watch(
  selectedDayKey,
  async() => {
    if (!open.value) {
      return
    }
    await refreshEligibleClinicians()
  },
)

watch(
  recurrencePreviewSignature,
  () => {
    if (!open.value || props.mode !== 'book') {
      return
    }
    scheduleRecurrencePreview()
  },
)

watch(
  () => draft.value.recurrence.daysOfWeek,
  days => {
    if (!errors.value.daysOfWeek || !(days ?? []).length) {
      return
    }
    const next = { ...errors.value }
    delete next.daysOfWeek
    errors.value = next
  },
)

watch(
  () => props.appointment,
  async appt => {
    if (props.mode !== 'reschedule' || !appt) {
      return
    }
    draft.value.notes = appt.notes ?? ''
    draft.value.clinicianId = appt.clinicianId ?? null
    serviceLines.value = (appt.serviceProcedures ?? []).map(line => ({
      serviceId: line.id,
      name: line.name,
      durationMin: line.durationMin,
      cptCode: line.cptCode,
      fixedDuration: true,
      minDurationMin: line.durationMin,
      maxDurationMin: line.durationMin,
    }))
    await onSchedulingInputsChanged()
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-book-dialog {
  &__body {
    max-height: min(80vh, 780px);
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

  &__actions {
    flex-wrap: nowrap;
    gap: 8px;

    .app-btn-outline {
      flex: 0 0 auto;
    }

    .app-btn-primary {
      flex: 1 1 auto;
      min-width: 0;

      :deep(.q-btn__content) {
        flex-wrap: nowrap;
        white-space: nowrap;
      }
    }
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

.appointment-client-select__avatar-section {
  min-width: 0;
  padding-right: 8px;
}
</style>
