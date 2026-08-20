<template>
  <div class="fmh-social-fields">
    <div
      v-for="field in socialHistoryFields"
      :key="field.key"
      class="fmh-social-fields__item">
      <div
        class="row items-center q-col-gutter-md
          fmh-social-fields__status">
        <div class="col-12 col-sm">
          <FormFieldLabel :label="t(field.labelKey)" />
        </div>
        <div class="col-12 col-sm-6">
          <FormSelect
            :model-value="statusOf(field)"
            :test-id="tid.fmhSocialField(field.key)"
            outlined
            hide-bottom-space
            emit-value
            map-options
            clearable
            class="full-width"
            :disable="!canEdit"
            :options="selectOptions(field)"
            @update:model-value="value => onStatusChange(field, value)"
          />
        </div>
      </div>
      <q-input
        v-if="socialFieldNeedsNotes(field, statusOf(field))"
        class="fmh-social-fields__notes"
        :model-value="notesOf(field)"
        outlined
        hide-bottom-space
        :disable="!canEdit"
        :data-testid="tid.fmhSocialField(`${field.key}-notes`)"
        :placeholder="t(socialNotesPlaceholderKey(
          field,
          statusOf(field),
        ))"
        maxlength="500"
        @update:model-value="value => onNotesChange(field, value)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FormFieldLabel from 'components/FormFieldLabel.vue'
import FormSelect from 'components/FormSelect.vue'
import {
  applySocialStatusChange,
  createEmptySocialHistory,
  socialFieldNeedsNotes,
  socialHistoryFields,
  socialNotesPlaceholderKey,
} from 'src/utils/client-social-history.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => createEmptySocialHistory(),
  },
  canEdit: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const social = computed({
  get: () => props.modelValue ?? createEmptySocialHistory(),
  set: val => emit('update:modelValue', val),
})

function statusOf(field) {
  return social.value[field.statusKey] ?? null
}

function notesOf(field) {
  return social.value[field.notesKey] ?? ''
}

function selectOptions(field) {
  return field.options.map(option => ({
    label: t(option.labelKey),
    value: option.value,
  }))
}

function onStatusChange(field, value) {
  social.value = applySocialStatusChange(social.value, field, value)
}

function onNotesChange(field, value) {
  social.value = {
    ...social.value,
    [field.notesKey]: value,
  }
}
</script>
