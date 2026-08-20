<template>
  <div
    class="encounter-ros encounter-pe"
    :data-testid="tid.narrativePe">
    <p class="text-body2 text-grey-7 q-mb-sm">
      {{ t('peProgress', {
        completed: answeredCount,
        total: physicalExamAreas.length,
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
      v-for="area in physicalExamAreas"
      :key="area.key"
      class="encounter-ros__item">
      <div class="row items-center q-col-gutter-md encounter-ros__status">
        <div class="col-12 col-sm">
          <FormFieldLabel :label="t(area.labelKey)" />
        </div>
        <div class="col-12 col-sm-6">
          <FormSelect
            :model-value="statusOf(area) || ''"
            :test-id="tid.narrativePeStatus(area.key)"
            outlined
            hide-bottom-space
            emit-value
            map-options
            class="full-width"
            :disable="!canEdit"
            :options="physicalExamStatusOptions(area, t)"
            @update:model-value="value => onStatusChange(area, value)"
          />
        </div>
      </div>
      <div
        v-if="physicalExamNeedsFindings(statusOf(area))"
        class="encounter-ros__details">
        <AddClientLabeledField
          :label="t('peFindings')"
          required>
          <q-input
            :model-value="findingsOf(area)"
            outlined
            :disable="!canEdit"
            :data-testid="tid.narrativePeFindings(area.key)"
            :placeholder="t('peFindingsPlaceholder')"
            :error="findingsError(area)"
            :error-message="t('peFindingsRequired', {
              area: t(area.labelKey),
            })"
            maxlength="2000"
            @update:model-value="value => onFindingsChange(area, value)"
            @blur="emit('flush')"
          />
        </AddClientLabeledField>
      </div>
      <div
        v-else-if="physicalExamNeedsReason(statusOf(area), area)"
        class="encounter-ros__details">
        <AddClientLabeledField :label="t('peReason')">
          <q-input
            :model-value="reasonOf(area)"
            outlined
            hide-bottom-space
            :disable="!canEdit"
            :data-testid="tid.narrativePeReason(area.key)"
            :placeholder="t('peReasonPlaceholder')"
            maxlength="2000"
            @update:model-value="value => onReasonChange(area, value)"
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
  parsePhysicalExamValues,
  physicalExamAnsweredCount,
  physicalExamAreas,
  physicalExamIssueCodes,
  physicalExamIssues,
  physicalExamNeedsFindings,
  physicalExamNeedsReason,
  physicalExamStatusOptions,
  serializePhysicalExamValues,
} from 'src/utils/physical-exam.js'

const props = defineProps({
  field: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'flush'])
const { t } = useI18n()

const values = computed(() =>
  parsePhysicalExamValues(props.field?.valueJson),
)

const answeredCount = computed(() =>
  physicalExamAnsweredCount(values.value),
)

const issues = computed(() => physicalExamIssues(
  values.value,
  Boolean(props.field?.required),
))

function statusOf(area) {
  return values.value[area.key]?.status || null
}

function findingsOf(area) {
  return values.value[area.key]?.findings || ''
}

function reasonOf(area) {
  return values.value[area.key]?.reason || ''
}

function findingsError(area) {
  return physicalExamNeedsFindings(statusOf(area))
    && !String(findingsOf(area)).trim()
}

function issueText(issue) {
  const area = t(issue.labelKey)
  if (issue.code === physicalExamIssueCodes.findings) {
    return t('peFindingsRequiredShort', { area })
  }

  return t('peStatusRequiredShort', { area })
}

function commit(next) {
  emit('update', serializePhysicalExamValues(next))
}

function onStatusChange(area, value) {
  const next = {
    ...values.value,
    [area.key]: {
      ...values.value[area.key],
      status: value || null,
    },
  }
  commit(next)
}

function onFindingsChange(area, value) {
  const next = {
    ...values.value,
    [area.key]: {
      ...values.value[area.key],
      findings: value,
    },
  }
  commit(next)
}

function onReasonChange(area, value) {
  const next = {
    ...values.value,
    [area.key]: {
      ...values.value[area.key],
      reason: value,
    },
  }
  commit(next)
}
</script>
