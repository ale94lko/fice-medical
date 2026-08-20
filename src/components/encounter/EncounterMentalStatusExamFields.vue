<template>
  <div
    class="encounter-ros encounter-mse"
    :data-testid="tid.narrativeMse">
    <p class="text-body2 text-grey-7 q-mb-sm">
      {{ t('mseProgress', {
        completed: answeredCount,
        total: mseFields.length,
      }) }}
    </p>
    <div
      v-if="issues.length"
      class="encounter-ros__issues q-mb-md">
      <div class="text-body2 text-grey-8">
        {{ t('rosRequiresAttention') }}
      </div>
      <ul class="q-mb-none q-pl-md">
        <li
          v-for="issue in issues"
          :key="`${issue.key}-${issue.code}`"
          class="text-body2 text-negative">
          {{ issueText(issue) }}
        </li>
      </ul>
    </div>
    <div
      v-for="item in mseFields"
      :key="item.key"
      class="encounter-ros__item">
      <div class="row items-center q-col-gutter-md encounter-ros__status">
        <div class="col-12 col-sm">
          <FormFieldLabel :label="t(item.labelKey)" />
        </div>
        <div class="col-12 col-sm-6">
          <FormSelect
            :model-value="valueOf(item) || ''"
            :test-id="tid.narrativeMseValue(item.key)"
            outlined
            hide-bottom-space
            emit-value
            map-options
            class="full-width"
            :disable="!canEdit"
            :options="mseFieldOptions(item, t)"
            @update:model-value="value => onValueChange(item, value)"
          />
        </div>
      </div>
      <div
        v-if="mseNeedsDetails(valueOf(item))"
        class="encounter-ros__details">
        <AddClientLabeledField
          :label="t('mseDetails')"
          required>
          <q-input
            :model-value="detailsOf(item)"
            outlined
            :disable="!canEdit"
            :data-testid="tid.narrativeMseDetails(item.key)"
            :placeholder="t('mseDetailsPlaceholder')"
            :error="detailsError(item)"
            :error-message="t('mseDetailsRequired', {
              field: t(item.labelKey),
            })"
            maxlength="2000"
            @update:model-value="value => onDetailsChange(item, value)"
            @blur="emit('flush')"
          />
        </AddClientLabeledField>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormFieldLabel from 'components/FormFieldLabel.vue'
import FormSelect from 'components/FormSelect.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  mseAnsweredCount,
  mseFieldOptions,
  mseFields,
  mseIssueCodes,
  mseIssues,
  mseNeedsDetails,
  parseMentalStatusExamValues,
  serializeMentalStatusExamValues,
} from 'src/utils/mental-status-exam.js'

const props = defineProps({
  field: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'flush'])
const { t } = useI18n()

const values = computed(() =>
  parseMentalStatusExamValues(props.field?.valueJson),
)

const answeredCount = computed(() =>
  mseAnsweredCount(values.value),
)

const issues = computed(() => mseIssues(
  values.value,
  Boolean(props.field?.required),
))

function valueOf(item) {
  return values.value[item.key]?.value || null
}

function detailsOf(item) {
  return values.value[item.key]?.details || ''
}

function detailsError(item) {
  return mseNeedsDetails(valueOf(item))
    && !String(detailsOf(item)).trim()
}

function issueText(issue) {
  const field = t(issue.labelKey)
  if (issue.code === mseIssueCodes.details) {
    return t('mseDetailsRequiredShort', { field })
  }

  return t('mseValueRequiredShort', { field })
}

function commit(next) {
  emit('update', serializeMentalStatusExamValues(next))
}

function onValueChange(item, value) {
  const next = {
    ...values.value,
    [item.key]: {
      ...values.value[item.key],
      value: value || null,
    },
  }
  commit(next)
}

function onDetailsChange(item, value) {
  const next = {
    ...values.value,
    [item.key]: {
      ...values.value[item.key],
      details: value,
    },
  }
  commit(next)
}
</script>
