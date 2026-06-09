<template>
  <div class="add-client-assessments-tab">
    <div v-if="!hasPatientId" class="assessment-panel q-pa-lg text-center">
      <q-icon name="info" size="md" color="grey-7" class="q-mb-sm" />
      <p class="text-body1 text-grey-8 q-mb-none">
        {{ t('assessmentSaveClientFirst') }}
      </p>
    </div>

    <template v-else>
      <AssessmentEditor
        v-if="view === 'editor' && editorState"
        :patient-id="patientId"
        :assessment="editorState.assessment"
        :template="editorState.template"
        :initial-answers="editorState.answers"
        @back="closeEditor"
        @saved="onEditorSaved"
      />

      <template v-else>
        <div class="row items-center justify-between q-mb-md">
          <div>
            <h2 class="assessment-panel__title q-mb-xs">
              {{ t('assessmentsTitle') }}
            </h2>
            <p class="assessment-panel__subtitle text-body2 text-grey-7">
              {{ t('assessmentsSubtitle') }}
            </p>
          </div>
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            icon="add"
            :loading="creating"
            :disable="loading"
            :data-testid="tid.btn('new')"
            :label="t('assessmentNew')"
            @click="openNewDialog"
          />
        </div>

        <div
          v-if="loading"
          class="assessment-panel q-pa-xl flex flex-center">
          <q-spinner color="primary" size="32px" />
        </div>

        <div
          v-else-if="!assessments.length"
          class="assessment-panel q-pa-xl text-center">
          <q-icon name="assignment" size="md" color="grey-6" />
          <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
            {{ t('assessmentListEmpty') }}
          </p>
        </div>

        <div
          v-else
          class="assessment-panel">
          <div class="add-client-form__fmh-table-wrap">
            <table class="add-client-form__fmh-table">
              <thead>
                <tr>
                  <th>{{ t('assessmentTemplateColumn') }}</th>
                  <th>{{ t('assessmentDateColumn') }}</th>
                  <th>{{ t('status') }}</th>
                  <th class="add-client-form__fmh-table-actions-col">
                    {{ t('actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in assessments"
                  :key="row.id">
                  <td>{{ row.templateName || '—' }}</td>
                  <td>{{ row.assessmentDate || '—' }}</td>
                  <td>
                    <span
                      class="assessment-status-badge"
                      :class="`assessment-status-badge--${row.status}`">
                      {{ assessmentStatusLabel(row.status) }}
                    </span>
                  </td>
                  <td class="add-client-form__fmh-table-actions">
                    <q-btn
                      flat
                      round
                      size="sm"
                      class="app-btn-icon-action"
                      icon="edit"
                      color="primary"
                      :data-testid="tid.rowEdit(row.id)"
                      :aria-label="t('edit')"
                      @click="openAssessment(row.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <q-dialog v-model="newDialogOpen" persistent>
      <q-card class="assessment-new-dialog" style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">{{ t('assessmentNew') }}</div>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('assessmentNewHint') }}
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none q-gutter-y-md">
          <AddClientLabeledField
            :label="t('assessmentTemplate')"
            required
            :test-id="tid.field('template')">
            <FormSelect
              v-model="newForm.templateId"
              outlined
              hide-bottom-space
              emit-value
              map-options
              class="full-width"
              :loading="templatesLoading"
              :options="templateOptions"
              :test-id="tid.field('template')"
            />
          </AddClientLabeledField>
          <AddClientLabeledField
            :label="t('assessmentDate')"
            required
            :test-id="tid.field('assessmentDate')">
            <ClientDateField
              v-model="newForm.assessmentDate"
              :max-today="true"
              :test-id="tid.field('assessmentDate')"
            />
          </AddClientLabeledField>
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn
            no-caps
            flat
            :label="t('cancel')"
            @click="newDialogOpen = false"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="creating"
            :disable="!newForm.templateId || !newForm.assessmentDate"
            :label="t('assessmentCreateDraft')"
            :data-testid="tid.btn('create-draft')"
            @click="createDraft"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AssessmentEditor from 'components/AssessmentEditor.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import ClientDateField from 'components/ClientDateField.vue'
import { assessmentStatuses, quasarNotifyTypes } from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { answersMapFromArray } from 'src/utils/assessment-answers.js'
import {
  createPatientAssessment,
  fetchAssessmentTemplates,
  fetchPatientAssessment,
  listPatientAssessments,
} from 'src/utils/assessment-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { assessmentTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  patientId: {
    type: [String, Number],
    default: null,
  },
})

const { t } = useI18n()
const $q = useQuasar()

const loading = ref(false)
const templatesLoading = ref(false)
const creating = ref(false)
const view = ref('list')
const assessments = ref([])
const templates = ref([])
const newDialogOpen = ref(false)
const editorState = ref(null)

const newForm = ref({
  templateId: null,
  assessmentDate: todayDateUs(),
})

const hasPatientId = computed(() => {
  const id = String(props.patientId ?? '').trim()

  return Boolean(id)
})

const patientId = computed(() => String(props.patientId ?? '').trim())

const templateOptions = computed(() =>
  templates.value.map(item => ({
    label: item.name,
    value: item.id,
  })),
)

function assessmentStatusLabel(status) {
  if (status === assessmentStatuses.completed) {
    return t('assessmentStatusCompleted')
  }
  if (status === assessmentStatuses.cancelled) {
    return t('assessmentStatusCancelled')
  }

  return t('assessmentStatusDraft')
}

async function loadTemplates() {
  templatesLoading.value = true
  try {
    templates.value = await fetchAssessmentTemplates()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('assessmentTemplatesError'),
        position: 'top',
      })
    }
  } finally {
    templatesLoading.value = false
  }
}

async function loadAssessments() {
  if (!hasPatientId.value) {
    return
  }
  loading.value = true
  try {
    assessments.value = await listPatientAssessments(patientId.value)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('assessmentListError'),
        position: 'top',
      })
    }
  } finally {
    loading.value = false
  }
}

function openNewDialog() {
  newForm.value = {
    templateId: null,
    assessmentDate: todayDateUs(),
  }
  newDialogOpen.value = true
  if (!templates.value.length) {
    loadTemplates()
  }
}

async function createDraft() {
  if (!newForm.value.templateId || !newForm.value.assessmentDate) {
    return
  }
  creating.value = true
  try {
    const result = await createPatientAssessment(patientId.value, {
      templateId: newForm.value.templateId,
      assessmentDate: newForm.value.assessmentDate,
      assignedClinicianId: null,
    })
    newDialogOpen.value = false
    await loadAssessments()
    await openAssessment(result.assessmentId)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: error?.message || t('assessmentCreateError'),
        position: 'top',
      })
    }
  } finally {
    creating.value = false
  }
}

async function openAssessment(assessmentId) {
  loading.value = true
  try {
    const detail = await fetchPatientAssessment(
      patientId.value,
      assessmentId,
    )
    editorState.value = {
      assessment: detail.assessment,
      template: detail.template,
      answers: answersMapFromArray(detail.answers),
    }
    view.value = 'editor'
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('assessmentLoadError'),
        position: 'top',
      })
    }
  } finally {
    loading.value = false
  }
}

function closeEditor() {
  view.value = 'list'
  editorState.value = null
  loadAssessments()
}

async function onEditorSaved(payload) {
  await loadAssessments()
  if (payload?.status === assessmentStatuses.completed) {
    closeEditor()

    return
  }
  if (editorState.value?.assessment?.id) {
    await openAssessment(editorState.value.assessment.id)
  }
}

onMounted(() => {
  loadTemplates()
  loadAssessments()
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.assessment-panel {
  background: $surface;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.assessment-panel__title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: $text-strong;
}

.assessment-panel__subtitle {
  margin: 0;
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
