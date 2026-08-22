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
      v-for="area in physicalExamAreas"
      :key="area.key"
      class="encounter-ros__item">
      <div class="encounter-ros__row">
        <div class="encounter-ros__lead">
          <div class="encounter-ros__name">
            <FormFieldLabel
              :label="t(area.labelKey)"
              :required="Boolean(field?.required)"
            />
          </div>
          <div class="encounter-ros__control">
            <FormSelect
              :model-value="statusOf(area) || ''"
              :test-id="tid.narrativePeStatus(area.key)"
              outlined
              hide-bottom-space
              emit-value
              map-options
              class="full-width"
              :disable="!canEdit"
              :error="statusError(area)"
              :options="physicalExamStatusOptions(area, t)"
              @update:model-value="value => onStatusChange(area, value)"
            />
          </div>
        </div>
        <div
          v-if="physicalExamNeedsFindings(statusOf(area))"
          class="encounter-ros__details">
          <q-input
            :model-value="findingsOf(area)"
            outlined
            :disable="!canEdit"
            :aria-label="t('peFindings')"
            :data-testid="tid.narrativePeFindings(area.key)"
            :placeholder="t('peFindingsPlaceholder')"
            :hide-bottom-space="!findingsErrorMessage(area)"
            :error="findingsError(area)"
            :error-message="findingsErrorMessage(area)"
            maxlength="2000"
            @update:model-value="value => onFindingsChange(area, value)"
            @blur="onFindingsBlur(area)"
          />
        </div>
        <div
          v-else-if="physicalExamNeedsReason(statusOf(area), area)"
          class="encounter-ros__details">
          <q-input
            :model-value="reasonOf(area)"
            outlined
            hide-bottom-space
            :disable="!canEdit"
            :aria-label="t('peReason')"
            :data-testid="tid.narrativePeReason(area.key)"
            :placeholder="t('peReasonPlaceholder')"
            maxlength="2000"
            @update:model-value="value => onReasonChange(area, value)"
            @blur="emit('flush')"
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
  parsePhysicalExamValues,
  physicalExamAnsweredCount,
  physicalExamAreas,
  physicalExamNeedsFindings,
  physicalExamNeedsReason,
  physicalExamStatusOptions,
  serializePhysicalExamValues,
} from 'src/utils/physical-exam.js'

const props = defineProps({
  field: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
  highlightMissing: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'flush'])
const { t } = useI18n()
const touchedFindings = ref({})
const values = ref(parsePhysicalExamValues(props.field?.valueJson))

watch(
  () => props.field?.templateSectionId,
  () => {
    values.value = parsePhysicalExamValues(props.field?.valueJson)
  },
)

const answeredCount = computed(() =>
  physicalExamAnsweredCount(values.value),
)

function statusOf(area) {
  return values.value[area.key]?.status || null
}

function findingsOf(area) {
  return values.value[area.key]?.findings || ''
}

function reasonOf(area) {
  return values.value[area.key]?.reason || ''
}

function markFindingsTouched(key) {
  if (!key || touchedFindings.value[key]) {
    return
  }
  touchedFindings.value = { ...touchedFindings.value, [key]: true }
}

function findingsError(area) {
  if (!showMissing(area.key)) {
    return false
  }

  return physicalExamNeedsFindings(statusOf(area))
    && !String(findingsOf(area)).trim()
}

function findingsErrorMessage(area) {
  if (props.highlightMissing || !findingsError(area)) {
    return ''
  }

  return t('peFindingsRequired', {
    area: t(area.labelKey),
  })
}

function statusError(area) {
  return props.highlightMissing
    && Boolean(props.field?.required)
    && !statusOf(area)
}

function showMissing(key) {
  return props.highlightMissing || Boolean(touchedFindings.value[key])
}

function onFindingsBlur(area) {
  markFindingsTouched(area.key)
  emit('flush')
}

function commit(next) {
  values.value = next
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
  emit('flush')
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
