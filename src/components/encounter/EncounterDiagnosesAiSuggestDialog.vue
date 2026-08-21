<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="family-medical-history-dialog insurance-dialog
        app-dialog-card encounter-diagnoses-ai-dialog">
      <AppDialogHeader
        test-id="encounter-diagnoses-ai"
        :close-label="t('close')"
        @close="onCancel">
        {{ t('encounterDiagnosesAiDialogTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div
          class="encounter-diagnoses-ai-dialog__framing q-mb-md">
          <q-icon name="psychology" size="sm" color="primary" />
          <div>
            <div class="text-weight-medium">
              {{ t('aiSuggestionFraming') }}
            </div>
            <div class="text-caption text-grey-7">
              {{ t('aiSuggestionFramingHint') }}
            </div>
          </div>
        </div>

        <template v-if="generating">
          <div
            class="column items-center q-py-xl
              encounter-diagnoses-ai-dialog__loading">
            <q-spinner color="primary" size="42px" />
            <p class="text-body1 q-mt-md q-mb-none">
              {{ t('aiGenerating') }}
            </p>
            <p class="text-caption text-grey-7 q-mt-sm q-mb-none">
              {{ t('aiGeneratingHint') }}
            </p>
          </div>
        </template>

        <template v-else>
          <div class="form-field">
            <div
              class="
                encounter-diagnoses-ai-dialog__clinical-head
                row items-center justify-between no-wrap
              "
            >
              <FormFieldLabel
                :label="clinicalTextLabel"
              />
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                class="q-px-sm"
                icon="content_copy"
                :disable="!canCopyChiefComplaint"
                :label="resolvedCopySourceLabel"
                :data-testid="tid.diagnosesAiCopyChiefComplaint"
                @click="copyFromChiefComplaint"
              />
            </div>
            <div class="form-field__control">
              <q-input
                v-model="clinicalText"
                type="textarea"
                outlined
                :rows="4"
                hide-bottom-space
                :error="Boolean(clinicalTextError)"
                :error-message="clinicalTextError"
                :placeholder="
                  t('encounterDiagnosesAiClinicalTextPlaceholder')"
                :data-testid="tid.diagnosesAiClinicalText"
                @update:model-value="onClinicalTextInput"
              />
            </div>
          </div>

          <div
            v-if="suggestions.length"
            class="encounter-diagnoses-ai-dialog__results q-mt-lg">
            <div
              class="row items-center justify-between q-mb-sm">
              <p class="text-body2 text-weight-medium q-mb-none">
                {{ t('encounterDiagnosesAiSuggestions') }}
              </p>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                class="q-px-sm"
                :label="allSelectableSelected
                  ? t('encounterDiagnosesAiDeselectAll')
                  : t('encounterDiagnosesAiSelectAll')"
                :disable="!selectableSuggestions.length"
                :data-testid="tid.diagnosesAiSelectAll"
                @click="toggleSelectAll"
              />
            </div>

            <div class="encounter-diagnoses-ai-dialog__list">
              <label
                v-for="item in suggestions"
                :key="item.path"
                class="encounter-diagnoses-ai-dialog__row"
                :class="{
                  'encounter-diagnoses-ai-dialog__row--disabled':
                    isAlreadyAdded(item.suggestedCode),
                  'encounter-diagnoses-ai-dialog__row--selected':
                    selectedPaths.includes(item.path)
                    && !isAlreadyAdded(item.suggestedCode),
                }">
                <q-checkbox
                  v-model="selectedPaths"
                  :val="item.path"
                  :disable="isAlreadyAdded(item.suggestedCode)"
                  dense
                  class="q-mr-sm"
                />
                <div class="encounter-diagnoses-ai-dialog__body">
                  <div class="row items-center q-gutter-sm no-wrap">
                    <span
                      class="encounter-diagnoses-ai-dialog__code">
                      {{ item.suggestedCode || '—' }}
                    </span>
                    <q-badge
                      v-if="isAlreadyAdded(item.suggestedCode)"
                      color="grey"
                      outline>
                      {{ t('encounterDiagnosisAlreadyAdded') }}
                    </q-badge>
                  </div>
                  <div
                    v-if="item.description"
                    class="text-body2 q-mt-xs">
                    {{ item.description }}
                  </div>
                  <div
                    v-if="item.rationale"
                    class="text-caption text-grey-7 q-mt-xs">
                    {{ item.rationale }}
                  </div>
                </div>
              </label>
            </div>

            <p
              v-if="hasOnlyDuplicates"
              class="text-body2 text-warning q-mt-sm q-mb-none">
              {{ t('encounterDiagnosesAiAllDuplicates') }}
            </p>
            <p
              v-else
              class="text-caption text-grey-7 q-mt-sm q-mb-none">
              {{ t('encounterDiagnosesAiSelectedCount', {
                count: selectedItems.length,
              }) }}
            </p>
          </div>

          <p
            v-else-if="generatedOnce"
            class="text-body2 text-grey-7 q-mt-md q-mb-none">
            {{ t('aiIcdEmpty') }}
          </p>
        </template>
      </q-card-section>

      <q-card-actions
        v-if="!generating"
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="tid.diagnosesAiCancel"
          @click="onCancel"
        />
        <q-btn
          v-if="showRegenerate"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="auto_awesome"
          :label="t('encounterDiagnosesAiRegenerate')"
          :data-testid="tid.diagnosesAiRegenerate"
          @click="onGenerate"
        />
        <q-btn
          v-if="!suggestions.length"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="auto_awesome"
          :label="t('encounterDiagnosesAiGenerate')"
          :data-testid="tid.diagnosesAiGenerate"
          @click="onGenerate"
        />
        <q-btn
          v-else
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="!selectedItems.length"
          :label="t('encounterDiagnosesAiInsert')"
          :data-testid="tid.diagnosesAiApply"
          @click="onInsert"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormFieldLabel from 'components/FormFieldLabel.vue'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { formatRequiredFieldLabel } from 'src/utils/base.js'
import {
  aiApiErrorMessage,
  generateIcd10Suggest,
  generateIcd10SuggestForClient,
  generateIcd10SuggestFromText,
} from 'src/utils/ai-api.js'
import { normalizeIcdSuggestions } from 'src/utils/ai-normalize.js'
import { normalizeIcd10CodeKey } from 'src/utils/icd10-api.js'
import {
  resolveEncounterChiefComplaint,
} from 'src/utils/encounter-completion-chief-complaint.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  encounterId: {
    type: [Number, String],
    default: null,
  },
  chiefComplaint: {
    type: String,
    default: '',
  },
  existingCodes: {
    type: Array,
    default: () => [],
  },
  clientId: {
    type: [Number, String],
    default: null,
  },
  copySourceLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'insert'])
const { t } = useI18n()
const $q = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const clinicalText = ref('')
const clinicalTextError = ref('')
const generating = ref(false)
const generatedOnce = ref(false)
const suggestions = ref([])
const selectedPaths = ref([])

const chiefComplaintText = computed(() =>
  resolveEncounterChiefComplaint({
    chiefComplaint: props.chiefComplaint,
  }),
)

const canCopyChiefComplaint = computed(
  () => chiefComplaintText.value.length > 0,
)

const resolvedCopySourceLabel = computed(() =>
  props.copySourceLabel || t('encounterDiagnosesAiCopyChiefComplaint'),
)

const hasClientId = computed(() =>
  String(props.clientId ?? '').trim().length > 0,
)

const clinicalTextLabel = computed(() =>
  formatRequiredFieldLabel(t('encounterDiagnosesAiClinicalText')),
)

const existingCodeSet = computed(() => new Set(
  (props.existingCodes ?? [])
    .map(code => normalizeIcd10CodeKey(code))
    .filter(Boolean),
))

const selectableSuggestions = computed(() =>
  suggestions.value.filter(
    item => !isAlreadyAdded(item.suggestedCode),
  ),
)

const selectedItems = computed(() =>
  suggestions.value.filter(item =>
    selectedPaths.value.includes(item.path)
    && !isAlreadyAdded(item.suggestedCode),
  ),
)

const allSelectableSelected = computed(() => {
  const selectable = selectableSuggestions.value
  if (!selectable.length) {
    return false
  }

  return selectable.every(item =>
    selectedPaths.value.includes(item.path),
  )
})

const showRegenerate = computed(
  () => generatedOnce.value || suggestions.value.length > 0,
)

const hasOnlyDuplicates = computed(
  () => suggestions.value.length > 0
    && selectableSuggestions.value.length === 0,
)

watch(() => props.modelValue, (visible) => {
  if (!visible) {
    return
  }
  clinicalText.value = ''
  clinicalTextError.value = ''
  suggestions.value = []
  selectedPaths.value = []
  generatedOnce.value = false
  generating.value = false
})

watch(existingCodeSet, () => {
  selectedPaths.value = selectedPaths.value.filter((path) => {
    const item = suggestions.value.find(row => row.path === path)

    return item != null && !isAlreadyAdded(item.suggestedCode)
  })
})

function onClinicalTextInput() {
  if (clinicalTextError.value
    && String(clinicalText.value ?? '').trim()) {
    clinicalTextError.value = ''
  }
}

function copyFromChiefComplaint() {
  if (!canCopyChiefComplaint.value) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('encounterDiagnosesAiNoChiefComplaint'),
      position: 'top',
    })

    return
  }
  clinicalText.value = chiefComplaintText.value
  clinicalTextError.value = ''
}

function isAlreadyAdded(code) {
  const normalized = normalizeIcd10CodeKey(code)
  if (!normalized) {
    return false
  }

  return existingCodeSet.value.has(normalized)
}

function toggleSelectAll() {
  if (allSelectableSelected.value) {
    selectedPaths.value = []

    return
  }
  selectedPaths.value = selectableSuggestions.value.map(
    item => item.path,
  )
}

async function requestIcd10Suggestion(text) {
  const body = {
    clinicalText: text,
    limit: 8,
    existingCodes: props.existingCodes,
  }
  if (props.encounterId != null) {
    return generateIcd10Suggest(props.encounterId, {
      clinicalText: text,
      limit: 8,
    })
  }
  if (hasClientId.value) {
    return generateIcd10SuggestForClient(props.clientId, body)
  }

  return generateIcd10SuggestFromText(body)
}

async function onGenerate() {
  const text = String(clinicalText.value ?? '').trim()
  if (!text) {
    clinicalTextError.value = t(
      'encounterDiagnosesAiClinicalTextRequired',
    )

    return
  }
  clinicalTextError.value = ''
  generating.value = true
  try {
    const suggestion = await requestIcd10Suggestion(text)
    suggestions.value = normalizeIcdSuggestions(
      suggestion?.result ?? suggestion,
    )
    selectedPaths.value = suggestions.value
      .filter(item => !isAlreadyAdded(item.suggestedCode))
      .map(item => item.path)
    generatedOnce.value = true
    if (!suggestions.value.length) {
      $q.notify({
        type: quasarNotifyTypes.info,
        message: t('aiIcdEmpty'),
      })
    }
  } catch (error) {
    suggestions.value = []
    selectedPaths.value = []
    generatedOnce.value = true
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(
          error,
          t('encounterDiagnosesAiError'),
        ),
      })
    }
  } finally {
    generating.value = false
  }
}

function onCancel() {
  open.value = false
}

function onInsert() {
  const toInsert = selectedItems.value
    .map(item => ({
      icd10Code: String(item.suggestedCode ?? '').trim(),
      codeDotted: String(item.suggestedCode ?? '').trim(),
      description: String(item.description ?? '').trim(),
    }))
    .filter(item => item.icd10Code && !isAlreadyAdded(item.icd10Code))

  if (!toInsert.length) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('encounterDiagnosesAiAllDuplicates'),
    })

    return
  }
  emit('insert', toInsert)
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.encounter-diagnoses-ai-dialog__framing {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba($primary, 0.08);
  border: 1px solid rgba($primary, 0.2);
}

.encounter-diagnoses-ai-dialog__clinical-head {
  gap: 8px;
  margin-bottom: 6px;

  :deep(.form-field__label) {
    margin-bottom: 0;
  }
}

.encounter-diagnoses-ai-dialog__list {
  max-height: 280px;
  overflow: auto;
  border: 1px solid $border-subtle;
  border-radius: 10px;
  background: #fff;
}

.encounter-diagnoses-ai-dialog__row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid $border-subtle;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(.encounter-diagnoses-ai-dialog__row--disabled) {
    background: rgba($primary, 0.04);
  }

  &--selected {
    background: rgba($primary, 0.07);
  }

  &--disabled {
    cursor: default;
    opacity: 0.72;
  }
}

.encounter-diagnoses-ai-dialog__body {
  min-width: 0;
  flex: 1 1 auto;
}

.encounter-diagnoses-ai-dialog__code {
  font-weight: 700;
  font-size: 0.875rem;
  color: $text-strong;
  font-variant-numeric: tabular-nums;
}
</style>
