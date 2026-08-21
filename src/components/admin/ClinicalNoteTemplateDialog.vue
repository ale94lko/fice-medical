<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="insurance-dialog app-dialog-card app-dialog-card--lg"
      :data-testid="tid.dialog">
      <AppDialogHeader
        :close-label="t('close')"
        :test-id="tid.dialog"
        @close="emit('update:modelValue', false)">
        {{ dialogTitle }}
      </AppDialogHeader>
      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clinicalNoteTemplateBuilderHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <AddClientLabeledField
              :label="t('clinicalNoteTemplateNameLabel')"
              required>
              <TextInput
                v-model="local.name"
                :external-label="true"
                :readonly="readonly"
                :test-id="tid.field('name')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-4">
            <AddClientLabeledField
              :label="t('clinicalNoteTemplateStatusLabel')">
              <FormToggle
                v-model="statusActive"
                :disable="readonly || local.systemTemplate"
                :label="t('clinicalNoteTemplateStatusActive')"
              />
            </AddClientLabeledField>
          </div>
        </div>
        <div class="q-mt-md">
          <AddClientLabeledField
            :label="t('clinicalNoteTemplateDescriptionLabel')">
            <TextInput
              v-model="local.description"
              type="textarea"
              autogrow
              :external-label="true"
              :readonly="readonly"
              :test-id="tid.field('description')"
            />
          </AddClientLabeledField>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <div class="row items-center justify-between">
            <SubsectionHeading
              icon="view_agenda"
              :title="t('clinicalNoteTemplateSectionsTitle')"
            />
            <div
              v-if="!readonly"
              class="row items-center q-gutter-sm">
              <q-btn
                no-caps
                outline
                color="primary"
                class="app-btn-outline"
                icon="add"
                :label="t('clinicalNoteTemplateAddSection')"
                :data-testid="tid.addSection"
                @click="addSection"
              />
              <q-btn
                no-caps
                outline
                color="primary"
                class="app-btn-outline"
                icon="note_add"
                :label="t('clinicalNoteTemplateAddAdditionalNotes')"
                :data-testid="tid.addAdditionalNotes"
                @click="addAdditionalNotes"
              />
            </div>
          </div>

          <div
            v-for="(section, index) in local.sections"
            :key="section.uid"
            class="clinical-note-template-dialog__section q-mt-md"
            draggable="true"
            @dragstart="onDragStart(index, $event)"
            @dragover.prevent
            @drop="onDrop(index)">
            <div class="row items-start q-col-gutter-sm">
              <div class="col-auto">
                <q-icon name="drag_indicator" color="grey-6" />
              </div>
              <div class="col">
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplateSectionLabel')"
                      required>
                      <TextInput
                        v-model="section.label"
                        :external-label="true"
                        :readonly="readonly"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplateSectionType')"
                      required>
                      <FormSelect
                        v-model="section.sectionType"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        :options="typeOptions"
                        :readonly="readonly"
                        @update:model-value="onSectionTypeChange(section)"
                      />
                    </AddClientLabeledField>
                  </div>
                </div>
                <div
                  v-if="section.sectionType === types.autoData"
                  class="row q-col-gutter-sm q-mt-sm">
                  <div class="col-12 col-md-6">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplateDataSource')"
                      required>
                      <FormSelect
                        v-model="section.dataSource"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        :options="sourceOptions"
                        :readonly="readonly"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-6">
                    <FormToggle
                      v-model="section.showWhenEmpty"
                      :disable="readonly"
                      :label="t('clinicalNoteTemplateShowWhenEmpty')"
                    />
                  </div>
                </div>
                <div
                  v-if="section.sectionType === types.narrativeField"
                  class="row q-col-gutter-sm q-mt-sm">
                  <div class="col-12 col-md-4">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplateInputType')">
                      <FormSelect
                        v-model="section.inputType"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        :options="inputOptions"
                        :readonly="readonly"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-4">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplateSectionGroup')">
                      <FormSelect
                        v-model="section.sectionGroup"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        clearable
                        :options="narrativeGroupOptions"
                        :readonly="readonly"
                        :test-id="tid.field('section-group-' + index)"
                      />
                    </AddClientLabeledField>
                  </div>
                  <div class="col-12 col-md-4">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplatePlaceholder')">
                      <TextInput
                        v-model="section.placeholder"
                        :external-label="true"
                        :readonly="readonly"
                      />
                    </AddClientLabeledField>
                  </div>
                </div>
                <div
                  v-if="showsNarrativeAiConfig(section)"
                  class="row q-col-gutter-sm q-mt-sm">
                  <div class="col-12 col-md-6">
                    <FormToggle
                      v-model="section.aiAssistance"
                      :disable="readonly"
                      :label="t('clinicalNoteTemplateAiAssistance')"
                      :test-id="tid.field('ai-assistance-' + index)"
                      @update:model-value="onAiAssistance(section)"
                    />
                  </div>
                  <div
                    v-if="section.aiAssistance"
                    class="col-12 col-md-6">
                    <FormToggle
                      v-model="section.aiProviderInputRequired"
                      :disable="readonly
                        || locksAiProviderInput(section)"
                      :label="t(
                        'clinicalNoteTemplateAiProviderInputRequired',
                      )"
                      :test-id="tid.field(
                        'ai-provider-input-' + index,
                      )"
                    />
                  </div>
                  <div
                    v-if="section.aiAssistance"
                    class="col-12">
                    <AddClientLabeledField
                      :label="t('clinicalNoteTemplateAiContextSources')">
                      <FormSelect
                        v-model="section.aiContextSources"
                        outlined
                        hide-bottom-space
                        emit-value
                        map-options
                        multiple
                        use-chips
                        :options="aiContextSourceOptions"
                        :readonly="readonly"
                        :test-id="tid.field('ai-sources-' + index)"
                      />
                    </AddClientLabeledField>
                    <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
                      {{ t('clinicalNoteTemplateAiContextHint') }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="section.sectionType === types.assessment"
                  class="q-mt-sm">
                  <AddClientLabeledField
                    :label="t('clinicalNoteTemplateAssessment')"
                    required>
                    <FormSelect
                      v-model="section.assessmentTemplateId"
                      outlined
                      hide-bottom-space
                      emit-value
                      map-options
                      :options="assessmentOptions"
                      :readonly="readonly"
                    />
                  </AddClientLabeledField>
                </div>
                <div
                  v-if="section.sectionType === types.structuredSection"
                  class="q-mt-sm">
                  <div class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-12 col-md-6">
                      <AddClientLabeledField
                        :label="t(
                          'clinicalNoteTemplateStructuredDefinition',
                        )"
                        required>
                        <FormSelect
                          :model-value="section.structuredDefinition
                            || 'CUSTOM'"
                          outlined
                          hide-bottom-space
                          emit-value
                          map-options
                          :options="structuredDefinitionOptions"
                          :readonly="readonly"
                          @update:model-value="onStructuredDefinition(
                            section,
                            $event,
                          )"
                        />
                      </AddClientLabeledField>
                    </div>
                  </div>
                  <p
                    v-if="isManagedStructuredDefinition(section)"
                    class="text-body2 text-grey-7 q-mb-sm">
                    {{ managedStructuredHint(section) }}
                  </p>
                  <template v-else>
                  <p class="text-body2 text-grey-7 q-mb-sm">
                    {{ t('clinicalNoteTemplateStructuredFieldsHint') }}
                  </p>
                  <div
                    v-for="(field, fieldIndex) in
                      section.structuredFields"
                    :key="field.uid"
                    class="row items-end q-col-gutter-sm q-mb-sm">
                    <div class="col">
                      <AddClientLabeledField
                        :label="t(
                          'clinicalNoteTemplateStructuredFieldLabel',
                        )"
                        required>
                        <TextInput
                          v-model="field.label"
                          :external-label="true"
                          :readonly="readonly"
                        />
                      </AddClientLabeledField>
                    </div>
                    <div
                      v-if="!readonly"
                      class="col-auto
                        add-client-form__contact-method-type-row">
                      <AddClientMethodRowActions
                        :is-last="fieldIndex
                          === section.structuredFields.length - 1"
                        :total="section.structuredFields.length"
                        :add-label="t(
                          'clinicalNoteTemplateAddStructuredField',
                        )"
                        :remove-label="t('delete')"
                        :add-test-id="tid.addStructuredField(index)"
                        :remove-test-id="tid.removeStructuredField(
                          index,
                          fieldIndex,
                        )"
                        @add="addStructuredField(section)"
                        @remove="removeStructuredField(
                          section,
                          fieldIndex,
                        )"
                      />
                    </div>
                  </div>
                  </template>
                </div>
                <div class="row items-center q-gutter-md q-mt-sm">
                  <FormToggle
                    v-if="section.sectionType === types.narrativeField
                      || section.sectionType === types.structuredSection"
                    v-model="section.required"
                    :disable="readonly"
                    :label="t('clinicalNoteTemplateRequired')"
                  />
                  <FormToggle
                    v-if="section.sectionType === types.narrativeField
                      || section.sectionType === types.assessment
                      || section.sectionType === types.structuredSection"
                    :model-value="section.showWhenEmpty !== false"
                    :disable="readonly"
                    :label="t('clinicalNoteTemplateShowWhenEmpty')"
                    @update:model-value="section.showWhenEmpty = $event"
                  />
                </div>
                <p
                  v-if="isAdditionalNotesSection(section)"
                  class="text-body2 text-grey-7 q-mb-none q-mt-sm">
                  {{ t('clinicalNoteAdditionalNotesHint') }}
                </p>
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_upward"
                  :disable="readonly || index === 0"
                  :aria-label="t('clinicalNoteTemplateMoveUp')"
                  :data-testid="tid.moveUp(index)"
                  @click="move(index, -1)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="arrow_downward"
                  :disable="readonly
                    || index === local.sections.length - 1"
                  :aria-label="t('clinicalNoteTemplateMoveDown')"
                  :data-testid="tid.moveDown(index)"
                  @click="move(index, 1)"
                />
                <q-btn
                  v-if="!readonly"
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="negative"
                  :aria-label="t('delete')"
                  :data-testid="tid.removeSection(index)"
                  @click="removeSection(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('clinicalNoteTemplatePreview')"
          :data-testid="tid.btn('preview')"
          @click="emit('preview', local)"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          :data-testid="tid.btn('cancel')"
          @click="emit('update:modelValue', false)"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('save')"
          :data-testid="tid.btn('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AddClientMethodRowActions from
  'components/AddClientMethodRowActions.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import TextInput from 'components/TextInput.vue'
import {
  clinicalNoteDataSources,
  clinicalNoteInputTypes,
  clinicalNoteSectionTypes as types,
} from 'src/composables/useClinicalNoteTemplatePermissions.js'
import { clinicalNoteTemplateDialogTestIds as tid } from
  'src/test-ids/index.js'
import {
  parseStructuredSectionFields,
  serializeStructuredSectionConfig,
} from 'src/utils/clinical-note-template-api.js'
import {
  isAdditionalNotesSection,
  nextAdditionalNotesSectionKey,
} from 'src/utils/additional-notes.js'
import {
  narrativeSectionGroupHpi,
  parseNarrativeSectionGroup,
} from 'src/utils/clinical-note-narrative-group.js'
import {
  assessmentSummaryContextSources,
  hpiProblemsChronicContextSources,
  isAssessmentSummaryField,
  isClinicalAssessmentField,
  isClientOwnWordsField,
  isIntervalHpiField,
  isInterventionsField,
  isPatientResponseField,
  isPlanNarrativeField,
  isPreventivePlanField,
  isProgressTowardsGoalsField,
  isSessionSummaryField,
  isTargetedBehaviorsField,
  isTreatmentModalityField,
  narrativeAiContextSources,
  planNarrativeAiContextSources,
  progressTowardsGoalsContextSources,
  targetedBehaviorsContextSources,
} from 'src/utils/narrative-ai-assistance.js'
import {
  parseStructuredDefinition,
  reviewOfSystemsDefinition,
} from 'src/utils/review-of-systems.js'
import { physicalExamDefinition } from 'src/utils/physical-exam.js'
import { mentalStatusExamDefinition } from
  'src/utils/mental-status-exam.js'
import { assessmentPlanDefinition, isAssessmentPlanSection } from
  'src/utils/assessment-plan.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  template: { type: Object, default: null },
  mode: { type: String, default: 'add' },
  saving: { type: Boolean, default: false },
  assessmentOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save', 'preview'])
const { t } = useI18n()
let uid = 0
const dragIndex = ref(-1)

function emptyStructuredField() {
  uid += 1

  return {
    uid: `sf-${uid}`,
    key: '',
    label: '',
  }
}

function emptySection() {
  uid += 1

  return {
    uid,
    label: '',
    sectionType: types.narrativeField,
    required: false,
    showWhenEmpty: true,
    dataSource: '',
    inputType: 'LONG_TEXT',
    placeholder: '',
    assessmentTemplateId: null,
    configurationJson: '',
    sectionGroup: '',
    aiAssistance: false,
    aiContextSources: [],
    aiProviderInputRequired: false,
    structuredDefinition: 'CUSTOM',
    structuredFields: [emptyStructuredField()],
    sectionKey: '',
    active: true,
  }
}

function cloneTemplate(source) {
  const sections = Array.isArray(source?.sections)
    ? source.sections.map(section => {
      uid += 1

      return {
        ...emptySection(),
        ...section,
        uid,
        showWhenEmpty: section.showWhenEmpty !== false,
        inputType: section.inputType || 'LONG_TEXT',
        structuredFields: parseStructuredSectionFields(
          section.configurationJson,
        ),
        structuredDefinition: parseStructuredDefinition(
          section.configurationJson,
        ),
        sectionGroup: section.sectionGroup
          || parseNarrativeSectionGroup(section.configurationJson),
        aiAssistance: Boolean(section.aiAssistance),
        aiContextSources: Array.isArray(section.aiContextSources)
          ? [...section.aiContextSources]
          : [],
        aiProviderInputRequired: Boolean(
          section.aiProviderInputRequired,
        )
          || (Boolean(section.aiAssistance)
            && isAssessmentPlanSection(section)),
      }
    })
    : [emptySection()]

  return {
    id: source?.id ?? null,
    name: source?.name ?? '',
    description: source?.description ?? '',
    status: source?.status ?? 'ACTIVE',
    systemTemplate: Boolean(source?.systemTemplate),
    version: source?.version ?? 1,
    sections,
  }
}

const local = ref(cloneTemplate(props.template))

watch(
  () => [props.modelValue, props.template],
  () => {
    if (props.modelValue) {
      local.value = cloneTemplate(props.template)
    }
  },
)

const readonly = computed(() => props.mode === 'view'
  || Boolean(local.value.systemTemplate))
const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('clinicalNoteTemplateViewTitle')
  }
  if (props.mode === 'edit') {
    return t('clinicalNoteTemplateEditTitle')
  }

  return t('clinicalNoteTemplateAddTitle')
})
const statusActive = computed({
  get: () => local.value.status !== 'INACTIVE',
  set: value => {
    local.value.status = value ? 'ACTIVE' : 'INACTIVE'
  },
})
const typeOptions = computed(() => [
  {
    label: t('clinicalNoteSectionAutoData'),
    value: types.autoData,
  },
  {
    label: t('clinicalNoteSectionNarrative'),
    value: types.narrativeField,
  },
  {
    label: t('clinicalNoteSectionAssessment'),
    value: types.assessment,
  },
  {
    label: t('clinicalNoteSectionStructured'),
    value: types.structuredSection,
  },
])
const sourceOptions = computed(() => clinicalNoteDataSources.map(value => ({
  label: t(`clinicalNoteDataSource_${value}`),
  value,
})))
const inputOptions = computed(() => clinicalNoteInputTypes.map(value => ({
  label: t(`clinicalNoteInputType_${value}`),
  value,
})))
const narrativeGroupOptions = computed(() => [
  {
    label: t('encounterNarrativeGroupHpi'),
    value: narrativeSectionGroupHpi,
  },
])
const aiContextSourceOptions = computed(() =>
  narrativeAiContextSources.map(value => ({
    label: t(`narrativeAiContextSource_${value}`),
    value,
  })),
)

function showsNarrativeAiConfig(section) {
  return section.sectionType === types.narrativeField
    || isAssessmentPlanSection(section)
}

function locksAiProviderInput(section) {
  return isAssessmentPlanSection(section)
    || isPlanNarrativeField(section)
    || isPreventivePlanField(section)
    || isClinicalAssessmentField(section)
    || isInterventionsField(section)
    || isPatientResponseField(section)
    || isSessionSummaryField(section)
    || isProgressTowardsGoalsField(section)
    || isClientOwnWordsField(section)
    || isTreatmentModalityField(section)
}

function onAiAssistance(section) {
  if (!section.aiAssistance) {
    section.aiContextSources = []
    section.aiProviderInputRequired = false

    return
  }
  if (isAssessmentPlanSection(section)
    || isPlanNarrativeField(section)
    || isPreventivePlanField(section)
    || isClinicalAssessmentField(section)) {
    section.aiProviderInputRequired = true
    if (!Array.isArray(section.aiContextSources)
      || !section.aiContextSources.length) {
      section.aiContextSources = [...planNarrativeAiContextSources]
    }

    return
  }
  if (isInterventionsField(section)
    || isPatientResponseField(section)
    || isSessionSummaryField(section)
    || isClientOwnWordsField(section)
    || isTreatmentModalityField(section)) {
    section.aiProviderInputRequired = true
    if (!Array.isArray(section.aiContextSources)
      || !section.aiContextSources.length) {
      section.aiContextSources = ['PROVIDER_INPUT']
    }

    return
  }
  if (isProgressTowardsGoalsField(section)) {
    section.aiProviderInputRequired = true
    if (!Array.isArray(section.aiContextSources)
      || !section.aiContextSources.length) {
      section.aiContextSources = [
        ...progressTowardsGoalsContextSources,
      ]
    }

    return
  }
  if (isTargetedBehaviorsField(section)) {
    if (!Array.isArray(section.aiContextSources)
      || !section.aiContextSources.length) {
      section.aiContextSources = [
        ...targetedBehaviorsContextSources,
      ]
    }

    return
  }
  if (isIntervalHpiField(section)) {
    section.aiProviderInputRequired = false
    if (!Array.isArray(section.aiContextSources)
      || !section.aiContextSources.length) {
      section.aiContextSources = [
        ...hpiProblemsChronicContextSources,
      ]
    }

    return
  }
  if (isAssessmentSummaryField(section)) {
    section.aiProviderInputRequired = false
    if (!Array.isArray(section.aiContextSources)
      || !section.aiContextSources.length) {
      section.aiContextSources = [
        ...assessmentSummaryContextSources,
      ]
    }

    return
  }
  if (!Array.isArray(section.aiContextSources)
    || !section.aiContextSources.length) {
    section.aiContextSources = ['PROVIDER_INPUT']
  }
}

function addSection() {
  local.value.sections.push(emptySection())
}

function addAdditionalNotes() {
  const section = emptySection()
  section.label = t('clinicalNoteAdditionalNotesLabel')
  section.sectionType = types.narrativeField
  section.inputType = 'LONG_TEXT'
  section.required = false
  section.showWhenEmpty = false
  section.placeholder = t('clinicalNoteAdditionalNotesPlaceholder')
  section.sectionKey = nextAdditionalNotesSectionKey(
    local.value.sections,
  )
  local.value.sections.push(section)
}

function removeSection(index) {
  local.value.sections.splice(index, 1)
}

function move(index, delta) {
  const next = index + delta
  if (next < 0 || next >= local.value.sections.length) {
    return
  }
  const copy = [...local.value.sections]
  const [row] = copy.splice(index, 1)
  copy.splice(next, 0, row)
  local.value.sections = copy
}

function onDragStart(index, event) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(index) {
  if (dragIndex.value < 0 || dragIndex.value === index) {
    return
  }
  move(dragIndex.value, index - dragIndex.value)
  dragIndex.value = -1
}

function onSectionTypeChange(section) {
  if (section.sectionType === types.structuredSection
    && !section.structuredFields?.length) {
    section.structuredFields = [emptyStructuredField()]
  }
  if (section.sectionType === types.structuredSection
    && !section.structuredDefinition) {
    section.structuredDefinition = 'CUSTOM'
  }
  if (section.sectionType !== types.narrativeField
    && !isAssessmentPlanSection(section)) {
    section.sectionGroup = ''
    section.aiAssistance = false
    section.aiContextSources = []
    section.aiProviderInputRequired = false
  }
}

const structuredDefinitionOptions = computed(() => [
  {
    label: t('clinicalNoteStructuredCustom'),
    value: 'CUSTOM',
  },
  {
    label: t('rosDefaultLabel'),
    value: reviewOfSystemsDefinition,
  },
  {
    label: t('peDefaultLabel'),
    value: physicalExamDefinition,
  },
  {
    label: t('mseDefaultLabel'),
    value: mentalStatusExamDefinition,
  },
  {
    label: t('apDefaultLabel'),
    value: assessmentPlanDefinition,
  },
])

function isManagedStructuredDefinition(section) {
  return section.structuredDefinition === reviewOfSystemsDefinition
    || section.structuredDefinition === physicalExamDefinition
    || section.structuredDefinition === mentalStatusExamDefinition
    || section.structuredDefinition === assessmentPlanDefinition
}

function managedStructuredHint(section) {
  if (section.structuredDefinition === assessmentPlanDefinition) {
    return t('clinicalNoteTemplateApHint')
  }
  if (section.structuredDefinition === mentalStatusExamDefinition) {
    return t('clinicalNoteTemplateMseHint')
  }
  if (section.structuredDefinition === physicalExamDefinition) {
    return t('clinicalNoteTemplatePeHint')
  }

  return t('clinicalNoteTemplateRosHint')
}

function onStructuredDefinition(section, value) {
  section.structuredDefinition = value || 'CUSTOM'
  if (value !== assessmentPlanDefinition) {
    section.aiAssistance = false
    section.aiContextSources = []
    section.aiProviderInputRequired = false
  }
  if (value === reviewOfSystemsDefinition) {
    if (!String(section.label || '').trim()) {
      section.label = t('rosDefaultLabel')
    }

    return
  }
  if (value === physicalExamDefinition) {
    if (!String(section.label || '').trim()) {
      section.label = t('peDefaultLabel')
    }

    return
  }
  if (value === mentalStatusExamDefinition) {
    if (!String(section.label || '').trim()) {
      section.label = t('mseDefaultLabel')
    }

    return
  }
  if (value === assessmentPlanDefinition) {
    if (!String(section.label || '').trim()) {
      section.label = t('apDefaultLabel')
    }

    return
  }
  if (!section.structuredFields?.length) {
    section.structuredFields = [emptyStructuredField()]
  }
}

function addStructuredField(section) {
  section.structuredFields.push(emptyStructuredField())
}

function removeStructuredField(section, fieldIndex) {
  if (section.structuredFields.length <= 1) {
    return
  }
  section.structuredFields.splice(fieldIndex, 1)
}

function onSave() {
  const sections = local.value.sections.map(section => {
    if (section.sectionType !== types.structuredSection) {
      return section
    }

    return {
      ...section,
      configurationJson: serializeStructuredSectionConfig(section),
    }
  })
  emit('save', { ...local.value, sections })
}
</script>

<style lang="scss" scoped>
.clinical-note-template-dialog__section {
  border: 1px solid $border-subtle;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}
</style>
