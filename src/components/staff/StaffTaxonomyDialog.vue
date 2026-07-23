<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ t('staffTaxonomyAddTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('staffTaxonomyAddSubtitle') }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('staffPrimaryTaxonomyLabel')"
              required>
              <ProviderTaxonomySelect
                v-model="selectedCode"
                :exclude-codes="excludeCodes"
                :placeholder="t('staffPrimaryTaxonomyPlaceholder')"
                :error="Boolean(errorMessage)"
                :error-message="errorMessage"
                @select-option="onSelectOption"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <FormToggle
              v-model="setAsPrimary"
              :label="t('staffTaxonomySetAsPrimaryLabel')"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('staffTaxonomyAddConfirm')"
          :disable="!selectedCode"
          @click="onSave"
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
import FormToggle from 'components/FormToggle.vue'
import ProviderTaxonomySelect from 'components/ProviderTaxonomySelect.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  excludeCodes: {
    type: Array,
    default: () => [],
  },
  defaultPrimary: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const selectedCode = ref(null)
const selectedOption = ref(null)
const setAsPrimary = ref(false)
const errorMessage = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

function resetLocal() {
  selectedCode.value = null
  selectedOption.value = null
  setAsPrimary.value = props.defaultPrimary
  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  value => {
    if (value) {
      resetLocal()
    }
  },
)

function onSelectOption(option) {
  selectedOption.value = option
  errorMessage.value = ''
}

function onCancel() {
  open.value = false
}

function onSave() {
  const code = String(selectedCode.value ?? '').trim()
  if (!code) {
    errorMessage.value = t('staffPrimaryTaxonomyRequired')
    return
  }
  if ((props.excludeCodes ?? []).includes(code)) {
    errorMessage.value = t('staffTaxonomyDuplicate')
    return
  }

  emit('save', {
    code,
    displayName: selectedOption.value?.displayName
      || selectedOption.value?.label
      || code,
    definition: selectedOption.value?.definition || '',
    grouping: selectedOption.value?.grouping || '',
    classification: selectedOption.value?.classification || '',
    specialization: selectedOption.value?.specialization || '',
    isPrimary: Boolean(setAsPrimary.value || props.defaultPrimary),
  })
  open.value = false
}
</script>
