<template>
  <div class="appointment-service-lines">
    <AddClientLabeledField
      v-if="!hideLabel"
      :label="resolvedLabel"
      :required="required">
      <AppointmentServiceSearchRow
        v-model="pendingServiceId"
        :options="filteredOptions"
        :disable="readonly || !canAddMore || loading"
        :add-disable="readonly || !canAddMore || !pendingServiceId || loading"
        :loading="loading"
        :placeholder="activeSearchPlaceholder"
        :test-id-prefix="testIdPrefix"
        @filter="onFilter"
        @input-value="onSearchInput"
        @add="commitPendingService"
      />
      <template #hint>
        {{ t('appointmentServicesSelectedCount', { count: lines.length }) }}
      </template>
    </AddClientLabeledField>

    <AppointmentServiceSearchRow
      v-else-if="!readonly"
      v-model="pendingServiceId"
      :options="filteredOptions"
      :disable="!canAddMore || loading"
      :add-disable="!canAddMore || !pendingServiceId || loading"
      :loading="loading"
      :placeholder="activeSearchPlaceholder"
      :test-id-prefix="testIdPrefix"
      @filter="onFilter"
      @input-value="onSearchInput"
      @add="commitPendingService"
    />

    <div
      v-for="(line, index) in lines"
      :key="line.serviceId"
      class="appointment-service-lines__card q-mt-md">
      <div class="appointment-service-lines__card-row">
        <div class="appointment-service-lines__info">
          <span
            v-if="lineCodeBadge(line)"
            class="appointment-service-lines__cpt">
            {{ lineCodeBadge(line) }}
          </span>
          <div class="appointment-service-lines__titles">
            <p class="appointment-service-lines__name">
              {{ line.name }}
            </p>
            <p
              v-if="lineSubtitle(line)"
              class="appointment-service-lines__meta">
              {{ lineSubtitle(line) }}
            </p>
          </div>
        </div>

        <div class="appointment-service-lines__metrics">
          <div class="appointment-service-lines__field">
            <AddClientLabeledField :label="t('appointmentDuration')">
              <q-input
                :model-value="line.durationMin"
                outlined
                hide-bottom-space
                dense
                type="number"
                class="appointment-service-lines__duration-input"
                :readonly="readonly || line.fixedDuration"
                :disable="readonly || line.fixedDuration"
                :data-testid="`${testIdPrefix}-duration-${line.serviceId}`"
                @update:model-value="value => onDurationChange(index, value)">
                <template #append>
                  <span class="appointment-service-lines__suffix">
                    {{ t('appointmentDurationUnitMin') }}
                  </span>
                </template>
              </q-input>
            </AddClientLabeledField>
          </div>

          <div
            class="appointment-service-lines__field
              appointment-service-lines__field--fee">
            <AddClientLabeledField
              :label="t('serviceProcedureDefaultFeeLabel')">
              <q-input
                :model-value="displayFeeValue(line)"
                outlined
                hide-bottom-space
                dense
                inputmode="decimal"
                :readonly="readonly"
                :disable="readonly"
                :data-testid="`${testIdPrefix}-fee-${line.serviceId}`"
                @focus="onFeeFocus(line)"
                @blur="onFeeBlur(index, line)"
                @update:model-value="value => onFeeInput(line, value)">
                <template #prepend>
                  <span class="appointment-service-lines__currency">$</span>
                </template>
              </q-input>
            </AddClientLabeledField>
          </div>
        </div>

        <q-btn
          v-if="!readonly"
          flat
          round
          dense
          icon="delete"
          color="primary"
          class="appointment-service-lines__remove-btn"
          :aria-label="t('remove')"
          :data-testid="tid.serviceLineRemove(index)"
          @click="emit('remove', index)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppointmentServiceSearchRow from
  'components/appointment/AppointmentServiceSearchRow.vue'
import { appointmentBookingMaxServices } from 'components/constants.js'
import {
  formatServiceCatalogOptionLabel,
  formatServiceDurationSummary,
} from 'src/utils/appointment-booking.js'
import { serviceProcedureCategoryLabel } from
  'src/utils/service-procedure-list-normalize.js'
import { appointmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  lines: { type: Array, default: () => [] },
  catalog: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  hideLabel: { type: Boolean, default: false },
  required: { type: Boolean, default: true },
  label: { type: String, default: '' },
  testIdPrefix: { type: String, default: 'appointment-services' },
})

const emit = defineEmits(['add', 'remove', 'duration-change', 'fee-change'])
const { t } = useI18n()
const searchNeedle = ref('')
const pendingServiceId = ref(null)
const feeInputDrafts = ref({})

const resolvedLabel = computed(() =>
  props.label || t('appointmentServicesLabel'),
)

const selectedIds = computed(() =>
  props.lines.map(line => line.serviceId),
)

const canAddMore = computed(() =>
  props.lines.length < appointmentBookingMaxServices,
)

const searchPlaceholder = computed(() =>
  props.lines.length
    ? t('appointmentServicesSearchAdd')
    : t('appointmentServicesSearchPlaceholder'),
)

const activeSearchPlaceholder = computed(() =>
  pendingServiceId.value ? undefined : searchPlaceholder.value,
)

const filteredOptions = ref([])

const availableOptions = computed(() =>
  props.catalog
    .filter(row => !selectedIds.value.includes(row.id))
    .map(row => {
      const cptCode = String(row.cptCode ?? '').trim()
      const durationSummary = formatServiceDurationSummary(row, t)

      return {
        label: formatServiceCatalogOptionLabel(row, t),
        value: row.id,
        name: row.name,
        cptCode,
        durationSummary,
        searchText: [
          row.name,
          cptCode,
          cptCode ? `CPT ${cptCode}` : '',
          durationSummary,
        ].join(' ').toLowerCase(),
      }
    }),
)

function applyServiceFilter(needle = '') {
  const q = String(needle ?? '').trim().toLowerCase()
  const base = availableOptions.value
  filteredOptions.value = q
    ? base.filter(option => option.searchText.includes(q))
    : [...base]
}

watch(
  availableOptions,
  () => {
    applyServiceFilter(searchNeedle.value)
    if (
      pendingServiceId.value != null
      && !findOptionById(pendingServiceId.value)
    ) {
      pendingServiceId.value = null
    }
  },
  { immediate: true, deep: true },
)

function findOptionById(id) {
  if (id == null || id === '') {
    return null
  }

  return availableOptions.value.find(
    option => String(option.value) === String(id),
  ) ?? null
}

function lineCodeBadge(line) {
  const cpt = String(line?.cptCode ?? '').trim()
  if (cpt) {
    return `CPT ${cpt}`
  }
  const hcpcs = String(line?.hcpcsCode ?? '').trim()
  if (hcpcs) {
    return `HCPCS ${hcpcs}`
  }

  return ''
}

function lineSubtitle(line) {
  const description = String(line?.description ?? '').trim()
  if (description) {
    return description
  }
  const category = String(line?.category ?? '').trim()
  if (!category) {
    return ''
  }

  const label = serviceProcedureCategoryLabel(category, t)

  return label === '—' ? '' : label
}

function feeDraftKey(serviceId) {
  return String(serviceId)
}

function formatFeeDisplay(fee) {
  if (fee == null || fee === '') {
    return ''
  }
  const amount = Number(fee)

  return Number.isFinite(amount) ? amount.toFixed(2) : ''
}

function displayFeeValue(line) {
  const key = feeDraftKey(line.serviceId)
  if (Object.hasOwn(feeInputDrafts.value, key)) {
    return feeInputDrafts.value[key]
  }

  return formatFeeDisplay(line.defaultFee)
}

function onFeeFocus(line) {
  const key = feeDraftKey(line.serviceId)
  if (Object.hasOwn(feeInputDrafts.value, key)) {
    return
  }

  feeInputDrafts.value = {
    ...feeInputDrafts.value,
    [key]: formatFeeDisplay(line.defaultFee),
  }
}

function onFeeInput(line, value) {
  feeInputDrafts.value = {
    ...feeInputDrafts.value,
    [feeDraftKey(line.serviceId)]: String(value ?? ''),
  }
}

function clearFeeDraft(serviceId) {
  const key = feeDraftKey(serviceId)
  if (!Object.hasOwn(feeInputDrafts.value, key)) {
    return
  }

  const next = { ...feeInputDrafts.value }
  delete next[key]
  feeInputDrafts.value = next
}

function parseFeeInputValue(raw) {
  const text = String(raw ?? '').replace(/,/g, '').trim()
  if (!text) {
    return null
  }
  const amount = Number(text)

  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100) / 100
    : null
}

function onFeeBlur(index, line) {
  const key = feeDraftKey(line.serviceId)
  const raw = feeInputDrafts.value[key] ?? formatFeeDisplay(line.defaultFee)
  clearFeeDraft(line.serviceId)
  emit('fee-change', { index, value: parseFeeInputValue(raw) })
}

function onFilter(value, update) {
  update(() => {
    searchNeedle.value = String(value ?? '')
    applyServiceFilter(searchNeedle.value)
  })
}

function onSearchInput(value) {
  if (pendingServiceId.value == null) {
    return
  }

  const selected = findOptionById(pendingServiceId.value)
  if (!selected) {
    return
  }

  const next = String(value ?? '')
  // Quasar puede emitir vacío al seleccionar; no borrar la selección.
  if (!next || next === selected.label) {
    return
  }

  pendingServiceId.value = null
}

function commitPendingService() {
  if (!pendingServiceId.value) {
    return
  }
  emit('add', pendingServiceId.value)
  pendingServiceId.value = null
  searchNeedle.value = ''
  applyServiceFilter('')
}

function onDurationChange(index, value) {
  emit('duration-change', { index, value })
}
</script>
