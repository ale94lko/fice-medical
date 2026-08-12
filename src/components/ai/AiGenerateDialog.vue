<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="aiTestIds.generateDialog"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card ai-generate-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('aiSuggestionFraming') }}
        </p>

        <template v-if="step === 'options'">
          <div class="row q-col-gutter-md">
            <template v-if="feature === aiFeatures.documentSummary">
              <div class="col-12 col-md-6">
                <FormField :label="t('aiDocScope')" required>
                  <FormSelect
                    v-model="form.scope"
                    outlined
                    emit-value
                    map-options
                    :options="documentScopeOptions"
                    :test-id="aiTestIds.field('doc-scope')"
                  />
                </FormField>
              </div>
              <div
                v-if="form.scope === aiDocumentSummaryScopes.singleDocument"
                class="col-12 col-md-6">
                <FormField :label="t('aiDocumentId')" required>
                  <FormSelect
                    v-model="form.documentId"
                    outlined
                    emit-value
                    map-options
                    clearable
                    :options="documentOptions"
                    :placeholder="t('aiDocumentIdPlaceholder')"
                    :test-id="aiTestIds.field('document-id')"
                  />
                </FormField>
              </div>
              <div
                v-if="form.scope === aiDocumentSummaryScopes.custom"
                class="col-12">
                <FormField :label="t('aiCustomHint')">
                  <q-input
                    v-model="form.customHint"
                    type="textarea"
                    outlined
                    autogrow
                    :data-testid="aiTestIds.field('custom-hint')"
                  />
                </FormField>
              </div>
            </template>

            <template v-else-if="feature === aiFeatures.clinicalSummary">
              <div class="col-12 col-md-6">
                <FormField :label="t('aiClinicalScope')" required>
                  <FormSelect
                    v-model="form.scope"
                    outlined
                    emit-value
                    map-options
                    :options="clinicalScopeOptions"
                    :test-id="aiTestIds.field('clinical-scope')"
                  />
                </FormField>
              </div>
              <div
                v-if="needsEncounter"
                class="col-12 col-md-6">
                <FormField :label="t('aiEncounter')" required>
                  <FormSelect
                    v-model="form.encounterId"
                    outlined
                    emit-value
                    map-options
                    :options="encounterOptions"
                    :loading="encountersLoading"
                    :placeholder="t('aiEncounterPlaceholder')"
                    :test-id="aiTestIds.field('encounter-id')"
                  />
                </FormField>
              </div>
              <div
                v-if="form.scope
                  === aiClinicalSummaryScopes.recentHistory"
                class="col-12 col-md-6">
                <FormField :label="t('aiHistoryDays')">
                  <q-input
                    v-model.number="form.historyDays"
                    type="number"
                    outlined
                    min="1"
                    :data-testid="aiTestIds.field('history-days')"
                  />
                </FormField>
              </div>
            </template>

            <template v-else-if="needsEncounterOnly">
              <div class="col-12 col-md-6">
                <FormField :label="t('aiEncounter')" required>
                  <FormSelect
                    v-model="form.encounterId"
                    outlined
                    emit-value
                    map-options
                    :options="encounterOptions"
                    :loading="encountersLoading"
                    :placeholder="t('aiEncounterPlaceholder')"
                    :test-id="aiTestIds.field('encounter-id')"
                  />
                </FormField>
              </div>
              <div
                v-if="feature === aiFeatures.icd10Suggest"
                class="col-12">
                <FormField :label="t('aiClinicalText')">
                  <q-input
                    v-model="form.clinicalText"
                    type="textarea"
                    outlined
                    autogrow
                    :placeholder="t('aiClinicalTextPlaceholder')"
                    :data-testid="aiTestIds.field('clinical-text')"
                  />
                </FormField>
              </div>
            </template>

            <template v-else-if="feature === aiFeatures.carePlanDraft">
              <div class="col-12 col-md-6">
                <FormField :label="t('aiCarePlanMode')" required>
                  <FormSelect
                    v-model="form.mode"
                    outlined
                    emit-value
                    map-options
                    :options="carePlanModeOptions"
                    :test-id="aiTestIds.field('care-plan-mode')"
                  />
                </FormField>
              </div>
              <div
                v-if="form.mode === aiCarePlanModes.extendActive"
                class="col-12 col-md-6">
                <FormField :label="t('aiTargetCarePlan')" required>
                  <FormSelect
                    v-model="form.targetCarePlanId"
                    outlined
                    emit-value
                    map-options
                    :options="carePlanOptions"
                    :placeholder="t('aiTargetCarePlanPlaceholder')"
                    :test-id="aiTestIds.field('target-care-plan')"
                  />
                </FormField>
              </div>
              <div class="col-12 col-md-6">
                <FormField :label="t('aiProblemMode')" required>
                  <FormSelect
                    v-model="form.problemMode"
                    outlined
                    emit-value
                    map-options
                    :options="problemModeOptions"
                    :test-id="aiTestIds.field('problem-mode')"
                  />
                </FormField>
              </div>
              <div class="col-12 col-md-6">
                <FormField :label="t('aiEncounter')">
                  <FormSelect
                    v-model="form.encounterId"
                    outlined
                    emit-value
                    map-options
                    clearable
                    :options="encounterOptions"
                    :loading="encountersLoading"
                    :placeholder="t('aiEncounterOptionalPlaceholder')"
                    :test-id="aiTestIds.field('encounter-id')"
                  />
                </FormField>
              </div>
              <div class="col-12">
                <FormField :label="t('aiFocusProblems')">
                  <q-input
                    v-model="form.focusProblemsText"
                    outlined
                    :placeholder="t('aiFocusProblemsPlaceholder')"
                    :data-testid="aiTestIds.field('focus-problems')"
                  />
                </FormField>
              </div>
            </template>
          </div>

          <p
            v-if="optionsError"
            class="text-negative text-body2 q-mt-md q-mb-none">
            {{ optionsError }}
          </p>
        </template>

        <template v-else-if="step === 'generating'">
          <div class="column items-center q-py-xl">
            <q-spinner color="primary" size="42px" />
            <p class="text-body1 q-mt-md q-mb-none">
              {{ t('aiGenerating') }}
            </p>
            <p class="text-caption text-grey-7 q-mt-sm">
              {{ t('aiGeneratingHint') }}
            </p>
          </div>
        </template>

        <AiSuggestionReviewPanel
          v-else-if="step === 'review' && suggestion"
          :suggestion="suggestion"
          :can-edit="canReview"
          :can-act="canReview"
          :saving="actionSaving"
          @save-edits="onSaveEdits"
          @accept="onAccept"
          @reject="onReject"
        />
      </q-card-section>

      <q-card-actions
        v-if="step === 'options'"
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          :data-testid="aiTestIds.btnClose"
          @click="onClose"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="auto_awesome"
          :disable="!canGenerate"
          :data-testid="aiTestIds.btnGenerate"
          :label="t('aiGenerate')"
          @click="onGenerate"
        />
      </q-card-actions>

      <q-card-actions
        v-else-if="step === 'review'"
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('close')"
          :data-testid="aiTestIds.btnClose"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import AiSuggestionReviewPanel from
  'components/ai/AiSuggestionReviewPanel.vue'
import {
  aiCarePlanModes,
  aiCarePlanProblemModes,
  aiClinicalSummaryScopes,
  aiDocumentSummaryScopes,
  aiFeatures,
  quasarNotifyTypes,
} from 'components/constants.js'
import { useAiPermissions } from 'src/composables/useAiPermissions.js'
import { aiTestIds } from 'src/test-ids/ai.js'
import {
  acceptAiSuggestion,
  aiApiErrorMessage,
  generateCarePlanDraft,
  generateClinicalSummary,
  generateDocumentSummary,
  generateIcd10Suggest,
  generateSoapDraft,
  patchAiSuggestion,
  rejectAiSuggestion,
} from 'src/utils/ai-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  getCachedActiveEncounterId,
  listClientEncounters,
} from 'src/utils/encounter-api.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  feature: {
    type: String,
    required: true,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  encounterId: {
    type: [String, Number],
    default: null,
  },
  documentId: {
    type: [String, Number],
    default: null,
  },
  documentOptions: {
    type: Array,
    default: () => [],
  },
  carePlanOptions: {
    type: Array,
    default: () => [],
  },
  initialSuggestion: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'committed', 'accepted'])

const { t } = useI18n()
const $q = useQuasar()
const {
  canUseDocumentSummary,
  canUseClinicalSummary,
  canUseScribe,
  canUseCodingAssistant,
  canUseCarePlanDraft,
  canReviewFeature,
} = useAiPermissions()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const step = ref('options')
const suggestion = ref(null)
const actionSaving = ref(false)
const optionsError = ref('')
const encountersLoading = ref(false)
const encounterOptions = ref([])

const form = reactive({
  scope: aiDocumentSummaryScopes.documentPackage,
  documentId: null,
  customHint: '',
  encounterId: null,
  historyDays: 90,
  clinicalText: '',
  mode: aiCarePlanModes.new,
  targetCarePlanId: null,
  problemMode: aiCarePlanProblemModes.single,
  focusProblemsText: '',
})

const documentScopeOptions = computed(() => [
  {
    label: t('aiDocScopePackage'),
    value: aiDocumentSummaryScopes.documentPackage,
  },
  {
    label: t('aiDocScopeSingle'),
    value: aiDocumentSummaryScopes.singleDocument,
  },
  {
    label: t('aiDocScopeCustom'),
    value: aiDocumentSummaryScopes.custom,
  },
])

const clinicalScopeOptions = computed(() => [
  {
    label: t('aiClinicalScopeFaceSheet'),
    value: aiClinicalSummaryScopes.faceSheetLite,
  },
  {
    label: t('aiClinicalScopeEncounter'),
    value: aiClinicalSummaryScopes.currentEncounter,
  },
  {
    label: t('aiClinicalScopeHistory'),
    value: aiClinicalSummaryScopes.recentHistory,
  },
])

const carePlanModeOptions = computed(() => [
  { label: t('aiCarePlanModeNew'), value: aiCarePlanModes.new },
  {
    label: t('aiCarePlanModeExtend'),
    value: aiCarePlanModes.extendActive,
  },
])

const problemModeOptions = computed(() => [
  {
    label: t('aiProblemModeSingle'),
    value: aiCarePlanProblemModes.single,
  },
  {
    label: t('aiProblemModeMulti'),
    value: aiCarePlanProblemModes.multi,
  },
])

const needsEncounterOnly = computed(() =>
  props.feature === aiFeatures.soapDraft
  || props.feature === aiFeatures.icd10Suggest,
)

const needsEncounter = computed(() =>
  form.scope === aiClinicalSummaryScopes.currentEncounter
  || needsEncounterOnly.value,
)

const featurePermission = computed(() => {
  if (props.feature === aiFeatures.documentSummary) {
    return canUseDocumentSummary.value
  }
  if (props.feature === aiFeatures.clinicalSummary) {
    return canUseClinicalSummary.value
  }
  if (props.feature === aiFeatures.soapDraft) {
    return canUseScribe.value
  }
  if (props.feature === aiFeatures.icd10Suggest) {
    return canUseCodingAssistant.value
  }
  if (props.feature === aiFeatures.carePlanDraft) {
    return canUseCarePlanDraft.value
  }

  return false
})

const canGenerate = computed(() => featurePermission.value)

const canReview = computed(() =>
  canReviewFeature(featurePermission.value),
)

const dialogTitle = computed(() => {
  const map = {
    [aiFeatures.documentSummary]: 'aiGenerateDocumentSummary',
    [aiFeatures.clinicalSummary]: 'aiGenerateClinicalSummary',
    [aiFeatures.soapDraft]: 'aiGenerateSoapDraft',
    [aiFeatures.icd10Suggest]: 'aiGenerateIcd10',
    [aiFeatures.carePlanDraft]: 'aiGenerateCarePlan',
  }

  return t(map[props.feature] || 'aiSuggestionFraming')
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return
    }
    if (props.initialSuggestion) {
      suggestion.value = props.initialSuggestion
      step.value = 'review'
      optionsError.value = ''
      actionSaving.value = false

      return
    }
    resetState()
    void loadEncountersIfNeeded()
  },
)

function resetState() {
  step.value = 'options'
  suggestion.value = null
  optionsError.value = ''
  actionSaving.value = false
  form.documentId = props.documentId ?? null
  form.customHint = ''
  form.clinicalText = ''
  form.historyDays = 90
  form.mode = aiCarePlanModes.new
  form.targetCarePlanId = null
  form.problemMode = aiCarePlanProblemModes.single
  form.focusProblemsText = ''
  if (props.feature === aiFeatures.documentSummary) {
    form.scope = aiDocumentSummaryScopes.documentPackage
  } else if (props.feature === aiFeatures.clinicalSummary) {
    form.scope = aiClinicalSummaryScopes.faceSheetLite
  }
  form.encounterId = props.encounterId
    ?? getCachedActiveEncounterId(props.clientId)
    ?? null
}

async function loadEncountersIfNeeded() {
  const needsList = props.feature === aiFeatures.clinicalSummary
    || props.feature === aiFeatures.soapDraft
    || props.feature === aiFeatures.icd10Suggest
    || props.feature === aiFeatures.carePlanDraft
  if (!needsList || !props.clientId) {
    return
  }
  encountersLoading.value = true
  try {
    const list = await listClientEncounters(props.clientId)
    encounterOptions.value = (list || []).map(row => ({
      label: formatEncounterLabel(row),
      value: row.id,
    }))
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      encounterOptions.value = []
    }
  } finally {
    encountersLoading.value = false
  }
}

function formatEncounterLabel(row) {
  const id = row?.id ?? '—'
  const type = row?.encounterType || row?.type || ''
  const status = row?.status || ''
  const date = row?.startedAt || row?.createdAt || ''
  const dateLabel = date
    ? new Date(date).toLocaleString()
    : ''

  return [id, type, status, dateLabel].filter(Boolean).join(' · ')
}

function validateOptions() {
  optionsError.value = ''
  if (props.feature === aiFeatures.documentSummary
    && form.scope === aiDocumentSummaryScopes.singleDocument
    && form.documentId == null) {
    optionsError.value = t('aiDocumentIdRequired')

    return false
  }
  if ((props.feature === aiFeatures.soapDraft
    || props.feature === aiFeatures.icd10Suggest)
    && form.encounterId == null) {
    optionsError.value = t('aiEncounterRequired')

    return false
  }
  if (props.feature === aiFeatures.clinicalSummary
    && form.scope === aiClinicalSummaryScopes.currentEncounter
    && form.encounterId == null) {
    optionsError.value = t('aiEncounterRequired')

    return false
  }
  if (props.feature === aiFeatures.carePlanDraft
    && form.mode === aiCarePlanModes.extendActive
    && form.targetCarePlanId == null) {
    optionsError.value = t('aiTargetCarePlanRequired')

    return false
  }

  return true
}

async function onGenerate() {
  if (!validateOptions() || !canGenerate.value) {
    return
  }
  step.value = 'generating'
  try {
    suggestion.value = await runGenerate()
    step.value = 'review'
  } catch (error) {
    step.value = 'options'
    if (isAuthSessionEndUIError(error)) {
      return
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: aiApiErrorMessage(error, t('aiGenerateError')),
    })
  }
}

async function runGenerate() {
  if (props.feature === aiFeatures.documentSummary) {
    return generateDocumentSummary(props.clientId, {
      scope: form.scope,
      documentId: form.documentId,
      customHint: form.customHint,
    })
  }
  if (props.feature === aiFeatures.clinicalSummary) {
    return generateClinicalSummary(props.clientId, {
      scope: form.scope,
      encounterId: form.encounterId,
      historyDays: form.historyDays,
    })
  }
  if (props.feature === aiFeatures.soapDraft) {
    return generateSoapDraft(form.encounterId)
  }
  if (props.feature === aiFeatures.icd10Suggest) {
    return generateIcd10Suggest(form.encounterId, {
      clinicalText: form.clinicalText,
      limit: 5,
    })
  }
  if (props.feature === aiFeatures.carePlanDraft) {
    const focusProblems = String(form.focusProblemsText || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)

    return generateCarePlanDraft(props.clientId, {
      mode: form.mode,
      targetCarePlanId: form.targetCarePlanId,
      problemMode: form.problemMode,
      encounterId: form.encounterId,
      focusProblems,
    })
  }
  throw new Error('Unsupported AI feature')
}

async function onSaveEdits(result) {
  if (!suggestion.value?.id) {
    return
  }
  actionSaving.value = true
  try {
    suggestion.value = await patchAiSuggestion(
      suggestion.value.id,
      result,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('aiEditsSaved'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(error, t('aiActionError')),
      })
    }
  } finally {
    actionSaving.value = false
  }
}

async function onAccept(payload) {
  if (!suggestion.value?.id) {
    return
  }
  actionSaving.value = true
  try {
    suggestion.value = await acceptAiSuggestion(
      suggestion.value.id,
      payload,
    )
    emit('accepted', suggestion.value)
    if (payload.commitToRecord) {
      emit('committed', suggestion.value)
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('aiCommittedSuccess'),
      })
    } else {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('aiAcceptedSuccess'),
      })
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(error, t('aiActionError')),
      })
    }
  } finally {
    actionSaving.value = false
  }
}

async function onReject(reason) {
  if (!suggestion.value?.id) {
    return
  }
  actionSaving.value = true
  try {
    suggestion.value = await rejectAiSuggestion(
      suggestion.value.id,
      reason,
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('aiRejectedSuccess'),
    })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: aiApiErrorMessage(error, t('aiActionError')),
      })
    }
  } finally {
    actionSaving.value = false
  }
}

function onClose() {
  open.value = false
}
</script>

<style scoped lang="scss">
.ai-generate-dialog {
  min-width: min(720px, 96vw);
  max-width: 920px;
}
</style>
