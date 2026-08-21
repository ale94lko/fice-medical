<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="tid.narrativeAiDialog">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="closeDialog">
        {{ t('narrativeAiDialogTitle') }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ dialogHint }}
        </p>

        <div
          v-if="currentNarrative"
          class="q-mb-md">
          <AddClientLabeledField
            :label="t('narrativeAiCurrentNarrative')">
            <p class="text-body2 q-mb-none
              encounter-narrative-ai-draft__current">
              {{ currentNarrative }}
            </p>
          </AddClientLabeledField>
        </div>

        <AddClientLabeledField
          :label="t('narrativeAiProviderInput')"
          :required="providerInputRequired">
          <TextInput
            v-model="providerInput"
            type="textarea"
            autogrow
            :external-label="true"
            :disable="generating"
            :placeholder="providerInputPlaceholder"
            :test-id="tid.narrativeAiProviderInput"
          />
        </AddClientLabeledField>
        <p class="text-caption text-grey-7 q-mt-xs q-mb-md">
          {{ providerInputHint }}
        </p>

        <div
          v-if="errorMessage"
          class="text-body2 q-mb-md"
          :class="insufficientContext
            ? 'text-grey-7'
            : 'text-negative'">
          {{ errorMessage }}
        </div>

        <div
          v-if="generating"
          class="row flex-center q-pa-md">
          <q-spinner color="primary" size="32px" />
        </div>

        <div
          v-else-if="draftText"
          class="q-mb-md">
          <AddClientLabeledField
            :label="t('narrativeAiSuggestedDraft')">
            <p
              class="text-body2 q-mb-none
                encounter-narrative-ai-draft__suggestion"
              :data-testid="tid.narrativeAiSuggestion">
              {{ draftText }}
            </p>
          </AddClientLabeledField>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          v-if="!draftText"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          :disable="generating"
          :data-testid="tid.narrativeAiCancel"
          @click="closeDialog"
        />
        <q-btn
          v-else
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('narrativeAiDiscard')"
          :disable="generating"
          :data-testid="tid.narrativeAiDiscard"
          @click="discardSuggestion"
        />
        <q-btn
          v-if="draftText"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="refresh"
          :label="t('narrativeAiTryAgain')"
          :disable="generateDisabled"
          :data-testid="tid.narrativeAiTryAgain"
          @click="generateDraft"
        />
        <q-btn
          v-if="!draftText"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="auto_awesome"
          :loading="generating"
          :disable="generateDisabled"
          :label="t('narrativeAiDraftWithAi')"
          :data-testid="tid.narrativeAiGenerate"
          @click="generateDraft"
        />
        <q-btn
          v-else
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :disable="generating"
          :label="t('narrativeAiUseDraft')"
          :data-testid="tid.narrativeAiUseDraft"
          @click="onUseDraft"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <ModalComponent
    v-model="replaceConfirmOpen"
    :title="t('narrativeAiReplaceConfirmTitle')"
    :message="t('narrativeAiReplaceConfirmMessage')"
    :confirm-text="t('narrativeAiUseDraft')"
    :cancel-text="t('cancel')"
    test-id="narrative-ai-replace"
    @confirm="confirmUseDraft"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ModalComponent from 'components/ModalComponent.vue'
import TextInput from 'components/TextInput.vue'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  acceptAiSuggestion,
  aiApiErrorMessage,
  generateNarrativeDraft,
  rejectAiSuggestion,
} from 'src/utils/ai-api.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import { isAssessmentSummaryField } from
  'src/utils/assessment-summary.js'
import {
  isClientOwnWordsField,
  isProgressTowardsGoalsField,
  isSessionSummaryField,
} from 'src/utils/narrative-ai-assistance.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  encounterId: { type: [String, Number], default: null },
  field: { type: Object, default: null },
  currentText: { type: String, default: '' },
  encounterDiagnosisId: { type: [String, Number], default: null },
  diagnosisLabel: { type: String, default: '' },
  providerInputRequired: { type: Boolean, default: false },
  hasCompletedAssessments: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'use-draft'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const providerInput = ref('')
const generating = ref(false)
const errorMessage = ref('')
const suggestion = ref(null)
const replaceConfirmOpen = ref(false)
const insufficientContext = ref(false)

const currentNarrative = computed(() =>
  String(props.currentText ?? '').trim(),
)

const providerInputMissing = computed(() =>
  props.providerInputRequired
    && !String(providerInput.value || '').trim(),
)

const assessmentSummaryBlocked = computed(() =>
  isAssessmentSummaryField(props.field)
    && !props.hasCompletedAssessments,
)

const generateDisabled = computed(() =>
  generating.value
    || providerInputMissing.value
    || assessmentSummaryBlocked.value,
)

const dialogHint = computed(() => {
  if (isAssessmentSummaryField(props.field)) {
    return t('narrativeAiDialogHintAssessmentSummary', {
      label: props.field?.fieldLabel || '',
    })
  }
  if (isSessionSummaryField(props.field)) {
    return t('narrativeAiDialogHintSessionSummary', {
      label: props.field?.fieldLabel || '',
    })
  }
  if (isProgressTowardsGoalsField(props.field)) {
    return t('narrativeAiDialogHintProgressTowardsGoals', {
      label: props.field?.fieldLabel || '',
    })
  }
  if (isClientOwnWordsField(props.field)) {
    return t('narrativeAiDialogHintClientOwnWords', {
      label: props.field?.fieldLabel || '',
    })
  }
  if (props.diagnosisLabel) {
    return t('narrativeAiDialogHintPlan', {
      label: props.field?.fieldLabel || '',
      diagnosis: props.diagnosisLabel,
    })
  }

  return t('narrativeAiDialogHint', {
    label: props.field?.fieldLabel || '',
  })
})

const providerInputPlaceholder = computed(() =>
  props.providerInputRequired
    ? t('narrativeAiProviderInputRequiredPlaceholder')
    : t('narrativeAiProviderInputPlaceholder'),
)

const providerInputHint = computed(() =>
  props.providerInputRequired
    ? t('narrativeAiProviderInputRequiredHint')
    : t('narrativeAiProviderInputHint'),
)

const draftText = computed(() => {
  const result = suggestion.value?.result
  if (result && typeof result.draft === 'string') {
    return result.draft
  }

  return ''
})

watch(
  () => [
    props.modelValue,
    props.field?.templateSectionId,
    props.encounterDiagnosisId,
    assessmentSummaryBlocked.value,
  ],
  () => {
    if (props.modelValue) {
      providerInput.value = ''
      suggestion.value = null
      replaceConfirmOpen.value = false
      insufficientContext.value = assessmentSummaryBlocked.value
      errorMessage.value = assessmentSummaryBlocked.value
        ? t('narrativeAiNoCompletedAssessments')
        : ''
    }
  },
)

async function generateDraft() {
  const encounterId = props.encounterId
  const field = props.field
  if (encounterId == null || !field?.templateSectionId) {
    return
  }
  if (assessmentSummaryBlocked.value) {
    errorMessage.value = t('narrativeAiNoCompletedAssessments')
    insufficientContext.value = true

    return
  }
  if (providerInputMissing.value) {
    errorMessage.value = t('narrativeAiProviderInputRequiredError')

    return
  }
  generating.value = true
  errorMessage.value = ''
  insufficientContext.value = false
  try {
    suggestion.value = await generateNarrativeDraft(encounterId, {
      templateSectionId: field.templateSectionId,
      fieldKey: field.fieldKey,
      providerInput: providerInput.value,
      existingNarrative: currentNarrative.value,
      encounterDiagnosisId: props.encounterDiagnosisId,
    })
    if (isInsufficientSuggestion(suggestion.value)) {
      insufficientContext.value = true
      errorMessage.value = t('narrativeAiInsufficientContext')
    }
  } catch (error) {
    suggestion.value = null
    insufficientContext.value = false
    if (!isAuthSessionEndUIError(error)) {
      const apiMessage = aiApiErrorMessage(
        error,
        t('narrativeAiGenerateError'),
      )
      if (apiMessage.toLowerCase().includes(
        'no completed assessments',
      )) {
        insufficientContext.value = true
        errorMessage.value = t(
          'narrativeAiNoCompletedAssessments',
        )
      } else {
        errorMessage.value = apiMessage
      }
    }
  } finally {
    generating.value = false
  }
}

function isInsufficientSuggestion(row) {
  const result = row?.result
  if (result?.insufficient_context === true
    || result?.insufficientContext === true) {
    return true
  }
  const draft = typeof result?.draft === 'string'
    ? result.draft.trim()
    : ''

  return !draft
}

async function onUseDraft() {
  const text = draftText.value
  if (!text) {
    return
  }
  if (currentNarrative.value) {
    replaceConfirmOpen.value = true

    return
  }
  await applyUseDraft()
}

async function confirmUseDraft() {
  replaceConfirmOpen.value = false
  await applyUseDraft()
}

async function applyUseDraft() {
  const text = draftText.value
  const id = suggestion.value?.id
  if (!text) {
    return
  }
  if (id) {
    try {
      await acceptAiSuggestion(id, { commitToRecord: false })
    } catch (error) {
      if (!isAuthSessionEndUIError(error)) {
        errorMessage.value = aiApiErrorMessage(
          error,
          t('narrativeAiGenerateError'),
        )
      }

      return
    }
  }
  emit('use-draft', {
    text,
    suggestionId: id,
  })
  open.value = false
}

async function rejectCurrentSuggestion() {
  const id = suggestion.value?.id
  if (id && !suggestion.value?.acceptedAt) {
    try {
      await rejectAiSuggestion(id, 'discarded')
    } catch {
      // Keep the clinician able to close even if reject fails.
    }
  }
}

async function discardSuggestion() {
  await rejectCurrentSuggestion()
  suggestion.value = null
  errorMessage.value = ''
}

async function closeDialog() {
  await rejectCurrentSuggestion()
  open.value = false
}
</script>

<style lang="scss" scoped>
.encounter-narrative-ai-draft__current,
.encounter-narrative-ai-draft__suggestion {
  white-space: pre-wrap;
  border: 1px solid $border-subtle;
  border-radius: 8px;
  padding: 12px 16px;
  background: #fff;
}
</style>
