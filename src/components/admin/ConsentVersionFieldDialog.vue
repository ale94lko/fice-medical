<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.fieldEditorDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :test-id="tid.fieldEditorDialog"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md
        q-pb-md">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <FormField required :label="t('consentFieldLabel')">
              <TextInput
                v-model="local.label"
                outlined
                dense
                hide-bottom-space
                :maxlength="255"
                :test-id="tid.field('label')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('consentFieldKey')">
              <TextInput
                v-model="local.key"
                outlined
                dense
                hide-bottom-space
                :maxlength="80"
                :placeholder="t('consentFieldKeyPlaceholder')"
                :test-id="tid.field('key')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField required :label="t('consentFieldType')">
              <FormSelect
                v-model="local.fieldType"
                outlined
                dense
                emit-value
                map-options
                hide-bottom-space
                :options="typeOptions"
                :test-id="tid.field('type')"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField :label="t('consentFieldPrefill')">
              <FormSelect
                v-model="local.prefillSource"
                outlined
                dense
                emit-value
                map-options
                hide-bottom-space
                :options="prefillOptions"
                :test-id="tid.field('prefill')"
              />
            </FormField>
          </div>
          <div
            v-if="local.prefillSource !== prefill.manual"
            class="col-12 col-md-6">
            <FormField :label="t('consentFieldPrefillKey')">
              <TextInput
                v-model="local.prefillKey"
                outlined
                dense
                hide-bottom-space
                :placeholder="t('consentFieldPrefillKeyHint')"
                :test-id="tid.field('prefill-key')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormToggle
              v-model="local.required"
              :label="t('consentFieldRequired')"
              :test-id="tid.field('required')"
            />
          </div>
          <div class="col-12">
            <FormToggle
              v-model="local.includeInDocument"
              :label="t('consentFieldIncludeInDocument')"
              :test-id="tid.field('include-in-document')"
            />
          </div>
          <div class="col-12">
            <FormToggle
              v-model="local.readOnly"
              :label="t('consentFieldReadOnly')"
              :test-id="tid.field('read-only')"
            />
          </div>
          <div
            v-if="needsOptions"
            class="col-12">
            <FormField required :label="t('consentFieldOptions')">
              <q-input
                v-model="optionsText"
                outlined
                type="textarea"
                autogrow
                :placeholder="t('consentFieldOptionsHint')"
                :data-testid="tid.field('options')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField :label="t('consentFieldPlaceholder')">
              <TextInput
                v-model="local.placeholder"
                outlined
                dense
                hide-bottom-space
                :test-id="tid.field('placeholder')"
              />
            </FormField>
          </div>
          <div class="col-12">
            <FormField :label="t('consentFieldHelpText')">
              <TextInput
                v-model="local.helpText"
                outlined
                dense
                hide-bottom-space
                :test-id="tid.field('help-text')"
              />
            </FormField>
          </div>
          <div
            v-if="!local.required && otherFields.length"
            class="col-12">
            <FormToggle
              v-model="conditionalOn"
              :label="t('consentFieldConditional')"
              :test-id="tid.field('conditional')"
            />
          </div>
          <div
            v-if="showConditional"
            class="col-12 col-md-6">
            <FormField
              required
              :label="t('consentFieldRequiredWhenField')">
              <FormSelect
                v-model="local.requiredWhenField"
                outlined
                dense
                emit-value
                map-options
                hide-bottom-space
                :options="otherFieldOptions"
                :test-id="tid.field('required-when-field')"
              />
            </FormField>
          </div>
          <div
            v-if="showConditional"
            class="col-12 col-md-6">
            <FormField
              required
              :label="t('consentFieldRequiredWhenValue')">
              <TextInput
                v-model="local.requiredWhenValue"
                outlined
                dense
                hide-bottom-space
                :placeholder="t('consentFieldRequiredWhenValueHint')"
                :test-id="tid.field('required-when-value')"
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
          :data-testid="modalTestIds.cancel(tid.fieldEditorDialog)"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          :disable="!canSave"
          :data-testid="tid.field('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import TextInput from 'components/TextInput.vue'
import {
  consentVersionDialogTestIds as tid,
  modalTestIds,
} from 'src/test-ids/index.js'
import {
  consentFieldPrefillOptions,
  consentFieldPrefillValues as prefill,
  consentFieldTypeOptions,
  emptyConsentFieldDefinition,
  needsConsentFieldOptions,
  optionsFromConsentFieldText,
  optionsTextFromConsentField,
  slugConsentFieldKey,
} from 'src/utils/consent-fields.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  field: { type: Object, default: null },
  otherFields: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = reactive(emptyConsentFieldDefinition())
const optionsText = ref('')
const conditionalOn = ref(false)

const typeOptions = computed(() => consentFieldTypeOptions(t))
const prefillOptions = computed(() => consentFieldPrefillOptions(t))
const needsOptions = computed(() => needsConsentFieldOptions(
  local.fieldType,
))
const showConditional = computed(() => (
  !local.required && conditionalOn.value
))
const otherFieldOptions = computed(() => props.otherFields.map(item => ({
  value: item.key,
  label: item.label || item.key,
})))
const dialogTitle = computed(() => (
  props.field?.key
    ? t('consentFieldEditTitle')
    : t('consentFieldAddTitle')
))
const canSave = computed(() => {
  if (!String(local.label ?? '').trim()) {
    return false
  }
  if (needsOptions.value
    && optionsFromConsentFieldText(optionsText.value).length === 0) {
    return false
  }
  if (showConditional.value) {
    if (!String(local.requiredWhenField ?? '').trim()) {
      return false
    }
    if (!String(local.requiredWhenValue ?? '').trim()) {
      return false
    }
  }

  return true
})

watch(
  () => [open.value, props.field],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    const source = props.field || emptyConsentFieldDefinition()
    Object.assign(local, emptyConsentFieldDefinition(), source)
    optionsText.value = optionsTextFromConsentField(source)
    conditionalOn.value = Boolean(
      source.requiredWhenField && source.requiredWhenValue,
    )
  },
)

function onCancel() {
  open.value = false
}

function onSave() {
  if (!canSave.value) {
    return
  }
  const payload = {
    ...local,
    key: String(local.key ?? '').trim()
      || slugConsentFieldKey(local.label),
    options: needsOptions.value
      ? optionsFromConsentFieldText(optionsText.value)
      : [],
    requiredWhenField: showConditional.value
      ? String(local.requiredWhenField ?? '').trim()
      : '',
    requiredWhenValue: showConditional.value
      ? String(local.requiredWhenValue ?? '').trim()
      : '',
  }
  emit('save', payload)
  open.value = false
}
</script>
