<template>
  <div
    v-if="fields.length"
    class="consent-auth-fields">
    <SubsectionHeading
      :title="t('consentAuthorizationTitle')"
    />
    <p
      v-if="showErrors && missing.length"
      class="text-body2 text-negative q-mt-sm q-mb-none">
      {{ t('consentFieldsRequired') }}
    </p>
    <div class="row q-col-gutter-md q-mt-sm">
      <div
        v-for="field in fields"
        :key="field.key"
        class="col-12">
        <FormField
          :required="isRequired(field)"
          :label="field.label">
          <FormSelect
            v-if="field.fieldType === types.select"
            :model-value="valueOf(field)"
            outlined
            dense
            emit-value
            map-options
            hide-bottom-space
            :readonly="isLocked(field)"
            :disable="isLocked(field)"
            :options="selectOptions(field)"
            :test-id="tid.authField(field.key)"
            @update:model-value="onUpdate(field, $event)"
          />
          <FormSelect
            v-else-if="field.fieldType === types.multiSelect"
            :model-value="multiValue(field)"
            outlined
            dense
            emit-value
            map-options
            multiple
            use-chips
            hide-bottom-space
            :readonly="isLocked(field)"
            :disable="isLocked(field)"
            :options="selectOptions(field)"
            :test-id="tid.authField(field.key)"
            @update:model-value="onUpdate(field, $event)"
          />
          <ClientDateField
            v-else-if="field.fieldType === types.date"
            :model-value="valueOf(field)"
            :readonly="isLocked(field)"
            :test-id="tid.authField(field.key)"
            @update:model-value="onUpdate(field, $event)"
          />
          <FormToggle
            v-else-if="field.fieldType === types.checkbox"
            :model-value="Boolean(valueOf(field))"
            :disable="isLocked(field)"
            :test-id="tid.authField(field.key)"
            @update:model-value="onUpdate(field, $event)"
          />
          <q-input
            v-else-if="field.fieldType === types.textarea"
            :model-value="valueOf(field)"
            outlined
            type="textarea"
            autogrow
            hide-bottom-space
            :readonly="isLocked(field)"
            :placeholder="field.placeholder || undefined"
            :data-testid="tid.authField(field.key)"
            @update:model-value="onUpdate(field, $event)"
          />
          <TextInput
            v-else
            :model-value="valueOf(field)"
            outlined
            dense
            hide-bottom-space
            :readonly="isLocked(field)"
            :placeholder="field.placeholder || undefined"
            :test-id="tid.authField(field.key)"
            @update:model-value="onUpdate(field, $event)"
          />
          <template v-if="field.helpText" #hint>
            {{ field.helpText }}
          </template>
        </FormField>
        <p
          v-if="showErrors && isMissing(field)"
          class="text-body2 text-negative q-mt-xs q-mb-none">
          {{ t('consentFieldValueRequired') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ClientDateField from 'components/ClientDateField.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import { clientConsentsTestIds as tid } from
  'src/test-ids/index.js'
import {
  consentFieldTypeValues as types,
  emptyValueForConsentField,
  isConsentFieldRequired,
  missingRequiredConsentFields,
} from 'src/utils/consent-fields.js'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  readonly: { type: Boolean, default: false },
  showErrors: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const missing = computed(() => missingRequiredConsentFields(
  props.fields,
  props.modelValue,
))

function isRequired(field) {
  return isConsentFieldRequired(
    field,
    props.fields,
    props.modelValue,
  )
}

function isLocked(field) {
  return props.readonly || Boolean(field?.readOnly)
}

function isMissing(field) {
  return missing.value.some(item => item.key === field.key)
}

function valueOf(field) {
  if (Object.prototype.hasOwnProperty.call(
    props.modelValue || {},
    field.key,
  )) {
    return props.modelValue[field.key]
  }

  return emptyValueForConsentField(field.fieldType)
}

function multiValue(field) {
  const value = valueOf(field)

  return Array.isArray(value) ? value : []
}

function selectOptions(field) {
  return (field.options || []).map(item => ({
    value: item.value,
    label: item.label,
  }))
}

function onUpdate(field, value) {
  if (isLocked(field)) {
    return
  }
  emit('update:modelValue', {
    ...props.modelValue,
    [field.key]: value,
  })
}
</script>
