<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog screening-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onClose">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        ref="dialogBodyScrollRef"
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <div v-if="loading" class="screening-dialog__loading">
          <AppBrandLoading inline />
        </div>

        <template v-else>
          <div class="screening-dialog__summary q-mb-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <AddClientLabeledField
                  :label="t('screeningTemplate')"
                  required
                  :test-id="tid.field('template')">
                  <FormSelect
                    v-model="headerForm.templateId"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    class="full-width"
                    :disable="!canEditTemplate"
                    :loading="templatesLoading"
                    :options="templateOptions"
                    :test-id="tid.field('template')"
                    @update:model-value="onTemplateSelected"
                  />
                </AddClientLabeledField>
              </div>
              <div class="col-12 col-md-4">
                <AddClientLabeledField
                  :label="t('assignedClinician')"
                  :test-id="tid.field('clinician')">
                  <FormSelect
                    v-model="headerForm.clinicianId"
                    outlined
                    hide-bottom-space
                    emit-value
                    map-options
                    clearable
                    class="full-width"
                    :disable="!canEditMeta"
                    :options="clinicianOptions"
                    :test-id="tid.field('clinician')"
                  />
                </AddClientLabeledField>
              </div>
              <div class="col-12 col-md-4">
                <AddClientLabeledField
                  :label="t('screeningDate')"
                  :test-id="tid.field('screeningDate')">
                  <ClientDateField
                    v-model="headerForm.screeningDate"
                    :readonly="!canEditMeta"
                    :max-today="true"
                    :test-id="tid.field('screeningDate')"
                  />
                </AddClientLabeledField>
              </div>
            </div>

            <div
              v-if="template"
              class="row q-col-gutter-md q-mt-md items-center">
              <div class="col-auto">
                <span
                  class="screening-status-badge"
                  :class="`screening-status-badge--${
                    screening.status || 'draft'
                  }`">
                  {{ ui.statusLabel }}
                </span>
              </div>
              <div class="col-12 col-md">
                <div class="screening-dialog__progress-label text-caption">
                  {{ completionLabel }}
                </div>
                <q-linear-progress
                  :value="ui.completionPercent / 100"
                  color="primary"
                  rounded
                  class="q-mt-xs"
                />
              </div>
              <div class="col-auto">
                <div
                  class="screening-dialog__metric
                    screening-dialog__metric--score">
                  <div class="screening-dialog__metric-label">
                    {{ t('screeningOverallScore') }}
                  </div>
                  <div class="screening-dialog__metric-value">
                    {{ scoreDisplay }}
                  </div>
                </div>
              </div>
              <div class="col-auto">
                <div
                  class="screening-dialog__metric"
                  :class="`screening-dialog__metric--risk-${
                    ui.riskLevel
                  }`">
                  <div class="screening-dialog__metric-label">
                    {{ t('screeningRiskLevel') }}
                  </div>
                  <div class="screening-dialog__metric-value row items-center">
                    <q-icon
                      v-if="ui.riskLevel !== 'low'"
                      name="warning"
                      size="16px"
                      class="q-mr-xs"
                    />
                    {{ riskLevelLabel }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="showRiskAlert"
            class="screening-dialog__risk-alert row items-center q-mb-md">
            <q-icon name="warning" size="20px" class="q-mr-sm" />
            <div class="col">
              <strong>{{ riskLevelLabel }}</strong>
              {{ t('screeningRiskAlertMessage') }}
            </div>
            <q-btn
              flat
              no-caps
              dense
              color="primary"
              :label="t('screeningViewGuidelines')"
            />
          </div>

          <div
            v-if="!template"
            class="screening-dialog__placeholder text-center q-pa-xl">
            <q-icon name="assignment" size="md" color="grey-6" />
            <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
              {{ t('screeningSelectTemplateHint') }}
            </p>
          </div>

          <div v-else class="row q-col-gutter-lg">
            <div class="col-12 col-lg-8">
              <ScreeningEditor
                embedded
                numbered-sections
                :editor-api="editor"
                :patient-id="patientId"
                :screening="screening"
                :template="template"
                :initial-answers="initialAnswers"
                :readonly="readonly"
                @saved="onEditorSaved"
              />
            </div>

            <div class="col-12 col-lg-4">
              <div class="screening-dialog__sidebar-card q-mb-md">
                <h3 class="screening-dialog__sidebar-title">
                  {{ t('screeningContentsTitle') }}
                </h3>
                <q-list dense class="screening-dialog__contents-list">
                  <q-item
                    v-for="(section, index) in ui.sectionStatuses"
                    :key="section.id"
                    clickable
                    @click="editor.scrollToSection(section.id)">
                    <q-item-section avatar>
                      <q-icon
                        :name="sectionStatusIcon(section.status)"
                        :class="`screening-dialog-section__status--${
                          section.status
                        }`"
                        size="18px"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ index + 1 }}. {{ section.title }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="screening-dialog__sidebar-card">
                <h3 class="screening-dialog__sidebar-title">
                  {{ t('screeningTemplateInfoTitle') }}
                </h3>
                <dl class="screening-dialog__info-list">
                  <div>
                    <dt>{{ t('screeningTemplate') }}</dt>
                    <dd>{{ template.name }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('screeningTemplateVersion') }}</dt>
                    <dd>{{ template.version ?? '—' }}</dd>
                  </div>
                  <div v-if="template.category">
                    <dt>{{ t('screeningTemplateCategory') }}</dt>
                    <dd>{{ template.category }}</dd>
                  </div>
                  <div v-if="template.description">
                    <dt>{{ t('description') }}</dt>
                    <dd>{{ template.description }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </template>
      </q-card-section>

      <q-card-actions
        v-if="template && !loading"
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onClose"
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
          :disable="ui.saving || !screening.id"
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
          :disable="ui.saving || !screening.id"
          :data-testid="tid.btn('complete')"
          :label="t('screeningComplete')"
          @click="editor.onComplete"
        />
        <q-btn
          v-else
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('close')"
          @click="onClose"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  computed,
  reactive,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import ClientDateField from 'components/ClientDateField.vue'
import ScreeningEditor from 'components/ScreeningEditor.vue'
import { screeningStatuses, quasarNotifyTypes } from 'components/constants.js'
import { todayDateUs } from 'src/utils/client-form.js'
import { answersMapFromArray } from 'src/utils/screening-answers.js'
import {
  createClientScreening,
  fetchClientScreening,
  fetchScreeningTemplateById,
  fetchScreeningTemplates,
  screeningApiErrorMessage,
} from 'src/utils/screening-api.js'
import {
  normalizeScreeningDetailFromRecord,
} from 'src/utils/screening-normalize.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { useScreeningEditor } from 'src/composables/useScreeningEditor.js'
import { useScreeningEditorUi } from 'src/composables/useScreeningEditorUi.js'
import { useSiteStore } from 'src/stores/site-store.js'
import { screeningTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  patientId: {
    type: [String, Number],
    required: true,
  },
  screeningId: {
    type: [String, Number],
    default: null,
  },
  clientScreenings: {
    type: Array,
    default: () => [],
  },
  mode: {
    type: String,
    default: 'create',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'saved', 'closed'])

const { t } = useI18n()
const $q = useQuasar()
const siteStore = useSiteStore()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loading = ref(false)
const templatesLoading = ref(false)
const creating = ref(false)
const templates = ref([])
const template = ref(null)
const initialAnswers = ref({})
const screening = reactive({
  id: '',
  templateId: '',
  templateName: '',
  status: screeningStatuses.draft,
  screeningDate: todayDateUs(),
  assignedClinicianId: null,
})

const headerForm = reactive({
  templateId: null,
  clinicianId: null,
  screeningDate: todayDateUs(),
})

const editor = useScreeningEditor(() => ({
  patientId: props.patientId,
  screening,
  template: template.value,
  initialAnswers: initialAnswers.value,
  readonly: props.readonly,
  onSaved: onEditorSaved,
}))

const ui = useScreeningEditorUi(editor)

const canEditTemplate = computed(
  () => !props.readonly && !screening.id,
)

const canEditMeta = computed(
  () => !props.readonly
    && screening.status === screeningStatuses.draft,
)

const dialogTitle = computed(() => {
  if (props.mode === 'create' && !screening.id) {
    return t('screeningNew')
  }

  return template.value?.name
    || screening.templateName
    || t('screeningsTitle')
})

const templateOptions = computed(() =>
  templates.value.map(item => ({
    label: item.name,
    value: item.id,
  })),
)

const completionLabel = computed(() =>
  t('screeningCompletionLabel', { percent: ui.completionPercent }),
)

const scoreDisplay = computed(() => {
  const { score, maxScore } = ui.scoreSummary
  if (!maxScore) {
    return '—'
  }

  return `${score} / ${maxScore}`
})

const riskLevelLabel = computed(() => {
  const labels = {
    low: t('screeningRiskLevelLow'),
    moderate: t('screeningRiskLevelModerate'),
    high: t('screeningRiskLevelHigh'),
    critical: t('screeningRiskLevelCritical'),
  }

  return labels[ui.riskLevel] ?? labels.low
})

const showRiskAlert = computed(
  () => ['moderate', 'high', 'critical'].includes(ui.riskLevel),
)

function sectionStatusIcon(status) {
  if (status === 'complete') {
    return 'check_circle'
  }
  if (status === 'warning' || status === 'in_progress') {
    return 'error_outline'
  }

  return 'radio_button_unchecked'
}

function findRawClientScreening(screeningId) {
  const id = String(screeningId ?? '').trim()
  if (!id) {
    return null
  }

  return props.clientScreenings.find(
    item => String(item?.id ?? '') === id,
  ) ?? null
}

function applyScreeningDetail(detail) {
  template.value = detail.template
  initialAnswers.value = answersMapFromArray(detail.answers)
  Object.assign(screening, detail.screening)
  headerForm.templateId = detail.screening.templateId
  headerForm.clinicianId = detail.screening.assignedClinicianId
  headerForm.screeningDate = detail.screening.screeningDate
    || todayDateUs()
}

function resetState() {
  template.value = null
  initialAnswers.value = {}
  Object.assign(screening, {
    id: '',
    templateId: '',
    templateName: '',
    status: screeningStatuses.draft,
    screeningDate: todayDateUs(),
    assignedClinicianId: null,
  })
  Object.assign(headerForm, {
    templateId: null,
    clinicianId: null,
    screeningDate: todayDateUs(),
  })
}

async function loadTemplates() {
  templatesLoading.value = true
  try {
    templates.value = await fetchScreeningTemplates()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningTemplatesError'),
        position: 'top',
      })
    }
  } finally {
    templatesLoading.value = false
  }
}

async function loadExistingScreening(screeningId) {
  const raw = findRawClientScreening(screeningId)
  if (raw?.template) {
    applyScreeningDetail(normalizeScreeningDetailFromRecord(raw))

    return
  }

  loading.value = true
  try {
    const detail = await fetchClientScreening(
      props.patientId,
      screeningId,
    )
    applyScreeningDetail(detail)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('screeningLoadError'),
        position: 'top',
      })
    }
    open.value = false
  } finally {
    loading.value = false
  }
}

async function loadScreeningFromClientAfterCreate(screeningId) {
  const client = await siteStore.fetchClientById(props.patientId)
  const raw = (client?.screenings ?? []).find(
    item => String(item?.id ?? '') === String(screeningId ?? ''),
  )
  if (raw?.template) {
    applyScreeningDetail(normalizeScreeningDetailFromRecord(raw))

    return true
  }

  const detail = await fetchClientScreening(
    props.patientId,
    screeningId,
  )
  applyScreeningDetail(detail)

  return true
}

async function ensureDraftCreated() {
  if (screening.id || creating.value || !headerForm.templateId) {
    return
  }
  creating.value = true
  try {
    const result = await createClientScreening(props.patientId, {
      templateId: headerForm.templateId,
      screeningDate: headerForm.screeningDate || null,
      assignedClinicianId: headerForm.clinicianId || null,
    })
    await loadScreeningFromClientAfterCreate(result.screeningId)
    emit('saved', { created: true })
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: error?.message || t('screeningCreateError'),
        position: 'top',
      })
    }
  } finally {
    creating.value = false
  }
}

async function onTemplateSelected(templateId) {
  if (!templateId) {
    template.value = null

    return
  }
  loading.value = true
  try {
    template.value = await fetchScreeningTemplateById(templateId)
    screening.templateId = templateId
    screening.templateName = template.value?.name ?? ''
    if (props.mode === 'create' && headerForm.screeningDate) {
      await ensureDraftCreated()
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: screeningApiErrorMessage(
          error,
          t('screeningTemplatesError'),
        ),
        position: 'top',
      })
    }
  } finally {
    loading.value = false
  }
}

function onEditorSaved(payload) {
  emit('saved', payload)
  if (
    payload?.status === screeningStatuses.completed
    || payload?.status === screeningStatuses.cancelled
  ) {
    onClose()
  }
}

function onClose() {
  open.value = false
  emit('closed')
}

watch(open, async isOpen => {
  if (!isOpen) {
    resetState()

    return
  }
  resetState()
  await loadTemplates()
  const id = String(props.screeningId ?? '').trim()
  if (id) {
    await loadExistingScreening(id)
  }
})

watch(
  () => headerForm.screeningDate,
  async value => {
    screening.screeningDate = value
    if (
      props.mode === 'create'
      && headerForm.templateId
      && value
      && !screening.id
    ) {
      await ensureDraftCreated()
    }
  },
)
</script>

<style lang="scss" scoped>
@import 'src/css/screening-dialog.scss';
</style>
