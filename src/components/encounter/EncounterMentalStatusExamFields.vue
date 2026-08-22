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
      v-for="item in mseFields"
      :key="item.key"
      class="encounter-ros__item">
      <div class="encounter-ros__row">
        <div class="encounter-ros__lead">
          <div class="encounter-ros__name">
            <FormFieldLabel
              :label="t(item.labelKey)"
              :required="Boolean(field?.required)"
            />
          </div>
          <div class="encounter-ros__control">
            <FormSelect
              :model-value="valueOf(item) || ''"
              :test-id="tid.narrativeMseValue(item.key)"
              outlined
              hide-bottom-space
              emit-value
              map-options
              class="full-width"
              :disable="!canEdit"
              :error="valueError(item)"
              :options="mseFieldOptions(item, t)"
              @update:model-value="value => onValueChange(item, value)"
            />
          </div>
        </div>
        <div
          v-if="mseNeedsDetails(valueOf(item))"
          class="encounter-ros__details">
          <q-input
            :model-value="detailsOf(item)"
            outlined
            :disable="!canEdit"
            :aria-label="t('mseDetails')"
            :data-testid="tid.narrativeMseDetails(item.key)"
            :placeholder="t('mseDetailsPlaceholder')"
            :hide-bottom-space="!detailsErrorMessage(item)"
            :error="detailsError(item)"
            :error-message="detailsErrorMessage(item)"
            maxlength="2000"
            @update:model-value="value => onDetailsChange(item, value)"
            @blur="onDetailsBlur(item)"
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
  mseAnsweredCount,
  mseFieldOptions,
  mseFields,
  mseNeedsDetails,
  parseMentalStatusExamValues,
  serializeMentalStatusExamValues,
} from 'src/utils/mental-status-exam.js'

const props = defineProps({
  field: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
  highlightMissing: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'flush'])
const { t } = useI18n()
const touchedDetails = ref({})
const values = ref(parseMentalStatusExamValues(props.field?.valueJson))

watch(
  () => props.field?.templateSectionId,
  () => {
    values.value = parseMentalStatusExamValues(props.field?.valueJson)
  },
)

const answeredCount = computed(() =>
  mseAnsweredCount(values.value),
)

function valueOf(item) {
  return values.value[item.key]?.value || null
}

function detailsOf(item) {
  return values.value[item.key]?.details || ''
}

function markDetailsTouched(key) {
  if (!key || touchedDetails.value[key]) {
    return
  }
  touchedDetails.value = { ...touchedDetails.value, [key]: true }
}

function detailsError(item) {
  if (!showMissing(item.key)) {
    return false
  }

  return mseNeedsDetails(valueOf(item))
    && !String(detailsOf(item)).trim()
}

function detailsErrorMessage(item) {
  if (props.highlightMissing || !detailsError(item)) {
    return ''
  }

  return t('mseDetailsRequired', {
    field: t(item.labelKey),
  })
}

function valueError(item) {
  return props.highlightMissing
    && Boolean(props.field?.required)
    && !valueOf(item)
}

function showMissing(key) {
  return props.highlightMissing || Boolean(touchedDetails.value[key])
}

function onDetailsBlur(item) {
  markDetailsTouched(item.key)
  emit('flush')
}

function commit(next) {
  values.value = next
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
  emit('flush')
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
