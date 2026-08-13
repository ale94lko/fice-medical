<template>
  <div class="ai-result-editor" :data-testid="aiTestIds.field('result')">
    <template v-if="isSummaryFeature">
      <FormField :label="t('aiResultSummary')" spaced>
        <q-input
          v-model="local.summary"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('summary')"
          @update:model-value="emitChange"
        />
      </FormField>
      <FormField :label="t('aiResultHighlights')" spaced>
        <q-input
          :model-value="listToText(local.highlights)"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('highlights')"
          @update:model-value="v => onListField('highlights', v)"
        />
      </FormField>
      <FormField :label="t('aiResultRisks')" spaced>
        <q-input
          :model-value="listToText(local.risks)"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('risks')"
          @update:model-value="v => onListField('risks', v)"
        />
      </FormField>
      <div
        v-if="showNotDocumentedWarning"
        class="ai-result-editor__warning q-mt-md"
        :data-testid="aiTestIds.notDocumentedWarning">
        <q-icon name="warning_amber" color="warning" size="sm" />
        <span>{{ t('aiNotDocumentedWarning') }}</span>
      </div>
      <FormField :label="t('aiResultAllergies')" spaced>
        <q-input
          :model-value="statusBlockText(local.allergies)"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('allergies')"
          @update:model-value="v => onStatusBlock('allergies', v)"
        />
      </FormField>
      <FormField
        v-if="hasMedications"
        :label="t('aiResultMedications')"
        spaced>
        <q-input
          :model-value="statusBlockText(local.medications)"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('medications')"
          @update:model-value="v => onStatusBlock('medications', v)"
        />
      </FormField>
    </template>

    <template v-else-if="feature === aiFeatures.soapDraft">
      <FormField :label="t('aiSoapSubjective')" spaced>
        <q-input
          v-model="local.subjective"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('subjective')"
          @update:model-value="emitChange"
        />
      </FormField>
      <FormField :label="t('aiSoapObjective')" spaced>
        <q-input
          v-model="local.objective"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('objective')"
          @update:model-value="emitChange"
        />
      </FormField>
      <FormField :label="t('aiSoapAssessment')" spaced>
        <q-input
          :model-value="listToText(local.assessment)"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('assessment')"
          @update:model-value="v => onListField('assessment', v)"
        />
      </FormField>
      <FormField :label="t('aiSoapPlan')" spaced>
        <q-input
          :model-value="listToText(local.plan)"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :data-testid="aiTestIds.field('plan')"
          @update:model-value="v => onListField('plan', v)"
        />
      </FormField>
      <div
        v-if="showNotDocumentedWarning"
        class="ai-result-editor__warning q-mt-md"
        :data-testid="aiTestIds.notDocumentedWarning">
        <q-icon name="warning_amber" color="warning" size="sm" />
        <span>{{ t('aiNotDocumentedWarning') }}</span>
      </div>
    </template>

    <template v-else-if="feature === aiFeatures.icd10Suggest">
      <p class="text-body2 text-grey-7 q-mb-md">
        {{ t('aiIcdNotDiagnosis') }}
      </p>
      <div
        v-for="item in icdItems"
        :key="item.path"
        class="ai-result-editor__icd-row q-mb-sm">
        <q-checkbox
          :model-value="selectedPaths.includes(item.path)"
          :disable="readonly"
          :data-testid="aiTestIds.field(`icd-${item.index}`)"
          @update:model-value="v => togglePath(item.path, v)"
        />
        <div class="ai-result-editor__icd-body col">
          <div class="row items-center q-gutter-sm">
            <strong>{{ item.suggestedCode || '—' }}</strong>
            <q-badge
              outline
              :color="confidenceColor(item.confidence)">
              {{ confidenceLabel(item.confidence) }}
            </q-badge>
          </div>
          <div class="text-body2">{{ item.description }}</div>
          <div
            v-if="item.rationale"
            class="text-caption text-grey-7">
            {{ item.rationale }}
          </div>
        </div>
      </div>
      <p
        v-if="!icdItems.length"
        class="text-body2 text-grey-7">
        {{ t('aiIcdEmpty') }}
      </p>
    </template>

    <template v-else-if="feature === aiFeatures.carePlanDraft">
      <p class="text-body2 text-grey-7 q-mb-sm">
        {{ t('aiCarePlanNotTreatment') }}
      </p>
      <FormField :label="t('aiResultJson')" spaced>
        <q-input
          :model-value="carePlanJson"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :error="Boolean(jsonError)"
          :error-message="jsonError"
          :data-testid="aiTestIds.field('care-plan-json')"
          @update:model-value="onCarePlanJson"
        />
      </FormField>
    </template>

    <template v-else>
      <FormField :label="t('aiResultJson')" spaced>
        <q-input
          :model-value="genericJson"
          type="textarea"
          outlined
          autogrow
          :readonly="readonly"
          :error="Boolean(jsonError)"
          :error-message="jsonError"
          :data-testid="aiTestIds.field('generic-json')"
          @update:model-value="onGenericJson"
        />
      </FormField>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FormField from 'components/FormField.vue'
import { aiFeatures } from 'components/constants.js'
import { aiTestIds } from 'src/test-ids/ai.js'
import {
  cloneAiResult,
  normalizeIcdSuggestions,
  suggestionHasNotDocumentedRisk,
} from 'src/utils/ai-normalize.js'

const props = defineProps({
  feature: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  selectedPaths: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'update:selectedPaths',
])

const { t } = useI18n()
const local = ref(cloneAiResult(props.modelValue))
const jsonError = ref('')
const carePlanJson = ref('')
const genericJson = ref('')

const isSummaryFeature = computed(() =>
  props.feature === aiFeatures.clinicalSummary,
)

const hasMedications = computed(() =>
  local.value?.medications != null,
)

const showNotDocumentedWarning = computed(() =>
  suggestionHasNotDocumentedRisk(local.value),
)

const icdItems = computed(() =>
  normalizeIcdSuggestions(local.value),
)

watch(
  () => props.modelValue,
  (next) => {
    local.value = cloneAiResult(next)
    carePlanJson.value = JSON.stringify(local.value, null, 2)
    genericJson.value = JSON.stringify(local.value, null, 2)
    jsonError.value = ''
  },
  { deep: true, immediate: true },
)

function emitChange() {
  emit('update:modelValue', cloneAiResult(local.value))
}

function listToText(value) {
  if (!Array.isArray(value)) {
    return String(value ?? '')
  }

  return value.map(item => String(item ?? '').trim()).filter(Boolean)
    .join('\n')
}

function textToList(value) {
  return String(value ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function onListField(key, value) {
  local.value[key] = textToList(value)
  emitChange()
}

function statusBlockText(block) {
  const status = block?.status || 'not_documented'
  const items = Array.isArray(block?.items)
    ? block.items.map(item => {
      if (typeof item === 'string') {
        return item
      }

      return item?.name ?? item?.description ?? JSON.stringify(item)
    })
    : []

  return [`status: ${status}`, ...items].join('\n')
}

function onStatusBlock(key, value) {
  const lines = textToList(value)
  let status = 'not_documented'
  const items = []
  lines.forEach((line) => {
    if (line.toLowerCase().startsWith('status:')) {
      status = line.slice(7).trim() || 'not_documented'
    } else {
      items.push(line)
    }
  })
  local.value[key] = { status, items }
  emitChange()
}

function confidenceColor(level) {
  if (level === 'high') {
    return 'positive'
  }
  if (level === 'low') {
    return 'warning'
  }

  return 'primary'
}

function confidenceLabel(level) {
  if (level === 'high') {
    return t('aiConfidenceHigh')
  }
  if (level === 'low') {
    return t('aiConfidenceLow')
  }

  return t('aiConfidenceMedium')
}

function togglePath(path, checked) {
  const set = new Set(props.selectedPaths)
  if (checked) {
    set.add(path)
  } else {
    set.delete(path)
  }
  emit('update:selectedPaths', [...set])
}

function onCarePlanJson(value) {
  carePlanJson.value = value
  try {
    const parsed = JSON.parse(value)
    if (parsed == null || typeof parsed !== 'object') {
      jsonError.value = t('aiJsonInvalid')

      return
    }
    jsonError.value = ''
    local.value = parsed
    emitChange()
  } catch {
    jsonError.value = t('aiJsonInvalid')
  }
}

function onGenericJson(value) {
  genericJson.value = value
  try {
    const parsed = JSON.parse(value)
    if (parsed == null || typeof parsed !== 'object') {
      jsonError.value = t('aiJsonInvalid')

      return
    }
    jsonError.value = ''
    local.value = parsed
    emitChange()
  } catch {
    jsonError.value = t('aiJsonInvalid')
  }
}
</script>

<style scoped lang="scss">
.ai-result-editor__warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--q-warning);
  font-size: 0.875rem;
}

.ai-result-editor__icd-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--q-border-subtle, #e0e0e0);
  border-radius: 8px;
}

.ai-result-editor__icd-body {
  min-width: 0;
}
</style>
