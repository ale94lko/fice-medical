<template>
  <div class="assessment-editor">
    <header class="assessment-editor__header q-mb-md">
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="col">
          <h2 class="assessment-editor__title">
            {{ assessment.templateName || template?.name }}
          </h2>
          <div class="assessment-editor__meta row items-center q-gutter-sm">
            <span
              class="assessment-status-badge"
              :class="`assessment-status-badge--${assessment.status}`">
              {{ statusLabel }}
            </span>
            <span
              v-if="assessment.assessmentDate"
              class="text-body2 text-grey-7">
              {{ t('assessmentDateLabel', {
                date: assessment.assessmentDate,
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
            :disable="saving"
            :data-testid="tid.btn('back')"
            :label="t('back')"
            @click="emit('back')"
          />
          <q-btn
            v-if="!isCompleted"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :loading="saving && saveMode === 'draft'"
            :disable="saving"
            :data-testid="tid.btn('save-draft')"
            :label="t('assessmentSaveDraft')"
            @click="onSaveDraft"
          />
          <q-btn
            v-if="!isCompleted"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving && saveMode === 'complete'"
            :disable="saving"
            :data-testid="tid.btn('complete')"
            :label="t('assessmentComplete')"
            @click="onComplete"
          />
        </div>
      </div>
    </header>

    <AssessmentPatientMeasurements
      v-model:weight="measurements.weight"
      v-model:height="measurements.height"
      class="q-mb-md"
      :bmi-display="bmiDisplay"
      :errors="measurementErrors"
      :readonly="isCompleted"
    />

    <div
      v-for="section in template?.sections ?? []"
      :key="section.id"
      class="q-mb-md">
      <AccordionSection
        v-model="sectionExpanded[section.id]"
        icon="assignment"
        :title="section.title"
        :section-test-id="tid.section(section.id)">
        <template v-if="section.description" #hint>
          {{ section.description }}
        </template>
        <AssessmentDynamicField
          v-for="(question, qIndex) in section.questions"
          :key="question.id"
          v-model="answers[question.id]"
          :question="question"
          :spaced="qIndex > 0"
          :has-error="Boolean(fieldErrors[question.id])"
          :error-message="t('assessmentFieldRequired')"
        />
      </AccordionSection>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AccordionSection from './AccordionSection.vue'
import AssessmentDynamicField from 'components/AssessmentDynamicField.vue'
import AssessmentPatientMeasurements
  from 'components/AssessmentPatientMeasurements.vue'
import { assessmentStatuses, quasarNotifyTypes } from 'components/constants.js'
import {
  answersArrayFromMap,
  validateRequiredAnswers,
} from 'src/utils/assessment-answers.js'
import {
  calculateAssessmentBmi,
  formatAssessmentBmiDisplay,
  measurementsToFormValues,
  validateAssessmentMeasurements,
} from 'src/utils/assessment-measurements.js'
import {
  completePatientAssessment,
  saveAssessmentDraft,
} from 'src/utils/assessment-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { assessmentTestIds as tid } from 'src/test-ids/index.js'
import { useValidationSaveFeedback } from
  'src/composables/useValidationSaveFeedback.js'

const props = defineProps({
  patientId: {
    type: [String, Number],
    required: true,
  },
  assessment: {
    type: Object,
    required: true,
  },
  template: {
    type: Object,
    required: true,
  },
  initialAnswers: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['back', 'saved'])

const { t } = useI18n()
const $q = useQuasar()
const { notifyAndScrollToValidationErrors } = useValidationSaveFeedback()

const answers = reactive({ ...props.initialAnswers })
const measurements = reactive(measurementsToFormValues(props.assessment))
const fieldErrors = reactive({})
const measurementErrors = reactive({})
const saving = ref(false)
const saveMode = ref('')
const sectionExpanded = reactive({})

watch(
  () => props.assessment,
  next => {
    const values = measurementsToFormValues(next)
    measurements.weight = values.weight
    measurements.height = values.height
  },
  { deep: true },
)

const bmiDisplay = computed(() => {
  const bmi = calculateAssessmentBmi(
    measurements.weight,
    measurements.height,
  )

  return formatAssessmentBmiDisplay(bmi)
})

watch(
  () => props.template?.sections,
  sections => {
    for (const section of sections ?? []) {
      if (sectionExpanded[section.id] === undefined) {
        sectionExpanded[section.id] = true
      }
    }
  },
  { immediate: true },
)

const isCompleted = computed(
  () => props.assessment?.status === assessmentStatuses.completed,
)

const statusLabel = computed(() => {
  const status = props.assessment?.status
  if (status === assessmentStatuses.completed) {
    return t('assessmentStatusCompleted')
  }
  if (status === assessmentStatuses.cancelled) {
    return t('assessmentStatusCancelled')
  }

  return t('assessmentStatusDraft')
})

function buildSavePayload() {
  return {
    answers: answersArrayFromMap(answers),
    weight: measurements.weight,
    height: measurements.height,
  }
}

function clearMeasurementErrors() {
  Object.keys(measurementErrors).forEach(key => {
    delete measurementErrors[key]
  })
}

function validateMeasurementsBeforeSave() {
  clearMeasurementErrors()
  const errors = validateAssessmentMeasurements(
    measurements,
    t,
  )
  Object.assign(measurementErrors, errors)

  return Object.keys(errors).length === 0
}

async function onSaveDraft() {
  if (!validateMeasurementsBeforeSave()) {
    await notifyAndScrollToValidationErrors(null)

    return
  }
  saving.value = true
  saveMode.value = 'draft'
  Object.keys(fieldErrors).forEach(key => {
    delete fieldErrors[key]
  })
  try {
    const result = await saveAssessmentDraft(
      props.patientId,
      props.assessment.id,
      buildSavePayload(),
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('assessmentDraftSaved'),
      position: 'top',
    })
    emit('saved', {
      status: assessmentStatuses.draft,
      bmi: result?.bmi,
    })
  } catch (error) {
    if (error?.code === 'MEASUREMENT_VALIDATION' && error?.field) {
      measurementErrors[error.field] = error?.message
    }
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: error?.message || t('assessmentSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
    saveMode.value = ''
  }
}

async function onComplete() {
  if (!validateMeasurementsBeforeSave()) {
    await notifyAndScrollToValidationErrors(null)

    return
  }
  Object.keys(fieldErrors).forEach(key => {
    delete fieldErrors[key]
  })
  const errors = validateRequiredAnswers(props.template, answers)
  Object.assign(fieldErrors, errors)
  if (Object.keys(errors).length) {
    await notifyAndScrollToValidationErrors(null)

    return
  }
  saving.value = true
  saveMode.value = 'complete'
  try {
    const result = await completePatientAssessment(
      props.patientId,
      props.assessment.id,
      buildSavePayload(),
    )
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('assessmentCompleted'),
      position: 'top',
    })
    emit('saved', {
      status: assessmentStatuses.completed,
      bmi: result?.bmi,
    })
  } catch (error) {
    if (error?.validationErrors) {
      Object.assign(fieldErrors, error.validationErrors)
    }
    if (error?.code === 'MEASUREMENT_VALIDATION' && error?.field) {
      measurementErrors[error.field] = error?.message
    }
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: error?.message || t('assessmentSaveError'),
        position: 'top',
      })
    }
  } finally {
    saving.value = false
    saveMode.value = ''
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.assessment-editor__title {
  margin: 0 0 6px;
  font-size: 1.125rem;
  font-weight: 700;
  color: $text-strong;
}

.assessment-editor__meta {
  flex-wrap: wrap;
}

.assessment-status-badge {
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
