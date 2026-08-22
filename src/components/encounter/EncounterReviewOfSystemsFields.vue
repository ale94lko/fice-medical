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
      v-for="system in reviewOfSystems"
      :key="system.key"
      class="encounter-ros__item">
      <div class="encounter-ros__row">
        <div class="encounter-ros__lead">
          <div class="encounter-ros__name">
            <FormFieldLabel
              :label="t(system.labelKey)"
              :required="Boolean(field?.required)"
            />
          </div>
          <div class="encounter-ros__control">
            <FormSelect
              :model-value="statusOf(system) || ''"
              :test-id="tid.narrativeRosStatus(system.key)"
              outlined
              hide-bottom-space
              emit-value
              map-options
              class="full-width"
              :disable="!canEdit"
              :error="statusError(system)"
              :options="statusOptions"
              @update:model-value="value => onStatusChange(system, value)"
            />
          </div>
        </div>
        <div
          v-if="reviewOfSystemsNeedsDetails(statusOf(system))"
          class="encounter-ros__details">
          <q-input
            :model-value="detailsOf(system)"
            outlined
            :disable="!canEdit"
            :aria-label="t('rosDetails')"
            :data-testid="tid.narrativeRosDetails(system.key)"
            :placeholder="t('rosDetailsPlaceholder')"
            :hide-bottom-space="!detailsErrorMessage(system)"
            :error="detailsError(system)"
            :error-message="detailsErrorMessage(system)"
            maxlength="2000"
            @update:model-value="value => onDetailsChange(system, value)"
            @blur="onDetailsBlur(system)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FormFieldLabel from 'components/FormFieldLabel.vue'
import FormSelect from 'components/FormSelect.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  parseReviewOfSystemsValues,
  reviewOfSystems,
  reviewOfSystemsAnsweredCount,
  reviewOfSystemsNeedsDetails,
  reviewOfSystemsStatuses,
  serializeReviewOfSystemsValues,
} from 'src/utils/review-of-systems.js'

const props = defineProps({
  field: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
  highlightMissing: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'flush'])
const { t } = useI18n()
const touchedDetails = ref({})
const values = ref(parseReviewOfSystemsValues(props.field?.valueJson))

watch(
  () => props.field?.templateSectionId,
  () => {
    values.value = parseReviewOfSystemsValues(props.field?.valueJson)
  },
)

const answeredCount = computed(() =>
  reviewOfSystemsAnsweredCount(values.value),
)

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

function markDetailsTouched(key) {
  if (!key || touchedDetails.value[key]) {
    return
  }
  touchedDetails.value = { ...touchedDetails.value, [key]: true }
}

function detailsError(system) {
  if (!showMissing(system.key)) {
    return false
  }

  return reviewOfSystemsNeedsDetails(statusOf(system))
    && !String(detailsOf(system)).trim()
}

function detailsErrorMessage(system) {
  if (props.highlightMissing || !detailsError(system)) {
    return ''
  }

  return t('rosDetailsRequired', {
    system: t(system.labelKey),
  })
}

function statusError(system) {
  return props.highlightMissing
    && Boolean(props.field?.required)
    && !statusOf(system)
}

function showMissing(key) {
  return props.highlightMissing || Boolean(touchedDetails.value[key])
}

function onDetailsBlur(system) {
  markDetailsTouched(system.key)
  emit('flush')
}

function commit(next) {
  values.value = next
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
  emit('flush')
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
