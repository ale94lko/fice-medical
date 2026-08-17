<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.startDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card start-encounter-dialog">
      <AppDialogHeader
        test-id="start-encounter"
        :close-label="t('close')"
        @close="onCancel">
        {{ t('startEncounterTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('startEncounterHint') }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <FormField required :label="t('encounterTypeLabel')">
              <div
                class="start-encounter-type-grid"
                role="radiogroup"
                :aria-label="t('encounterTypeLabel')">
                <button
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  type="button"
                  class="start-encounter-type-card"
                  :class="[
                    opt.toneClass,
                    {
                      'start-encounter-type-card--selected':
                        draft.encounterType === opt.value,
                      'start-encounter-type-card--disabled':
                        opt.disabled,
                    },
                  ]"
                  :disabled="opt.disabled"
                  :aria-pressed="draft.encounterType === opt.value"
                  :aria-disabled="opt.disabled ? 'true' : 'false'"
                  :data-testid="tid.field(`type-${opt.value}`)"
                  @click="onSelectType(opt.value)">
                  <span
                    class="start-encounter-type-card__icon"
                    aria-hidden="true">
                    <q-icon :name="opt.icon" size="22px" />
                  </span>
                  <span class="start-encounter-type-card__label">
                    {{ opt.label }}
                  </span>
                  <span class="start-encounter-type-card__hint">
                    {{ opt.hint }}
                  </span>
                </button>
              </div>
            </FormField>
          </div>

          <div
            v-if="isAppointmentType"
            class="col-12">
            <FormField
              required
              :label="t('startEncounterTodayAppointments')">
              <div
                v-if="loadingAppointments"
                class="start-encounter-appointments__loading text-body2
                  text-grey-7">
                {{ t('startEncounterAppointmentsLoading') }}
              </div>
              <div
                v-else-if="appointmentsError"
                class="start-encounter-appointments__empty text-body2
                  text-negative">
                {{ t('startEncounterAppointmentsError') }}
              </div>
              <div
                v-else-if="!todayAppointments.length"
                class="start-encounter-appointments__empty text-body2
                  text-grey-7">
                {{ t('startEncounterAppointmentsEmpty') }}
              </div>
              <div
                v-else
                class="start-encounter-appointments"
                role="listbox"
                :aria-label="t('startEncounterTodayAppointments')">
                <button
                  v-for="appt in todayAppointments"
                  :key="appt.appointmentId"
                  type="button"
                  class="start-encounter-appointment-card"
                  :class="{
                    'start-encounter-appointment-card--selected':
                      Number(draft.appointmentId)
                        === Number(appt.appointmentId),
                  }"
                  role="option"
                  :aria-selected="Number(draft.appointmentId)
                    === Number(appt.appointmentId)"
                  :data-testid="tid.field(
                    `appointment-${appt.appointmentId}`,
                  )"
                  @click="selectAppointment(appt)">
                  <span class="start-encounter-appointment-card__time">
                    {{ appointmentTimeLabel(appt) }}
                  </span>
                  <span class="start-encounter-appointment-card__meta">
                    {{ appointmentMetaLabel(appt) }}
                  </span>
                  <span
                    v-if="appointmentStatusText(appt.status)"
                    class="start-encounter-appointment-card__status">
                    {{ appointmentStatusText(appt.status) }}
                  </span>
                </button>
              </div>
            </FormField>
          </div>

          <div class="col-12 col-md-6">
            <FormField
              required
              :label="t('appointmentPlaceOfService')">
              <FormSelect
                v-model="draft.placeOfServiceId"
                outlined
                dense
                emit-value
                map-options
                :options="placeOptions"
                :loading="loadingCatalogs"
                :placeholder="t('appointmentPlaceOfServicePlaceholder')"
                :test-id="tid.field('place-of-service')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('encounterClinicianLabel')">
              <q-input
                outlined
                dense
                hide-bottom-space
                readonly
                :model-value="loggedInClinicianLabel"
                :placeholder="t('encounterClinicianLoggedInPlaceholder')"
                :data-testid="tid.field('clinician')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField :label="t('encounterChiefComplaintLabel')">
              <q-input
                v-model="draft.chiefComplaint"
                outlined
                dense
                hide-bottom-space
                type="textarea"
                autogrow
                :data-testid="tid.field('chief-complaint')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField :label="t('encounterNotesLabel')">
              <q-input
                v-model="draft.notes"
                outlined
                dense
                hide-bottom-space
                type="textarea"
                autogrow
                :data-testid="tid.field('notes')"
              />
            </FormField>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          :disable="saving"
          :data-testid="ewTid.startCancel"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          class="start-encounter-dialog__submit"
          :label="t('startEncounterSubmit')"
          :loading="saving"
          :disable="!canSubmit"
          :data-testid="tid.startSubmit"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { encounterTypes } from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import { useAuthStore } from 'src/stores/auth-store.js'
import {
  encounterTestIds as tid,
  encounterWorkspaceTestIds as ewTid,
  modalTestIds,
} from 'src/test-ids/index.js'
import { listClientAppointments } from 'src/utils/appointment-api.js'
import { appointmentCanStartEncounter } from
  'src/utils/appointment-actions.js'
import {
  formatUtcTimeRange,
  localDayKeyFromUtc,
  resolveTenantTimeZone,
  todayLocalDayKey,
  utcRangeForLocalDay,
} from 'src/utils/appointment-datetime.js'
import { resolveDefaultResponsibleClinicianOption } from
  'src/utils/care-plan-orders.js'
import { fetchAllCliniciansSelectOptions } from
  'src/utils/clinicians-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  isTelemedicinePlaceOfService,
  listActivePlacesOfService,
  resolveDefaultPlaceOfServiceId,
} from 'src/utils/place-of-service-api.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientId: { type: [String, Number], default: null },
  saving: { type: Boolean, default: false },
  presetEncounterType: { type: String, default: null },
  presetAppointmentId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])
const { t } = useI18n()
const authStore = useAuthStore()
const { linkedStaffProfile } = storeToRefs(authStore)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loadingCatalogs = ref(false)
const loadingAppointments = ref(false)
const appointmentsError = ref(false)
const clinicianOptions = ref([])
const placeOptions = ref([])
const todayAppointments = ref([])

const draft = reactive({
  appointmentId: null,
  encounterType: encounterTypes.walkIn,
  clinicianId: null,
  placeOfServiceId: null,
  chiefComplaint: '',
  notes: '',
})

const appointmentTypeDisabled = computed(() =>
  !loadingAppointments.value
  && !appointmentsError.value
  && todayAppointments.value.length === 0,
)

const appointmentTypeHint = computed(() => {
  if (loadingAppointments.value) {
    return t('startEncounterAppointmentsLoading')
  }
  if (appointmentsError.value) {
    return t('startEncounterAppointmentsError')
  }
  const count = todayAppointments.value.length
  if (count === 0) {
    return t('startEncounterAppointmentsEmpty')
  }

  return t('encounterTypeScheduledHintCount', { count })
})

const typeOptions = computed(() => [
  {
    label: t('encounterTypeWalkIn'),
    hint: t('encounterTypeWalkInHint'),
    value: encounterTypes.walkIn,
    icon: 'directions_walk',
    toneClass: 'start-encounter-type-card--walk-in',
    disabled: false,
  },
  {
    label: t('encounterTypePhone'),
    hint: t('encounterTypePhoneHint'),
    value: encounterTypes.phone,
    icon: 'phone_in_talk',
    toneClass: 'start-encounter-type-card--phone',
    disabled: false,
  },
  {
    label: t('encounterTypeTelehealth'),
    hint: t('encounterTypeTelehealthHint'),
    value: encounterTypes.telehealth,
    icon: 'videocam',
    toneClass: 'start-encounter-type-card--telehealth',
    disabled: false,
  },
  {
    label: t('encounterTypeScheduled'),
    hint: appointmentTypeHint.value,
    value: encounterTypes.scheduled,
    icon: 'event_available',
    toneClass: 'start-encounter-type-card--scheduled',
    disabled: appointmentTypeDisabled.value,
  },
])

const isAppointmentType = computed(
  () => draft.encounterType === encounterTypes.scheduled,
)

const loggedInClinicianOption = computed(() =>
  resolveDefaultResponsibleClinicianOption(
    clinicianOptions.value,
    { staffMember: linkedStaffProfile.value },
  ),
)

const loggedInClinicianLabel = computed(() => {
  const option = loggedInClinicianOption.value
  if (option?.label) {
    return String(option.label).trim()
  }
  const staff = linkedStaffProfile.value
  if (!staff?.isClinician) {
    return ''
  }
  const name = [
    staff.firstName,
    staff.lastName,
  ].map(part => String(part ?? '').trim()).filter(Boolean).join(' ')

  return name || String(staff.displayName ?? '').trim()
})

const loggedInClinicianId = computed(() => {
  const option = loggedInClinicianOption.value
  if (option?.value != null) {
    return option.value
  }
  const staff = linkedStaffProfile.value
  if (staff?.isClinician && staff.id != null) {
    return staff.id
  }

  return null
})

const selectedPlace = computed(() =>
  placeOptions.value.find(
    opt => Number(opt.value) === Number(draft.placeOfServiceId),
  ) ?? null,
)

const canSubmit = computed(() => {
  if (!draft.encounterType
    || loggedInClinicianId.value == null
    || draft.placeOfServiceId == null) {
    return false
  }
  if (isAppointmentType.value && draft.appointmentId == null) {
    return false
  }

  return true
})

function resetDraft() {
  draft.appointmentId = null
  draft.encounterType = encounterTypes.walkIn
  draft.clinicianId = null
  draft.placeOfServiceId = null
  draft.chiefComplaint = ''
  draft.notes = ''
}

function applyLoggedInClinician() {
  draft.clinicianId = loggedInClinicianId.value
}

function applyPresetSelection() {
  const type = String(props.presetEncounterType ?? '').trim().toUpperCase()
  if (type) {
    draft.encounterType = type
  }
  if (
    type === encounterTypes.scheduled
    && props.presetAppointmentId != null
  ) {
    draft.appointmentId = props.presetAppointmentId
  }
}

function resolvePlaceIdForType(type) {
  const options = placeOptions.value
  if (!options.length) {
    return null
  }
  if (type === encounterTypes.telehealth) {
    const tele = options.find(opt =>
      isTelemedicinePlaceOfService(opt.raw),
    )

    return tele?.value
      ?? resolveDefaultPlaceOfServiceId(options)
  }
  const office = options.find(opt =>
    String(opt.raw?.code ?? '').trim() === '11',
  )

  return resolveDefaultPlaceOfServiceId(options)
    ?? office?.value
    ?? options[0]?.value
    ?? null
}

function applyTypePlaceDefaults(type) {
  if (draft.appointmentId != null) {
    return
  }
  const nextId = resolvePlaceIdForType(type)
  if (nextId != null) {
    draft.placeOfServiceId = nextId
  }
}

function isSelectableTodayAppointment(appt) {
  if (!appt?.appointmentId || !appt?.startAtUtc) {
    return false
  }

  return appointmentCanStartEncounter(appt.status)
}

function appointmentTimeLabel(appt) {
  return formatUtcTimeRange(
    appt.startAtUtc,
    appt.endAtUtc,
    resolveTenantTimeZone(),
  ) || '—'
}

function appointmentMetaLabel(appt) {
  const parts = [
    appt.servicesLabel || appt.appointmentTypeName,
    appt.clinicianDisplayName,
  ].map(part => String(part ?? '').trim()).filter(Boolean)

  return parts.join(' · ') || '—'
}

function appointmentStatusText(status) {
  const key = `appointmentStatus${String(status ?? '')
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join('')}`
  const label = t(key)

  return label === key ? String(status ?? '') : label
}

function resolvePlaceIdFromAppointment(appt) {
  if (appt?.placeOfServiceId != null) {
    const byId = placeOptions.value.find(
      opt => Number(opt.value) === Number(appt.placeOfServiceId),
    )
    if (byId) {
      return byId.value
    }
  }
  const code = String(appt?.placeOfServiceCode ?? '').trim()
  if (code) {
    const byCode = placeOptions.value.find(
      opt => String(opt.raw?.code ?? '').trim() === code,
    )
    if (byCode) {
      return byCode.value
    }
  }

  return null
}

function clearAppointmentSelection() {
  draft.appointmentId = null
}

function selectAppointment(appt) {
  if (!appt?.appointmentId) {
    return
  }
  draft.appointmentId = appt.appointmentId
  draft.encounterType = encounterTypes.scheduled
  applyLoggedInClinician()
  const placeId = resolvePlaceIdFromAppointment(appt)
  if (placeId != null) {
    draft.placeOfServiceId = placeId
  } else {
    applyTypePlaceDefaults(draft.encounterType)
  }
  if (appt.notes && !String(draft.notes ?? '').trim()) {
    draft.notes = String(appt.notes).trim()
  }
}

function onSelectType(type) {
  if (
    type === encounterTypes.scheduled
    && appointmentTypeDisabled.value
  ) {
    return
  }
  draft.encounterType = type
  if (type !== encounterTypes.scheduled) {
    clearAppointmentSelection()
    applyTypePlaceDefaults(type)

    return
  }
  applyTypePlaceDefaults(type)
}

async function loadTodayAppointments() {
  const id = String(props.clientId ?? '').trim()
  todayAppointments.value = []
  appointmentsError.value = false
  if (!id) {
    return
  }
  loadingAppointments.value = true
  try {
    const timeZone = resolveTenantTimeZone()
    const dayKey = todayLocalDayKey(timeZone)
    const { fromUtc, toUtc } = utcRangeForLocalDay(dayKey, timeZone)
    const items = await listClientAppointments(id, {
      // eslint-disable-next-line camelcase -- API query params
      from_utc: fromUtc,
      // eslint-disable-next-line camelcase -- API query params
      to_utc: toUtc,
      limit: 50,
    })
    todayAppointments.value = (items ?? [])
      .filter(appt =>
        isSelectableTodayAppointment(appt)
        && localDayKeyFromUtc(appt.startAtUtc, timeZone) === dayKey,
      )
      .sort((a, b) =>
        String(a.startAtUtc).localeCompare(String(b.startAtUtc)),
      )
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      appointmentsError.value = true
      todayAppointments.value = []
    }
  } finally {
    loadingAppointments.value = false
  }
}

async function loadCatalogs() {
  loadingCatalogs.value = true
  try {
    const [cliniciansResult, placesResult] = await Promise.allSettled([
      fetchAllCliniciansSelectOptions(),
      listActivePlacesOfService(),
    ])
    clinicianOptions.value = cliniciansResult.status === 'fulfilled'
      ? cliniciansResult.value
      : []
    placeOptions.value = placesResult.status === 'fulfilled'
      ? placesResult.value
      : []
    applyLoggedInClinician()
    applyTypePlaceDefaults(draft.encounterType)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      clinicianOptions.value = []
      placeOptions.value = []
    }
  } finally {
    loadingCatalogs.value = false
  }
}

function onCancel() {
  open.value = false
}

function onSubmit() {
  applyLoggedInClinician()
  if (!canSubmit.value) {
    return
  }
  const type = String(draft.encounterType).toUpperCase()
  const place = selectedPlace.value
  const placeCode = String(place?.raw?.code ?? '').trim()
  const selectedAppt = todayAppointments.value.find(
    appt => Number(appt.appointmentId) === Number(draft.appointmentId),
  )
  const payload = {
    encounterType: type,
    clinicianId: loggedInClinicianId.value,
    placeOfServiceCode: placeCode || undefined,
    chiefComplaint: String(draft.chiefComplaint ?? '').trim()
      || undefined,
    notes: String(draft.notes ?? '').trim() || undefined,
    telemedicine: isTelemedicinePlaceOfService(place?.raw)
      || Boolean(selectedAppt?.telemedicine)
      || type === encounterTypes.telehealth,
  }
  if (draft.appointmentId != null) {
    payload.appointmentId = draft.appointmentId
  }
  emit('submit', payload)
}

watch(() => draft.encounterType, applyTypePlaceDefaults)

watch(open, async(value) => {
  if (!value) {
    return
  }
  resetDraft()
  applyPresetSelection()
  await Promise.all([loadCatalogs(), loadTodayAppointments()])
  applyLoggedInClinician()
  if (
    draft.encounterType === encounterTypes.scheduled
    && draft.appointmentId != null
  ) {
    const appt = todayAppointments.value.find(
      row => Number(row.appointmentId) === Number(draft.appointmentId),
    )
    if (appt) {
      selectAppointment(appt)
    }
  } else {
    applyTypePlaceDefaults(draft.encounterType)
  }
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.start-encounter-appointments {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
}

.start-encounter-appointments__loading,
.start-encounter-appointments__empty {
  margin: 0;
  padding: 10px 12px;
  border: 1px dashed $border-subtle;
  border-radius: $radius-md;
  background: $surface-muted;
}

.start-encounter-appointment-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface;
  color: $text-strong;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: rgba($primary, 0.35);
    background: rgba($primary, 0.04);
  }

  &:focus-visible {
    outline: 2px solid rgba($primary, 0.45);
    outline-offset: 2px;
  }

  &--selected {
    border-color: rgba($primary, 0.55);
    background: rgba($primary, 0.07);
    box-shadow: 0 0 0 1px rgba($primary, 0.22);
  }

  &__time {
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.3;
  }

  &__meta {
    font-size: 0.75rem;
    line-height: 1.35;
    color: $text-muted;
  }

  &__status {
    margin-top: 2px;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: $primary;
  }
}

.start-encounter-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.start-encounter-type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-height: 92px;
  padding: 12px 12px 10px;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface;
  color: $text-strong;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow-sm;
  }

  &:focus-visible {
    outline: 2px solid rgba($primary, 0.45);
    outline-offset: 2px;
  }

  &--disabled,
  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    margin-bottom: 2px;
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25;
  }

  &__hint {
    font-size: 0.75rem;
    line-height: 1.3;
    color: $text-muted;
  }

  &--walk-in &__icon {
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &--phone &__icon {
    background: rgba($info, 0.12);
    color: $info;
  }

  &--telehealth &__icon {
    background: rgba($accent, 0.14);
    color: $fice-teal-dark;
  }

  &--scheduled &__icon {
    background: rgba($positive, 0.14);
    color: $positive;
  }

  &--walk-in.start-encounter-type-card--selected {
    border-color: rgba($primary, 0.55);
    background: rgba($primary, 0.06);
    box-shadow: 0 0 0 1px rgba($primary, 0.25);
  }

  &--phone.start-encounter-type-card--selected {
    border-color: rgba($info, 0.55);
    background: rgba($info, 0.06);
    box-shadow: 0 0 0 1px rgba($info, 0.25);
  }

  &--telehealth.start-encounter-type-card--selected {
    border-color: rgba($accent, 0.55);
    background: rgba($accent, 0.08);
    box-shadow: 0 0 0 1px rgba($accent, 0.28);
  }

  &--scheduled.start-encounter-type-card--selected {
    border-color: rgba($positive, 0.55);
    background: rgba($positive, 0.08);
    box-shadow: 0 0 0 1px rgba($positive, 0.25);
  }
}

.start-encounter-dialog__submit {
  border-radius: $radius-md;
  background: #16a34a !important;
  color: #ffffff !important;

  &:hover,
  &:focus {
    background: #15803d !important;
  }
}

@media (max-width: 899px) {
  .start-encounter-type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .start-encounter-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
