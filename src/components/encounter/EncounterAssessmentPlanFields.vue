<template>
  <div
    class="encounter-ros encounter-ap"
    :data-testid="tid.narrativeAp">
    <div
      v-if="!rows.length"
      class="text-body2 text-grey-7">
      <p class="q-mb-md">
        {{ t('apEmptyDiagnoses') }}
      </p>
      <q-btn
        v-if="canEdit"
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        :label="t('apGoToVisit')"
        :data-testid="tid.narrativeApGoToVisit"
        @click="emit('go-to-visit')"
      />
    </div>
    <template v-else>
      <p class="text-body2 text-grey-7 q-mb-sm">
        {{ t('apProgress', {
          completed: answeredCount,
          total: rows.length,
        }) }}
      </p>
      <div
        v-for="row in rows"
        :key="row.diagnosis.id || row.diagnosis.icd10Code"
        class="encounter-ros__item">
        <div class="encounter-ap__heading">
          <div class="text-body1 text-weight-medium">
            {{ diagnosisHeading(row.diagnosis) }}
          </div>
          <div
            v-if="row.diagnosis.isPrimary"
            class="text-body2 text-grey-7">
            {{ t('apPrimaryDiagnosis') }}
          </div>
        </div>
        <AddClientLabeledField
          :label="t('apPlan')"
          :required="Boolean(field?.required)">
          <template
            v-if="aiDraftEnabled"
            #label-append>
            <q-btn
              no-caps
              outline
              dense
              size="sm"
              class="app-btn-ai-outline"
              icon="auto_awesome"
              :label="t('aiBtnFiceAi')"
              :aria-label="t('aiAssistantName')"
              :data-testid="tid.narrativeApAiDraft(
                row.diagnosis.id,
              )"
              @click="openAiDraft(row)"
            />
          </template>
          <q-input
            :model-value="row.plan"
            type="textarea"
            autogrow
            outlined
            :disable="!canEdit"
            :data-testid="tid.narrativeApPlan(row.diagnosis.id)"
            :placeholder="t('apPlanPlaceholder')"
            :hide-bottom-space="!planErrorMessage(row)"
            :error="planError(row)"
            :error-message="planErrorMessage(row)"
            maxlength="4000"
            @update:model-value="value => onPlanChange(row, value)"
            @blur="onPlanBlur(row)"
          />
        </AddClientLabeledField>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  assessmentPlanAnsweredCount,
  diagnosisHeading,
  resolveAssessmentPlanRows,
  serializeAssessmentPlanValues,
} from 'src/utils/assessment-plan.js'

const props = defineProps({
  field: { type: Object, required: true },
  diagnoses: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false },
  highlightMissing: { type: Boolean, default: false },
  aiDraftEnabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update',
  'flush',
  'go-to-visit',
  'open-ai-draft',
])
const { t } = useI18n()
const touchedPlans = ref({})

const rows = computed(() => resolveAssessmentPlanRows(
  props.diagnoses,
  props.field?.valueJson,
))

const answeredCount = computed(() =>
  assessmentPlanAnsweredCount(rows.value),
)

function planKey(row) {
  return String(row.diagnosis?.id || row.diagnosis?.icd10Code || '')
}

function markPlanTouched(row) {
  const key = planKey(row)
  if (!key || touchedPlans.value[key]) {
    return
  }
  touchedPlans.value = { ...touchedPlans.value, [key]: true }
}

function planError(row) {
  if (!props.field?.required) {
    return false
  }
  if (!props.highlightMissing && !touchedPlans.value[planKey(row)]) {
    return false
  }

  return !String(row.plan || '').trim()
}

function planErrorMessage(row) {
  if (props.highlightMissing || !planError(row)) {
    return ''
  }

  return t('apPlanRequired', {
    description: row.diagnosis?.description || '',
    code: row.diagnosis?.icd10Code || '',
  })
}

function onPlanBlur(row) {
  markPlanTouched(row)
  emit('flush')
}

function onPlanChange(row, value) {
  const next = rows.value.map(item => {
    if (item.diagnosis !== row.diagnosis
      && item.diagnosis?.id !== row.diagnosis?.id) {
      return item
    }

    return { ...item, plan: value }
  })
  emit('update', serializeAssessmentPlanValues(next))
}

function openAiDraft(row) {
  emit('open-ai-draft', {
    diagnosis: row.diagnosis,
    plan: row.plan,
  })
}
</script>
