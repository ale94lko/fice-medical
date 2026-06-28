<template>
  <div class="staff-basic-info-tab">
    <div
      v-if="showNpiLookup"
      class="staff-basic-info-tab__npi-section">
      <SectionHeading
        icon="search"
        :title="t('staffNpiLookupLabel')"
      />
      <div class="fields">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div
              class="row q-col-gutter-sm items-end
                staff-basic-info-tab__npi-row">
              <div class="col">
                <q-input
                  :model-value="localNpi"
                  outlined
                  hide-bottom-space
                  class="full-width"
                  type="tel"
                  maxlength="10"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :readonly="readonly"
                  :placeholder="t('staffNpiLookupPlaceholder')"
                  @update:model-value="onNpiInput"
                  @keypress="onNpiKeypress"
                  @paste="onNpiPaste"
                  @keyup.enter="onNpiSearch"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  no-caps
                  unelevated
                  color="primary"
                  class="app-btn-primary staff-basic-info-tab__npi-search-btn"
                  icon="search"
                  :loading="npiLoading"
                  :disable="readonly || !canSearchNpi"
                  :label="t('search')"
                  @click="onNpiSearch"
                />
              </div>
            </div>
          </div>
          <div
            v-if="npiFoundBanner"
            class="col-12">
            <div
              class="staff-npi-found-banner row items-start q-pa-md">
              <q-icon name="check_circle" color="positive" size="22px" />
              <div class="q-ml-sm">
                <div class="text-body2 text-weight-medium">
                  {{ t('staffNpiLookupFoundTitle') }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ t('staffNpiLookupFoundHint') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-separator
      v-if="showNpiLookup"
      class="section-separator q-my-md"
    />

    <AccordionSection
      icon="person"
      :title="t('staffPersonalInformationTitle')">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('prefix')">
            <FormSelect
              v-model="basic.prefix"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :readonly="readonly"
              :options="prefixOptions"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('firstName')" required>
            <TextInput
              v-model="basic.firstName"
              :external-label="true"
              :readonly="readonly"
              :error="Boolean(fieldErrors.firstName)"
              :error-message="fieldErrors.firstName"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('middleName')">
            <TextInput
              v-model="basic.middleName"
              :external-label="true"
              :readonly="readonly"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('lastName')" required>
            <TextInput
              v-model="basic.lastName"
              :external-label="true"
              :readonly="readonly"
              :error="Boolean(fieldErrors.lastName)"
              :error-message="fieldErrors.lastName"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('suffix')">
            <FormSelect
              v-model="basic.suffix"
              outlined
              hide-bottom-space
              emit-value
              map-options
              clearable
              :readonly="readonly"
              :options="suffixOptions"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12 col-md-6">
          <AddClientLabeledField :label="t('dob')" required>
            <ClientDateField
              v-model="basic.dob"
              :readonly="readonly"
              :close-label="t('close')"
              :error="Boolean(fieldErrors.dob)"
              :error-message="fieldErrors.dob"
            />
          </AddClientLabeledField>
        </div>
        <div class="col-12">
          <AddClientLabeledField :label="t('gender')" required>
            <div class="row q-col-gutter-sm">
              <div
                v-for="opt in genderOptions"
                :key="opt.value"
                class="col-12 col-md-4">
                <q-btn
                  flat
                  no-caps
                  class="full-width staff-gender-card"
                  :disable="readonly"
                  :class="{
                    'staff-gender-card--selected': basic.sex === opt.value,
                  }"
                  @click="basic.sex = opt.value">
                  <q-radio
                    :model-value="basic.sex"
                    :val="opt.value"
                    :disable="readonly"
                    color="primary"
                    @update:model-value="basic.sex = $event"
                  />
                  <span class="q-ml-sm">{{ opt.label }}</span>
                </q-btn>
              </div>
            </div>
          </AddClientLabeledField>
        </div>
      </div>
    </AccordionSection>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from 'components/AccordionSection.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import SectionHeading from 'components/SectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  isValidNpiDigits,
  lookupNpiRegistry,
  sanitizeNpiDigits,
} from 'src/utils/npi-registry-api.js'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  showNpiLookup: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  prefixOptions: {
    type: Array,
    default: () => [],
  },
  suffixOptions: {
    type: Array,
    default: () => [],
  },
  fieldErrors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'npi-result'])

const { t } = useI18n()
const $q = useQuasar()

const npiLoading = ref(false)
const npiFoundBanner = ref(false)
const localNpi = ref('')

const canSearchNpi = computed(() => isValidNpiDigits(localNpi.value))

const basic = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const genderOptions = computed(() => [
  { value: 'Male', label: t('genderMale') },
  { value: 'Female', label: t('genderFemale') },
  { value: 'Other', label: t('genderOther') },
])

const fieldErrors = computed(() => props.fieldErrors ?? {})

function onNpiInput(value) {
  localNpi.value = sanitizeNpiDigits(value)
}

function onNpiKeypress(event) {
  if (props.readonly) {
    return
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return
  }
  const key = String(event.key ?? '')
  if (key.length === 1 && !/\d/.test(key)) {
    event.preventDefault()
  }
}

function onNpiPaste(event) {
  if (props.readonly) {
    return
  }
  event.preventDefault()
  const pasted = event.clipboardData?.getData('text') ?? ''
  localNpi.value = sanitizeNpiDigits(pasted)
}

function applyNpiLookup(result) {
  if (!result?.found) {
    npiFoundBanner.value = false
    return
  }
  npiFoundBanner.value = true
  basic.value = {
    ...basic.value,
    prefix: result.prefix ?? result.name_prefix ?? basic.value.prefix,
    firstName: result.first_name ?? basic.value.firstName,
    middleName: result.middle_name ?? basic.value.middleName,
    lastName: result.last_name ?? basic.value.lastName,
    suffix: result.suffix ?? basic.value.suffix,
    sex: result.sex ?? basic.value.sex,
    npiLookup: result.npi ?? localNpi.value,
    npiLookupFound: true,
  }
}

async function onNpiSearch() {
  if (!canSearchNpi.value) {
    return
  }
  npiLoading.value = true
  try {
    const result = await lookupNpiRegistry(localNpi.value)
    if (!result.found) {
      npiFoundBanner.value = false
      $q.notify({
        type: quasarNotifyTypes.warning,
        message: t('staffNpiLookupNotFound'),
      })
      return
    }
    applyNpiLookup(result)
    emit('npi-result', result)
  } catch {
    npiFoundBanner.value = false
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('staffNpiLookupFailed'),
    })
  } finally {
    npiLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.staff-basic-info-tab {
  &__npi-row {
    width: 100%;
  }

  &__npi-search-btn {
    min-height: 40px;
  }
}
</style>
