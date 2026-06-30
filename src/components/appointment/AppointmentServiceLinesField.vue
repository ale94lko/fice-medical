<template>
  <div class="appointment-service-lines">
    <AddClientLabeledField
      :label="t('appointmentServicesLabel')"
      required>
      <div
        class="row q-col-gutter-sm items-center
          appointment-service-lines__search-row">
        <div class="col">
          <q-select
            v-model="pendingServiceId"
            outlined
            hide-bottom-space
            use-input
            fill-input
            hide-selected
            input-debounce="200"
            emit-value
            map-options
            option-label="label"
            :options="filteredOptions"
            :disable="readonly || !canAddMore"
            :placeholder="activeSearchPlaceholder"
            :data-testid="testIdPrefix + '-search'"
            @filter="onFilter"
            @input-value="onSearchInput">
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
            <template #no-option>
              <q-item>
                <q-item-section class="text-grey-7">
                  {{ t('appointmentServicesSearchEmpty') }}
                </q-item-section>
              </q-item>
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.name }}</q-item-label>
                  <q-item-label caption>
                    {{ formatOptionCaption(scope.opt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
        <div class="col-auto">
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary appointment-service-lines__add-btn"
            icon="add"
            :label="t('appointmentServicesAddButton')"
            :disable="readonly || !canAddMore || !pendingServiceId"
            :data-testid="testIdPrefix + '-add'"
            @click="commitPendingService"
          />
        </div>
      </div>
      <template #hint>
        {{ t('appointmentServicesSelectedCount', { count: lines.length }) }}
      </template>
    </AddClientLabeledField>

    <div
      v-if="!catalog.length"
      class="appointment-service-lines__empty q-mt-sm">
      {{ t('appointmentServicesCatalogEmpty') }}
    </div>

    <div
      v-for="(line, index) in lines"
      :key="line.serviceId"
      class="appointment-service-lines__card q-mt-md">
      <div class="appointment-service-lines__card-row">
        <div class="appointment-service-lines__info">
          <p class="appointment-service-lines__name">
            {{ line.name }}
          </p>
          <p
            v-if="lineMeta(line)"
            class="appointment-service-lines__meta">
            {{ lineMeta(line) }}
          </p>
        </div>

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

        <q-btn
          v-if="!readonly"
          flat
          round
          dense
          icon="close"
          class="appointment-service-lines__remove-btn"
          :aria-label="t('remove')"
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
import { appointmentBookingMaxServices } from 'components/constants.js'
import {
  formatServiceCatalogOptionLabel,
  formatServiceDurationSummary,
} from 'src/utils/appointment-booking.js'

const props = defineProps({
  lines: { type: Array, default: () => [] },
  catalog: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
  testIdPrefix: { type: String, default: 'appointment-services' },
})

const emit = defineEmits(['add', 'remove', 'duration-change', 'fee-change'])
const { t } = useI18n()
const searchNeedle = ref('')
const pendingServiceId = ref(null)
const feeInputDrafts = ref({})

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

function formatOptionCaption(option) {
  const parts = []
  if (option.cptCode) {
    parts.push(`CPT ${option.cptCode}`)
  }
  if (option.durationSummary) {
    parts.push(option.durationSummary)
  }

  return parts.join(' · ')
}

function lineMeta(line) {
  return formatOptionCaption({
    cptCode: line.cptCode,
    durationSummary: formatServiceDurationSummary(line, t),
  })
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

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.appointment-service-lines {
  &__search-row {
    width: 100%;
  }

  &__add-btn {
    min-height: 40px;
  }

  &__empty {
    font-size: 0.875rem;
    color: $grey-7;
  }

  &__card {
    border: 1px solid $border-subtle;
    border-radius: 12px;
    padding: 12px 14px;
    background: #fff;
  }

  &__card-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    min-width: 0;
  }

  &__info {
    flex: 1 1 auto;
    min-width: 0;
    padding-top: 1px;
  }

  &__name {
    margin: 0;
    font-weight: 700;
    font-size: 0.875rem;
    color: $text-strong;
    line-height: 1.3;
  }

  &__meta {
    margin: 4px 0 0;
    font-size: 0.8125rem;
    color: $grey-7;
    line-height: 1.35;
  }

  &__field {
    flex: 0 0 auto;
    width: 104px;

    :deep(.form-field__label) {
      margin-bottom: 4px;
    }

    :deep(.q-field) {
      width: 100%;
    }
  }

  &__duration-input {
    :deep(input[type='number']) {
      appearance: textfield;
    }

    :deep(input[type='number']::-webkit-outer-spin-button),
    :deep(input[type='number']::-webkit-inner-spin-button) {
      margin: 0;
      appearance: none;
    }
  }

  &__field--fee {
    width: 112px;
  }

  &__suffix,
  &__currency {
    font-size: 0.8125rem;
    color: $grey-7;
    font-weight: 500;
  }

  &__currency {
    color: $text-strong;
  }

  &__remove-btn {
    flex: 0 0 auto;
    align-self: flex-start;
    margin-top: -2px;
  }
}
</style>
