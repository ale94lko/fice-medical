<template>
  <div
    class="screening-editor"
    :class="{ 'screening-editor--embedded': embedded }">
    <header
      v-if="!embedded"
      class="screening-editor__header q-mb-md">
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col">
          <h2 class="screening-editor__title">
            {{ screening.templateName || template?.name }}
          </h2>
          <div class="screening-editor__meta row items-center q-gutter-sm">
            <span
              class="screening-status-badge"
              :class="`screening-status-badge--${screening.status}`">
              {{ ui.statusLabel }}
            </span>
            <span
              v-if="screening.screeningDate"
              class="text-body2 text-grey-7">
              {{ t('screeningDateLabel', {
                date: screening.screeningDate,
              }) }}
            </span>
            <span
              v-if="ui.completedAtDisplay"
              class="text-body2 text-grey-7">
              {{ t('screeningCompletedAtLabel', {
                date: ui.completedAtDisplay,
              }) }}
            </span>
          </div>
        </div>
        <div class="col-auto row q-gutter-sm">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :disable="ui.saving"
            :data-testid="tid.btn('back')"
            :label="t('back')"
            @click="emit('back')"
          />
          <q-btn
            v-if="ui.canEditDraft"
            no-caps
            outline
            color="negative"
            class="app-btn-outline"
            :loading="ui.saving && ui.saveMode === 'cancel'"
            :disable="ui.saving"
            :data-testid="tid.btn('cancel')"
            :label="t('screeningCancel')"
            @click="editor.onCancel"
          />
          <q-btn
            v-if="ui.canEditDraft"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :loading="ui.saving && ui.saveMode === 'draft'"
            :disable="ui.saving"
            :data-testid="tid.btn('save-draft')"
            :label="t('screeningSaveDraft')"
            @click="editor.onSaveDraft"
          />
          <q-btn
            v-if="ui.canEditDraft"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="ui.saving && ui.saveMode === 'complete'"
            :disable="ui.saving"
            :data-testid="tid.btn('complete')"
            :label="t('screeningComplete')"
            @click="editor.onComplete"
          />
        </div>
      </div>
    </header>

    <ScreeningPatientMeasurements
      v-if="ui.showMeasurements"
      v-model:weight="editor.measurements.weight"
      v-model:height="editor.measurements.height"
      class="q-mb-md"
      :bmi-display="ui.bmiDisplay"
      :errors="editor.measurementErrors"
      :readonly="ui.isReadonly"
    />

    <div
      v-for="(section, index) in template?.sections ?? []"
      :key="section.id"
      :data-screening-section="section.id"
      class="q-mb-md">
      <ScreeningDialogSection
        v-if="numberedSections"
        v-model="editor.sectionExpanded[section.id]"
        :index="index + 1"
        :title="section.title"
        :description="section.description"
        :status="sectionStatus(section.id)"
        :section-test-id="tid.section(section.id)">
        <ScreeningDynamicField
          v-for="(question, qIndex) in section.questions"
          :key="question.id"
          v-model="editor.answers[question.id]"
          :question="question"
          :spaced="qIndex > 0"
          :readonly="ui.isReadonly"
          :has-error="Boolean(editor.fieldErrors[question.id])"
          :error-message="t('screeningFieldRequired')"
        />
      </ScreeningDialogSection>

      <AccordionSection
        v-else
        v-model="editor.sectionExpanded[section.id]"
        icon="assignment"
        :title="section.title"
        :section-test-id="tid.section(section.id)">
        <template v-if="section.description" #hint>
          {{ section.description }}
        </template>
        <ScreeningDynamicField
          v-for="(question, qIndex) in section.questions"
          :key="question.id"
          v-model="editor.answers[question.id]"
          :question="question"
          :spaced="qIndex > 0"
          :readonly="ui.isReadonly"
          :has-error="Boolean(editor.fieldErrors[question.id])"
          :error-message="t('screeningFieldRequired')"
        />
      </AccordionSection>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AccordionSection from './AccordionSection.vue'
import ScreeningDialogSection from './ScreeningDialogSection.vue'
import ScreeningDynamicField from 'components/ScreeningDynamicField.vue'
import ScreeningPatientMeasurements
  from 'components/ScreeningPatientMeasurements.vue'
import { useScreeningEditor } from 'src/composables/useScreeningEditor.js'
import { useScreeningEditorUi } from 'src/composables/useScreeningEditorUi.js'
import { screeningTestIds as tid } from 'src/test-ids/index.js'

const { t } = useI18n()

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
  screening: {
    type: Object,
    required: true,
  },
  template: {
    type: Object,
    default: null,
  },
  initialAnswers: {
    type: Object,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  numberedSections: {
    type: Boolean,
    default: false,
  },
  editorApi: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['back', 'saved'])

const localEditor = props.editorApi ? null : useScreeningEditor(() => ({
  patientId: props.patientId,
  screening: props.screening,
  template: props.template,
  initialAnswers: props.initialAnswers,
  readonly: props.readonly,
  onSaved: payload => emit('saved', payload),
}))

const editor = props.editorApi ?? localEditor
const ui = useScreeningEditorUi(editor)

function sectionStatus(sectionId) {
  return ui.sectionStatuses.find(item => item.id === sectionId)
    ?.status ?? 'pending'
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.screening-editor__title {
  margin: 0 0 6px;
  font-size: 1.125rem;
  font-weight: 700;
  color: $text-strong;
}

.screening-editor__meta {
  flex-wrap: wrap;
}

.screening-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;

  &--draft {
    background: #e0f2fe;
    color: #0369a1;
  }

  &--completed {
    background: #dcfce7;
    color: #166534;
  }

  &--cancelled {
    background: #f1f5f9;
    color: $text-muted;
  }
}
</style>
