<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="dialogTestId"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div v-if="showPlacesSearch" class="insurance-dialog__card-section">
          <PharmacyPlacesSearchField
            :reset-key="open"
            test-id-prefix="pharmacy-places"
            @select="applyPlaceDetails"
          />
        </div>

        <q-separator v-if="showPlacesSearch" class="q-my-md" />

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyName')"
              required
              :test-id="tid.field('name')">
              <q-input
                v-model="local.name"
                outlined
                hide-bottom-space
                counter
                :readonly="readonly"
                :maxlength="pharmacyNameMaxLength"
                :placeholder="t('pharmacyNamePlaceholder')"
                :error="Boolean(errors.name)"
                :error-message="errors.name"
                :data-testid="tid.field('name')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyPhone')"
              :test-id="tid.field('phone')">
              <q-input
                v-model="local.phone"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :maxlength="pharmacyPhoneMaxLength"
                :placeholder="t('pharmacyPhonePlaceholder')"
                :data-testid="tid.field('phone')">
                <template #prepend>
                  <q-icon name="phone" />
                </template>
              </q-input>
            </AddClientLabeledField>
          </div>

          <div class="col-12">
            <AddClientLabeledField
              :label="t('pharmacyAddress')"
              required
              :test-id="tid.field('address')">
              <q-input
                v-model="local.addressLine"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :maxlength="pharmacyAddressMaxLength"
                :placeholder="t('pharmacyAddressPlaceholder')"
                :error="Boolean(errors.addressLine)"
                :error-message="errors.addressLine"
                :data-testid="tid.field('address')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyFax')"
              :test-id="tid.field('fax')">
              <q-input
                v-model="local.fax"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :maxlength="pharmacyFaxMaxLength"
                :placeholder="t('pharmacyFaxPlaceholder')"
                :data-testid="tid.field('fax')">
                <template #prepend>
                  <q-icon name="print" />
                </template>
              </q-input>
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyCity')"
              required
              :test-id="tid.field('city')">
              <q-input
                v-model="local.city"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :maxlength="pharmacyCityMaxLength"
                :placeholder="t('pharmacyCityPlaceholder')"
                :error="Boolean(errors.city)"
                :error-message="errors.city"
                :data-testid="tid.field('city')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyState')"
              required
              :test-id="tid.field('state')">
              <FormSelect
                v-model="local.state"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="usStates"
                :placeholder="t('pharmacyStatePlaceholder')"
                :error="Boolean(errors.state)"
                :error-message="errors.state"
                :test-id="tid.field('state')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyZip')"
              required
              :test-id="tid.field('zip')">
              <q-input
                v-model="local.zipCode"
                outlined
                hide-bottom-space
                :readonly="readonly"
                :maxlength="pharmacyZipMaxLength"
                :placeholder="t('pharmacyZipPlaceholder')"
                :error="Boolean(errors.zipCode)"
                :error-message="errors.zipCode"
                :data-testid="tid.field('zip')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('pharmacyCountry')"
              required
              :test-id="tid.field('country')">
              <FormSelect
                v-model="local.country"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="countryOptions"
                :error="Boolean(errors.country)"
                :error-message="errors.country"
                :test-id="tid.field('country')"
              />
            </AddClientLabeledField>
          </div>

          <div class="col-12">
            <AddClientLabeledField
              :label="t('pharmacyNotes')"
              :test-id="tid.field('notes')">
              <q-input
                v-model="local.notes"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                counter
                :readonly="readonly"
                :maxlength="pharmacyNotesMaxLength"
                :placeholder="t('pharmacyNotesPlaceholder')"
                :data-testid="tid.field('notes')"
              />
            </AddClientLabeledField>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <div class="pharmacy-dialog__preferred">
          <q-checkbox
            v-model="local.preferred"
            :disable="readonly"
            :label="t('pharmacySetPreferred')"
            :data-testid="tid.field('preferred')"
          />
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            {{ t('pharmacySetPreferredHint') }}
          </p>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="tid.btn('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('pharmacySave')"
          :loading="saving"
          :disable="saving"
          :data-testid="tid.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from './AppDialogHeader.vue'
import AddClientLabeledField from './AddClientLabeledField.vue'
import PharmacyPlacesSearchField from './PharmacyPlacesSearchField.vue'
import FormSelect from './FormSelect.vue'
import {
  pharmacyAddressMaxLength,
  pharmacyCityMaxLength,
  pharmacyFaxMaxLength,
  pharmacyNameMaxLength,
  pharmacyNotesMaxLength,
  pharmacyPhoneMaxLength,
  pharmacyZipMaxLength,
} from './constants.js'
import { usStates } from 'src/data/us-geography.js'
import { pharmacyTestIds as tid } from 'src/test-ids/index.js'
import { createEmptyPharmacyForm } from 'src/utils/medication-normalize.js'
import { isAddressPlaceSearchAvailable } from
  'src/utils/address-places-search.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
  },
  pharmacy: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const countryOptions = [{ label: 'United States', value: 'US' }]

const dialogBodyScrollRef = ref(null)
const local = ref(createEmptyPharmacyForm())
const errors = reactive({})

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const readonly = computed(() => props.mode === 'view')

const showPlacesSearch = computed(
  () => !readonly.value && isAddressPlaceSearchAvailable(),
)

const dialogTestId = computed(() => tid.dialog(props.mode))

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('pharmacyViewTitle')
  }
  if (props.mode === 'edit') {
    return t('pharmacyEditTitle')
  }

  return t('pharmacyAddTitle')
})

const dialogSubtitle = computed(
  () => props.mode === 'add' ? t('pharmacyAddSubtitle') : '',
)

watch(
  () => [props.modelValue, props.pharmacy],
  () => {
    if (!props.modelValue) {
      return
    }
    resetLocalForm()
  },
  { immediate: true },
)

function resetLocalForm() {
  const source = props.pharmacy ?? createEmptyPharmacyForm()
  local.value = { ...createEmptyPharmacyForm(), ...source }
  Object.keys(errors).forEach(key => delete errors[key])
}

function applyPlaceDetails(details) {
  if (!details) {
    return
  }
  local.value.name = details.name || local.value.name
  local.value.phone = details.phone || local.value.phone
  local.value.addressLine = details.addressLine || local.value.addressLine
  local.value.city = details.city || local.value.city
  local.value.state = details.state || local.value.state
  local.value.zipCode = details.zipCode || local.value.zipCode
  local.value.country = details.country || local.value.country
}

function validateForm() {
  Object.keys(errors).forEach(key => delete errors[key])
  const form = local.value
  if (!String(form.name ?? '').trim()) {
    errors.name = t('pharmacyNameRequired')
  }
  if (!String(form.addressLine ?? '').trim()) {
    errors.addressLine = t('pharmacyAddressRequired')
  }
  if (!String(form.city ?? '').trim()) {
    errors.city = t('pharmacyCityRequired')
  }
  if (!form.state) {
    errors.state = t('pharmacyStateRequired')
  }
  if (!String(form.zipCode ?? '').trim()) {
    errors.zipCode = t('pharmacyZipRequired')
  }
  if (!form.country) {
    errors.country = t('pharmacyCountryRequired')
  }

  return !Object.keys(errors).length
}

function onCancel() {
  emit('cancel')
  open.value = false
}

async function onSave() {
  if (!validateForm()) {
    await notifyAndScrollToValidationErrors(dialogBodyScrollRef)

    return
  }
  emit('save', { ...local.value })
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.pharmacy-dialog__preferred {
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  padding: 12px 16px;
  background: rgba($primary, 0.03);
}

.pharmacy-dialog__places-results {
  max-height: 220px;
  overflow-y: auto;
}
</style>
