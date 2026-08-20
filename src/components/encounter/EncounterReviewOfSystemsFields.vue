<template>
  <div
    class="encounter-ros"
    :data-testid="tid.narrativeRos">
    <p class="text-body2 text-grey-7 q-mb-sm">
      {{ t('rosProgress', {
        completed: answeredCount,
        total: reviewOfSystems.length,
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
      v-for="system in reviewOfSystems"
      :key="system.key"
      class="encounter-ros__item">
      <div class="row items-center q-col-gutter-md encounter-ros__status">
        <div class="col-12 col-sm">
          <FormFieldLabel :label="t(system.labelKey)" />
        </div>
        <div class="col-12 col-sm-6">
          <FormSelect
            :model-value="statusOf(system) || ''"
            :test-id="tid.narrativeRosStatus(system.key)"
            outlined
            hide-bottom-space
            emit-value
            map-options
            class="full-width"
            :disable="!canEdit"
            :options="statusOptions"
            @update:model-value="value => onStatusChange(system, value)"
          />
        </div>
      </div>
      <div
        v-if="reviewOfSystemsNeedsDetails(statusOf(system))"
        class="encounter-ros__details">
        <AddClientLabeledField
          :label="t('rosDetails')"
          required>
          <q-input
            :model-value="detailsOf(system)"
            outlined
            :disable="!canEdit"
            :data-testid="tid.narrativeRosDetails(system.key)"
            :placeholder="t('rosDetailsPlaceholder')"
            :error="detailsError(system)"
            :error-message="t('rosDetailsRequired', {
              system: t(system.labelKey),
            })"
            maxlength="2000"
            @update:model-value="value => onDetailsChange(system, value)"
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
  parseReviewOfSystemsValues,
  reviewOfSystems,
  reviewOfSystemsAnsweredCount,
  reviewOfSystemsIssueCodes,
  reviewOfSystemsIssues,
  reviewOfSystemsNeedsDetails,
  reviewOfSystemsStatuses,
  serializeReviewOfSystemsValues,
} from 'src/utils/review-of-systems.js'

const props = defineProps({
  field: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'flush'])
const { t } = useI18n()

const values = computed(() =>
  parseReviewOfSystemsValues(props.field?.valueJson),
)

const answeredCount = computed(() =>
  reviewOfSystemsAnsweredCount(values.value),
)

const issues = computed(() => reviewOfSystemsIssues(
  values.value,
  Boolean(props.field?.required),
))

const statusOptions = computed(() => [
  {
    label: t('rosSelectStatus'),
    value: '',
  },
  {
    label: t('rosStatusNegative'),
    value: reviewOfSystemsStatuses.negative,
  },
  {
    label: t('rosStatusPositive'),
    value: reviewOfSystemsStatuses.positive,
  },
  {
    label: t('rosStatusNotReviewed'),
    value: reviewOfSystemsStatuses.notReviewed,
  },
])

function statusOf(system) {
  return values.value[system.key]?.status || null
}

function detailsOf(system) {
  return values.value[system.key]?.details || ''
}

function detailsError(system) {
  return reviewOfSystemsNeedsDetails(statusOf(system))
    && !String(detailsOf(system)).trim()
}

function issueText(issue) {
  const system = t(issue.labelKey)
  if (issue.code === reviewOfSystemsIssueCodes.details) {
    return t('rosDetailsRequiredShort', { system })
  }

  return t('rosStatusRequiredShort', { system })
}

function commit(next) {
  emit('update', serializeReviewOfSystemsValues(next))
}

function onStatusChange(system, value) {
  const next = {
    ...values.value,
    [system.key]: {
      ...values.value[system.key],
      status: value || null,
    },
  }
  commit(next)
}

function onDetailsChange(system, value) {
  const next = {
    ...values.value,
    [system.key]: {
      ...values.value[system.key],
      details: value,
    },
  }
  commit(next)
}
</script>
