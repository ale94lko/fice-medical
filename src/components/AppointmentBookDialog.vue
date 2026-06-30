<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card appointment-book-dialog">
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
                <FormSelect
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
                v-if="!placeOptions.length"
                class="text-caption text-grey-7 q-mt-xs">
                {{ t('appointmentPlacesEmpty') }}
              </p>
            </div>

            <div class="col-12">
              <AppointmentServiceLinesField
                :lines="serviceLines"
                :catalog="serviceCatalog"
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

            <div class="col-12">
              <div class="appointment-book-dialog__duration-card">
                <p class="appointment-book-dialog__duration-title">
                  {{ t('appointmentTotalDurationTitle') }}
                </p>
                <p class="appointment-book-dialog__duration-value">
                  {{
                    totalDurationMinutes
                      ? t('appointmentDurationMinutes', {
                        count: totalDurationMinutes,
                      })
                      : '—'
                  }}
                </p>
                <ul
                  v-if="serviceLines.length"
                  class="appointment-book-dialog__duration-list">
                  <li
                    v-for="(line, index) in serviceLines"
                    :key="line.serviceId">
                    {{ t('appointmentServiceLineSummary', {
                      index: index + 1,
                      name: line.name,
                      count: line.durationMin,
                      fixed: line.fixedDuration
                        ? t('appointmentDurationFixedTag')
                        : t('appointmentDurationSelectedTag'),
                    }) }}
                  </li>
                </ul>
                <div class="appointment-book-dialog__fee-row q-mt-sm">
                  <span>{{ t('appointmentSuggestedFeeTotal') }}</span>
                  <strong>{{ suggestedFeeLabel }}</strong>
                </div>
                <div class="appointment-book-dialog__fee-row">
                  <span>{{ t('appointmentCptCodes') }}</span>
                  <strong>{{ cptCodesLabel }}</strong>
                </div>
              </div>
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
              <AddClientLabeledField
                :label="t('appointmentSupervisorOptional')"
                :test-id="tid.field('supervisor')">
                <FormSelect
                  v-model="draft.supervisorId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
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

            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentCarePlanOptional')"
                :test-id="tid.field('care-plan')">
                <FormSelect
                  v-model="draft.carePlanId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :options="carePlanOptions"
                  :test-id="tid.field('care-plan')"
                />
              </AddClientLabeledField>
            </div>

            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('appointmentReferralOptional')"
                :test-id="tid.field('referral')">
                <FormSelect
                  v-model="draft.referralId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :options="referralOptions"
                  :test-id="tid.field('referral')"
                />
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
              :empty-label="availabilityEmptyLabel"
              :readonly="schedulingLocked"
              @select-day="selectDay"
              @select-window="selectWindow"
              @select-grid-time="selectGridTime"
              @update-scheduling-start-time="setSchedulingStartTime"
              @update-scheduling-end-time="setSchedulingEndTime"
              @commit-scheduling-start-time="commitSchedulingStartTime"
              @commit-scheduling-end-time="commitSchedulingEndTime"
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
              <div
                v-if="summaryCarePlan"
                class="appointment-summary-item">
                <q-icon name="assignment" size="18px" />
                <span>{{ summaryCarePlan }}</span>
              </div>
              <div
                v-if="summaryReferral"
                class="appointment-summary-item">
                <q-icon name="link" size="18px" />
                <span>{{ summaryReferral }}</span>
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

        <AppointmentRecurrenceSection
          v-if="mode === 'book'"
          v-model="draft"
          class="q-mt-md"
        />
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
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppointmentAvailabilityPicker from
  'components/appointment/AppointmentAvailabilityPicker.vue'
import AppointmentRecurrenceSection from
  'components/appointment/AppointmentRecurrenceSection.vue'
import AppointmentServiceLinesField from
  'components/appointment/AppointmentServiceLinesField.vue'
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
import { useSiteStore } from 'src/stores/site-store.js'
import {
  formatCodesSummary,
  formatFeeLabel,
  isDurationWithinServiceRange,
  sumServiceLineDurations,
  sumSuggestedFees,
} from 'src/utils/appointment-booking.js'
import {
  listBookableServiceProcedures,
  listClientCarePlans,
  listClientReferrals,
} from 'src/utils/appointment-api.js'
import { fetchAllCliniciansSelectOptions } from 'src/utils/clinicians-api.js'
import {
  listActivePlacesOfService,
  resolveDefaultPlaceOfServiceId,
} from 'src/utils/place-of-service-api.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
  usDateStringToUtcStartIso,
} from 'src/utils/appointment-datetime.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'
import {
  CLIENT_LIST_SEARCH_MIN_LENGTH,
  isClientListServerSearchQuery,
} from 'src/utils/client-list-search.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientId: { type: [String, Number], default: null },
  mode: { type: String, default: 'book' },
  appointment: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  bookingHint: { type: Object, default: null },
})

const emit = defineEmits([
  'update:modelValue',
  'booked',
  'rescheduled',
  'cancel',
])

const { t } = useI18n()
const siteStore = useSiteStore()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const draft = ref(createDraft())
const errors = ref({})
const serviceCatalog = ref([])
const serviceLines = ref([])
const clinicianOptions = ref([])
const supervisorOptions = ref([])
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
const carePlanOptions = ref([])
const referralOptions = ref([])

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

const schedulingFilters = computed(() => ({
  serviceProcedureIds: serviceProcedureIds.value,
  durationMinutes: totalDurationMinutes.value,
  clinicianId: props.mode === 'reschedule'
    ? props.appointment?.clinicianId
    : draft.value.clinicianId,
  placeOfServiceId: draft.value.placeOfServiceId,
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
  refreshDurationPreview,
  loadAvailability,
  applyBookingHint,
  shiftVisibleMonth,
} = booking

const schedulingLocked = computed(() =>
  props.mode === 'book' && !serviceLines.value.length,
)

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

const availabilityEmptyLabel = computed(() => {
  if (!serviceLines.value.length) {
    return t('appointmentSelectServicesFirst')
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

const cptCodesLabel = computed(() =>
  formatCodesSummary(serviceLines.value),
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
    opt => opt.value === draft.value.clinicianId,
  )

  return match?.label ?? t('appointmentClinicianAutoAssign')
})

const summarySupervisor = computed(() => {
  const match = supervisorOptions.value.find(
    opt => opt.value === draft.value.supervisorId,
  )

  return match?.label ?? ''
})

const summaryPlaceOfService = computed(() => {
  const match = placeOptions.value.find(
    opt => opt.value === draft.value.placeOfServiceId,
  )

  return match?.label ?? '—'
})

const summaryServices = computed(() =>
  serviceLines.value
    .map(line => `${line.name} (${line.durationMin} min)`)
    .join(', ') || '—',
)

const summaryCarePlan = computed(() =>
  carePlanOptions.value.find(opt => opt.value === draft.value.carePlanId)
    ?.label ?? '',
)

const summaryReferral = computed(() =>
  referralOptions.value.find(opt => opt.value === draft.value.referralId)
    ?.label ?? '',
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
    carePlanId: null,
    referralId: null,
    notes: '',
    repeatAppointment: false,
    recurrence: {
      frequency: appointmentRecurrenceFrequencyValues.weekly,
      intervalCount: 1,
      daysOfWeek: [1, 3, 5],
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
    value: row.id,
    name: name || clientNumber || String(row?.id ?? ''),
    clientNumber,
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

async function loadLinkedOptions() {
  const client = String(resolvedClientId.value ?? '').trim()
  if (!client) {
    carePlanOptions.value = []
    referralOptions.value = []

    return
  }
  const [carePlans, referrals] = await Promise.all([
    listClientCarePlans(client),
    listClientReferrals(client),
  ])
  carePlanOptions.value = carePlans
  referralOptions.value = referrals
}

async function loadFormOptions() {
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
      .map(option => ({
        label: option.label,
        value: Number(option.value),
      }))
      .filter(option => Number.isFinite(option.value))
    : []
  supervisorOptions.value = clinicianOptions.value
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
  clearSelectedWindow()
  await refreshDurationPreview()
  if (
    serviceLines.value.length
    && draft.value.placeOfServiceId
    && totalDurationMinutes.value
  ) {
    await loadAvailability()
    tryApplyBookingHint()
  } else {
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
  if (!selectedWindow.value) {
    next.availability = t('appointmentAvailabilityRequired')
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

function buildBookPayload() {
  /* eslint-disable camelcase -- API book payload */
  return {
    start_at_utc: selectedWindow.value?.startAtUtc,
    service_procedure_ids: serviceProcedureIds.value,
    duration_minutes: totalDurationMinutes.value,
    place_of_service_id: draft.value.placeOfServiceId,
    client_id: Number(resolvedClientId.value),
    notes: draft.value.notes || null,
    clinician_id: selectedWindow.value?.clinicianId
      ?? draft.value.clinicianId
      ?? null,
    supervisor_id: draft.value.supervisorId ?? null,
    referral_id: draft.value.referralId ?? null,
    care_plan_id: draft.value.carePlanId ?? null,
    repeat_appointment: Boolean(draft.value.repeatAppointment),
    recurrence: buildRecurrencePayload(),
  }
  /* eslint-enable camelcase */
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
  emit('booked', buildBookPayload())
}

async function reloadAvailability() {
  await onSchedulingInputsChanged()
}

watch(
  () => props.modelValue,
  async isOpen => {
    if (!isOpen) {
      return
    }
    draft.value = createDraft()
    serviceLines.value = []
    errors.value = {}
    clearAvailability()
    resetClientSearchState()
    await loadFormOptions()
    void bootstrapClientPickerOptions()
    await loadLinkedOptions()
  },
)

watch(
  () => resolvedClientId.value,
  () => {
    void loadLinkedOptions()
  },
)

watch(
  () => draft.value.placeOfServiceId,
  async(next, prev) => {
    if (next === prev || props.mode !== 'book') {
      return
    }
    clearSelectedWindow()
    await onSchedulingInputsChanged()
  },
)

watch(
  () => draft.value.clinicianId,
  async(next, prev) => {
    if (next === prev) {
      return
    }
    clearSelectedWindow()
    await onSchedulingInputsChanged()
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

  &__duration-card {
    border: 1px solid rgba($primary, 0.2);
    border-radius: 12px;
    background: rgba($primary, 0.04);
    padding: 14px 16px;
  }

  &__duration-title {
    margin: 0;
    font-size: 0.8125rem;
    color: $grey-7;
    font-weight: 600;
  }

  &__duration-value {
    margin: 6px 0 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: $primary;
  }

  &__duration-list {
    margin: 10px 0 0;
    padding-left: 18px;
    font-size: 0.8125rem;
    color: $text-strong;
  }

  &__fee-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.8125rem;
    color: $grey-7;
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
