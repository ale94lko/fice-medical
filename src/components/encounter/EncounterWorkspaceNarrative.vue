<template>
  <div
    class="encounter-workspace-note"
    :data-testid="tid.narrative">
    <section class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <div>
          <h2>{{ t('encounterNarrativeTitle') }}</h2>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ headingHint }}
          </p>
        </div>
        <span
          v-if="savedFlash"
          class="text-positive text-body2">
          {{ t('encounterNarrativeSaved') }} ✓
        </span>
      </div>

      <p
        v-if="narrative?.warning"
        class="text-body2 text-warning q-mb-md">
        {{ narrative.warning }}
      </p>

      <div
        v-if="!fields.length"
        class="text-body2 text-grey-7">
        {{ emptyMessage }}
      </div>

      <div
        v-for="(block, blockIndex) in fieldGroups"
        :key="block.group || `narrative-block-${blockIndex}`"
        class="encounter-narrative-group q-mb-md"
        :data-testid="block.group
          ? tid.narrativeGroup(block.group)
          : undefined">
        <SubsectionHeading
          v-if="showBlockHeading(block)"
          :title="t(block.headingKey)"
        />
        <div
          v-for="field in block.fields"
          :key="field.templateSectionId || field.fieldKey"
          class="q-mb-md">
          <AddClientLabeledField
            :label="field.fieldLabel"
            :required="outerLabelRequired(field)">
            <template
              v-if="canDraftWithAi(field)
                && !isAssessmentPlanSection(field)"
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
                :data-testid="tid.narrativeAiDraft(
                  field.fieldKey,
                )"
                @click="openAiDraft(field)"
              />
            </template>
          <div
            v-if="isClinicalNoteAssessmentSection(field)"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <EncounterNarrativeAssessmentField
              :field="field"
              :can-view="canViewScreenings"
              :can-add="canAddScreenings"
              :can-edit="canEditScreenings"
              @complete="openAssessment(field, 'create')"
              @view="openAssessment(field, 'view')"
              @edit="openAssessment(field, 'edit')"
            />
          </div>
          <div
            v-else-if="isReviewOfSystemsSection(field)"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <EncounterReviewOfSystemsFields
              :field="field"
              :can-edit="canEdit"
              :highlight-missing="highlightMissing"
              @update="onRosUpdate(field, $event)"
              @flush="flushSave"
            />
          </div>
          <div
            v-else-if="isPhysicalExamSection(field)"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <EncounterPhysicalExamFields
              :field="field"
              :can-edit="canEdit"
              :highlight-missing="highlightMissing"
              @update="onPeUpdate(field, $event)"
              @flush="flushSave"
            />
          </div>
          <div
            v-else-if="isMentalStatusExamSection(field)"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <EncounterMentalStatusExamFields
              :field="field"
              :can-edit="canEdit"
              :highlight-missing="highlightMissing"
              @update="onMseUpdate(field, $event)"
              @flush="flushSave"
            />
          </div>
          <div
            v-else-if="isAssessmentPlanSection(field)"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <EncounterAssessmentPlanFields
              :field="field"
              :diagnoses="diagnoses"
              :can-edit="canEdit"
              :highlight-missing="highlightMissing"
              :ai-draft-enabled="canDraftWithAi(field)"
              @update="onApUpdate(field, $event)"
              @flush="flushSave"
              @go-to-visit="emit('go-to-visit')"
              @open-ai-draft="openApAiDraft(field, $event)"
            />
          </div>
          <div
            v-else-if="field.sectionType === 'STRUCTURED_SECTION'"
            :data-testid="tid.narrativeField(field.fieldKey)">
            <div
              v-for="item in structuredFields(field)"
              :key="item.key"
              class="q-mb-sm">
              <AddClientLabeledField :label="item.label">
                <TextInput
                  :model-value="structuredValue(field, item.key)"
                  :external-label="true"
                  :readonly="!canEdit"
                  @update:model-value="onStructured(
                    field,
                    item.key,
                    $event,
                  )"
                  @blur="flushSave"
                />
              </AddClientLabeledField>
            </div>
          </div>
          <TextInput
            v-else-if="field.inputType === 'SHORT_TEXT'"
            :model-value="field.valueText"
            :external-label="true"
            :readonly="!canEdit"
            :placeholder="fieldPlaceholder(field)"
            :error="textFieldIncomplete(field)"
            :test-id="tid.narrativeField(field.fieldKey)"
            @update:model-value="onText(field, $event)"
            @blur="flushSave"
          />
          <q-editor
            v-else-if="field.inputType === 'RICH_TEXT'"
            :model-value="field.valueText"
            min-height="140px"
            :readonly="!canEdit"
            :placeholder="fieldPlaceholder(field)"
            :data-testid="tid.narrativeField(field.fieldKey)"
            @update:model-value="onText(field, $event)"
          />
          <TextInput
            v-else
            :model-value="field.valueText"
            type="textarea"
            autogrow
            :external-label="true"
            :readonly="!canEdit"
            :placeholder="fieldPlaceholder(field)"
            :error="textFieldIncomplete(field)"
            :test-id="tid.narrativeField(field.fieldKey)"
            @update:model-value="onText(field, $event)"
            @blur="flushSave"
          />
          </AddClientLabeledField>
        </div>
      </div>
    </section>
    <EncounterNarrativeAiDraftDialog
      v-model="aiDraftOpen"
      :encounter-id="encounterId"
      :field="aiDraftField"
      :current-text="aiDraftCurrentText"
      :encounter-diagnosis-id="aiDraftDiagnosisId"
      :diagnosis-label="aiDraftDiagnosisLabel"
      :provider-input-required="aiDraftRequiresProviderInput"
      :has-completed-assessments="hasCompletedAssessments"
      @use-draft="onUseAiDraft"
    />
    <ScreeningDialog
      v-if="clientId"
      v-model="assessmentDialogOpen"
      :patient-id="clientId"
      :screening-id="assessmentDialogId"
      :client-screenings="screenings"
      :mode="assessmentDialogMode"
      :readonly="assessmentDialogReadonly"
      :clinician-options="clinicianOptions"
      :initial-template-id="assessmentInitialTemplateId"
      :lock-template="assessmentLockTemplate"
      @saved="onAssessmentSaved"
      @closed="onAssessmentClosed"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import EncounterReviewOfSystemsFields from
  'components/encounter/EncounterReviewOfSystemsFields.vue'
import EncounterPhysicalExamFields from
  'components/encounter/EncounterPhysicalExamFields.vue'
import EncounterMentalStatusExamFields from
  'components/encounter/EncounterMentalStatusExamFields.vue'
import EncounterAssessmentPlanFields from
  'components/encounter/EncounterAssessmentPlanFields.vue'
import EncounterNarrativeAssessmentField from
  'components/encounter/EncounterNarrativeAssessmentField.vue'
import EncounterNarrativeAiDraftDialog from
  'components/encounter/EncounterNarrativeAiDraftDialog.vue'
import ScreeningDialog from 'components/ScreeningDialog.vue'
import { screeningStatuses } from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import {
  saveEncounterNarrative,
} from 'src/utils/encounter-narrative-api.js'
import { isReviewOfSystemsSection } from
  'src/utils/review-of-systems.js'
import { isPhysicalExamSection } from
  'src/utils/physical-exam.js'
import { isMentalStatusExamSection } from
  'src/utils/mental-status-exam.js'
import {
  diagnosisHeading,
  isAssessmentPlanSection,
  resolveAssessmentPlanRows,
  serializeAssessmentPlanValues,
} from 'src/utils/assessment-plan.js'
import {
  groupNarrativeFields,
  narrativeSectionGroupHpi,
} from 'src/utils/clinical-note-narrative-group.js'
import { isClinicalNoteAssessmentSection } from
  'src/utils/clinical-note-assessment-section.js'
import { fetchAllCliniciansSelectOptions } from
  'src/utils/clinicians-api.js'
import { isAdditionalNotesSection } from
  'src/utils/additional-notes.js'
import { isAssessmentSummaryField } from
  'src/utils/assessment-summary.js'
import {
  fieldAllowsNarrativeAi,
  fieldRequiresProviderInput,
  fieldUsesCarePlanAiContext,
} from 'src/utils/narrative-ai-assistance.js'

const props = defineProps({
  encounterId: { type: [String, Number], default: null },
  clientId: { type: [String, Number], default: null },
  narrative: { type: Object, default: null },
  diagnoses: { type: Array, default: () => [] },
  screenings: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false },
  canUseAiDraft: { type: Boolean, default: false },
  canViewScreenings: { type: Boolean, default: false },
  canViewCarePlans: { type: Boolean, default: false },
  canAddScreenings: { type: Boolean, default: false },
  canEditScreenings: { type: Boolean, default: false },
  highlightMissing: { type: Boolean, default: false },
})

const emit = defineEmits(['saved', 'go-to-visit', 'assessment-changed'])
const { t } = useI18n()
const $q = useQuasar()
const fields = ref([])
const savedFlash = ref(false)
const saving = ref(false)
const aiDraftOpen = ref(false)
const aiDraftField = ref(null)
const aiDraftDiagnosisId = ref(null)
const aiDraftDiagnosisLabel = ref('')
const aiDraftPlanText = ref('')
const clinicianOptions = ref([])
const assessmentDialogOpen = ref(false)
const assessmentDialogId = ref(null)
const assessmentDialogMode = ref('create')
const assessmentDialogReadonly = ref(false)
const assessmentInitialTemplateId = ref(null)
const assessmentLockTemplate = ref(false)
let saveTimer = null
let flashTimer = null
let persistQueued = false

const headingHint = computed(() => {
  const name = props.narrative?.templateName
  if (name) {
    return t('encounterNarrativeHintWithTemplate', { name })
  }

  return t('encounterNarrativeHint')
})

const fieldGroups = computed(() => groupNarrativeFields(fields.value))

const hasCompletedAssessments = computed(() =>
  (props.screenings ?? []).some(row =>
    String(row.status ?? '').toLowerCase()
      === screeningStatuses.completed,
  ),
)

function showBlockHeading(block) {
  if (!block?.headingKey) {
    return false
  }
  const fieldsInBlock = Array.isArray(block.fields)
    ? block.fields
    : []
  if (fieldsInBlock.length !== 1) {
    return true
  }
  const group = String(block.group || '').toUpperCase()
  if (group === narrativeSectionGroupHpi) {
    return false
  }
  const heading = t(block.headingKey)
  const label = String(fieldsInBlock[0]?.fieldLabel || '').trim()

  return heading !== label
}

function outerLabelRequired(field) {
  if (!field?.required) {
    return false
  }

  return !isReviewOfSystemsSection(field)
    && !isPhysicalExamSection(field)
    && !isMentalStatusExamSection(field)
    && !isAssessmentPlanSection(field)
}

function textFieldIncomplete(field) {
  if (!props.highlightMissing || !field?.required) {
    return false
  }
  if (isReviewOfSystemsSection(field)
    || isPhysicalExamSection(field)
    || isMentalStatusExamSection(field)
    || isAssessmentPlanSection(field)
    || isClinicalNoteAssessmentSection(field)) {
    return false
  }

  return !String(field.valueText || '').trim()
}

function fieldPlaceholder(field) {
  const text = String(field?.placeholder || '').trim()
  if (text) {
    return text
  }
  if (isAdditionalNotesSection(field)) {
    return t('clinicalNoteAdditionalNotesPlaceholder')
  }
  if (isAssessmentSummaryField(field)) {
    return t('clinicalNoteAssessmentSummaryPlaceholder')
  }

  return ''
}

function canDraftWithAi(field) {
  if (isAssessmentSummaryField(field) && !props.canViewScreenings) {
    return false
  }
  if (fieldUsesCarePlanAiContext(field) && !props.canViewCarePlans) {
    return false
  }

  return props.canEdit
    && props.canUseAiDraft
    && !isClinicalNoteAssessmentSection(field)
    && fieldAllowsNarrativeAi(field)
}

function openAssessment(field, mode) {
  if (!field) {
    return
  }
  assessmentDialogMode.value = mode === 'create' ? 'create' : 'edit'
  assessmentDialogReadonly.value = mode === 'view'
  assessmentLockTemplate.value = mode === 'create'
  assessmentInitialTemplateId.value = mode === 'create'
    ? field.assessmentTemplateId
    : null
  assessmentDialogId.value = mode === 'create'
    ? null
    : field.screeningId
  assessmentDialogOpen.value = true
}

function onAssessmentSaved() {
  emit('assessment-changed')
}

function onAssessmentClosed() {
  assessmentDialogOpen.value = false
}

async function loadClinicians() {
  try {
    clinicianOptions.value = await fetchAllCliniciansSelectOptions()
  } catch {
    clinicianOptions.value = []
  }
}

onMounted(() => {
  void loadClinicians()
})

const aiDraftCurrentText = computed(() => {
  if (isAssessmentPlanSection(aiDraftField.value)) {
    return aiDraftPlanText.value
  }

  return aiDraftField.value?.valueText || ''
})

const aiDraftRequiresProviderInput = computed(() =>
  fieldRequiresProviderInput(aiDraftField.value || {}),
)

function openAiDraft(field) {
  aiDraftField.value = field
  aiDraftDiagnosisId.value = null
  aiDraftDiagnosisLabel.value = ''
  aiDraftPlanText.value = ''
  aiDraftOpen.value = true
}

function openApAiDraft(field, payload = {}) {
  aiDraftField.value = field
  aiDraftDiagnosisId.value = payload.diagnosis?.id ?? null
  aiDraftDiagnosisLabel.value = diagnosisHeading(payload.diagnosis)
  aiDraftPlanText.value = String(payload.plan || '')
  aiDraftOpen.value = true
}

function narrativeJsonKey(value) {
  if (value == null || value === '') {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function applySavedNarrativeMeta(savedFields, current) {
  const byId = new Map(
    savedFields.map(field => [field.templateSectionId, field]),
  )
  current.forEach(field => {
    const saved = byId.get(field.templateSectionId)
    if (!saved || saved.version == null) {
      return
    }
    field.version = saved.version
  })
}

function mergeSavedNarrativeFields(savedFields, previous) {
  const priorById = new Map(
    previous.map(field => [field.templateSectionId, field]),
  )

  return savedFields.map(field => {
    const prior = priorById.get(field.templateSectionId)
    const keepLocalText = Boolean(prior)
      && String(prior.valueText ?? '')
        !== String(field.valueText ?? '')
    const keepLocalJson = Boolean(prior)
      && narrativeJsonKey(prior.valueJson)
        !== narrativeJsonKey(field.valueJson)

    return {
      ...field,
      valueText: keepLocalText ? prior.valueText : field.valueText,
      valueJson: keepLocalJson ? prior.valueJson : field.valueJson,
      aiSuggestionId: prior?.aiSuggestionId || null,
      aiDraftText: prior?.aiDraftText,
      aiModifiedAfter: prior?.aiModifiedAfter === true,
    }
  })
}

function onUseAiDraft({ text, suggestionId }) {
  const field = aiDraftField.value
  if (!field) {
    return
  }
  if (isAssessmentPlanSection(field) && aiDraftDiagnosisId.value != null) {
    applyApDraft(field, aiDraftDiagnosisId.value, text)
  } else {
    field.valueText = text
  }
  field.aiSuggestionId = suggestionId || null
  field.aiDraftText = text
  field.aiModifiedAfter = false
  aiDraftOpen.value = false
}

function applyApDraft(field, diagnosisId, text) {
  const rows = resolveAssessmentPlanRows(
    props.diagnoses,
    field.valueJson,
  )
  const next = rows.map(item => {
    if (Number(item.diagnosis?.id) !== Number(diagnosisId)) {
      return item
    }

    return { ...item, plan: text }
  })
  field.valueJson = serializeAssessmentPlanValues(next)
  aiDraftPlanText.value = text
}

const emptyMessage = computed(() => {
  if (!props.narrative?.templateId) {
    return t('encounterNarrativeNoTemplate')
  }

  return t('encounterNarrativeEmpty')
})

watch(
  () => props.narrative,
  value => {
    const incoming = Array.isArray(value?.fields)
      ? value.fields
      : []
    if (!fields.value.length) {
      fields.value = mergeSavedNarrativeFields(incoming, [])

      return
    }
    applySavedNarrativeMeta(incoming, fields.value)
  },
  { immediate: true },
)

function parseConfig(field) {
  const raw = field?.configurationJson
  if (!raw) {
    return {}
  }
  if (typeof raw === 'object') {
    return raw
  }
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function structuredFields(field) {
  const config = parseConfig(field)
  const list = Array.isArray(config.fields) ? config.fields : []
  if (list.length) {
    return list.map(item => ({
      key: item.key || item.id || item.label,
      label: item.label || item.key || '',
    }))
  }

  return [{ key: 'value', label: field.fieldLabel }]
}

function structuredMap(field) {
  if (field.valueJson && typeof field.valueJson === 'object') {
    return { ...field.valueJson }
  }
  if (typeof field.valueJson === 'string' && field.valueJson.trim()) {
    try {
      const parsed = JSON.parse(field.valueJson)

      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  return {}
}

function structuredValue(field, key) {
  return structuredMap(field)[key] ?? ''
}

function scheduleSave() {
  if (!props.canEdit) {
    return
  }
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    saveTimer = null
    void persist()
  }, 700)
}

function onText(field, value) {
  field.valueText = value
  if (field.aiDraftText != null) {
    field.aiModifiedAfter = String(value ?? '') !== String(field.aiDraftText)
  }
  scheduleSave()
}

function onStructured(field, key, value) {
  const next = structuredMap(field)
  next[key] = value
  field.valueJson = JSON.stringify(next)
  scheduleSave()
}

function onRosUpdate(field, valueJson) {
  field.valueJson = valueJson
}

function onPeUpdate(field, valueJson) {
  field.valueJson = valueJson
}

function onMseUpdate(field, valueJson) {
  field.valueJson = valueJson
}

function onApUpdate(field, valueJson) {
  field.valueJson = valueJson
}

function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  void persist()
}

async function persist() {
  const id = props.encounterId
  if (!id || !props.canEdit || !fields.value.length) {
    return
  }
  if (saving.value) {
    persistQueued = true

    return
  }
  saving.value = true
  persistQueued = false
  try {
    const previous = fields.value
    const saved = await saveEncounterNarrative(id, previous)
    applySavedNarrativeMeta(saved.fields, previous)
    emit('saved', saved)
    savedFlash.value = true
    if (flashTimer) {
      clearTimeout(flashTimer)
    }
    flashTimer = setTimeout(() => {
      savedFlash.value = false
    }, 1600)
  } catch (error) {
    const status = error?.response?.status
    $q.notify({
      type: 'negative',
      message: status === 409
        ? t('encounterNarrativeConflict')
        : (error?.response?.data?.error_description
          || t('encounterNarrativeSaveError')),
    })
  } finally {
    saving.value = false
    if (persistQueued) {
      persistQueued = false
      void persist()
    }
  }
}

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (flashTimer) {
    clearTimeout(flashTimer)
  }
  void persist()
})
</script>
