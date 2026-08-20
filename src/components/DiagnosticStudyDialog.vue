<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="tid.dialog(mode)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p
          v-if="dialogSubtitle"
          class="text-body2 text-grey-7 q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div
          v-if="showIdentity"
          class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="biotech"
            :title="t('dsSectionStudy')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                required
                :label="t('dsStudyName')"
                :test-id="tid.field('study-name')">
                <q-input
                  v-model="local.studyName"
                  outlined
                  hide-bottom-space
                  :readonly="readonly || identityLocked"
                  :placeholder="t('dsStudyNamePlaceholder')"
                  :error="Boolean(errors.studyName)"
                  :error-message="errors.studyName"
                  :data-testid="tid.field('study-name')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showType"
              class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('dsStudyType')"
                :test-id="tid.field('study-type')">
                <FormSelect
                  v-model="local.studyType"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                  :readonly="readonly || identityLocked"
                  :options="typeOptions"
                  :placeholder="t('dsStudyTypePlaceholder')"
                  :test-id="tid.field('study-type')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showReason"
              class="col-12">
              <AddClientLabeledField
                :label="t('dsReason')"
                :test-id="tid.field('reason')">
                <q-input
                  v-model="local.reasonIndication"
                  outlined
                  type="textarea"
                  rows="3"
                  counter
                  maxlength="2000"
                  hide-bottom-space
                  :readonly="readonly || identityLocked"
                  :placeholder="t('dsReasonPlaceholder')"
                  :data-testid="tid.field('reason')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showStudyDate"
              class="col-12 col-md-6">
              <AddClientLabeledField
                :required="studyDateRequired"
                :label="t('dsStudyDate')"
                :test-id="tid.field('study-date')">
                <ClientDateField
                  v-model="local.studyDate"
                  :readonly="readonly"
                  :error="Boolean(errors.studyDate)"
                  :error-message="errors.studyDate"
                  :close-label="t('close')"
                  :test-id="tid.field('study-date')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showResultDate"
              class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('dsResultDate')"
                :test-id="tid.field('result-date')">
                <ClientDateField
                  v-model="local.resultDate"
                  :readonly="readonly"
                  :close-label="t('close')"
                  :test-id="tid.field('result-date')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showFindings"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="description"
            :title="t('dsSectionFindings')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :required="findingsRequired"
                :label="t('dsFindings')"
                :test-id="tid.field('findings')">
                <q-input
                  v-model="local.findings"
                  outlined
                  type="textarea"
                  rows="4"
                  counter
                  maxlength="4000"
                  hide-bottom-space
                  :readonly="findingsLocked"
                  :placeholder="t('dsFindingsPlaceholder')"
                  :error="Boolean(errors.findings)"
                  :error-message="errors.findings"
                  :data-testid="tid.field('findings')"
                />
              </AddClientLabeledField>
            </div>
            <div
              v-if="showInterpretation"
              class="col-12">
              <AddClientLabeledField
                :label="t('dsInterpretation')"
                :test-id="tid.field('interpretation')">
                <q-input
                  v-model="local.providerInterpretation"
                  outlined
                  type="textarea"
                  rows="4"
                  counter
                  maxlength="4000"
                  hide-bottom-space
                  :readonly="readonly"
                  :placeholder="t('dsInterpretationPlaceholder')"
                  :data-testid="tid.field('interpretation')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showDocument"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="attach_file"
            :title="t('dsSectionDocument')"
          />
          <div class="q-mt-md">
            <q-file
              v-if="!readonly"
              v-model="pendingFile"
              outlined
              dense
              clearable
              :max-files="1"
              :label="t('dsDocumentBrowse')"
              :data-testid="tid.field('source-document')"
            />
            <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
              {{ documentStatus }}
            </p>
          </div>
        </div>

        <div
          v-if="showMarkReviewed"
          class="q-mt-lg">
          <FormToggle
            v-model="local.markAsReviewed"
            :label="t('dsMarkAsReviewed')"
            :test-id="tid.field('mark-reviewed')"
          />
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          v-if="readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('close')"
          :data-testid="tid.btn('close')"
          @click="onCancel"
        />
        <template v-else>
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :disable="saving"
            :label="t('cancel')"
            :data-testid="tid.btn('cancel')"
            @click="onCancel"
          />
          <q-btn
            v-if="showSaveAndAdd"
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :disable="saving"
            :label="t('dsSaveAndAddAnother')"
            :data-testid="tid.btn('save-another')"
            @click="onSave(true)"
          />
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :label="primaryLabel"
            :data-testid="tid.btn('save')"
            @click="onSave(false)"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from
  'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import {
  diagnosticStudyDialogModes as modes,
  diagnosticStudyTypes,
} from 'components/constants.js'
import { diagnosticStudyTestIds as tid } from
  'src/test-ids/index.js'
import { diagnosticStudyI18nKey } from
  'src/utils/diagnostic-study-i18n.js'
import {
  cloneDiagnosticStudy,
  emptyDiagnosticStudyDraft,
} from 'src/utils/diagnostic-study-orders.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: modes.order,
  },
  study: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const { t } = useI18n()
const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = reactive(emptyDiagnosticStudyDraft(modes.order))
const errors = reactive({
  studyName: '',
  studyDate: '',
  findings: '',
})
const pendingFile = ref(null)

const readonly = computed(() => props.mode === modes.view)
const identityLocked = computed(() =>
  [
    modes.complete,
    modes.result,
    modes.review,
  ].includes(props.mode),
)
const findingsLocked = computed(() =>
  readonly.value || props.mode === modes.review,
)

const showIdentity = computed(() => true)
const showType = computed(() =>
  [modes.order, modes.existing, modes.edit, modes.view]
    .includes(props.mode),
)
const showReason = computed(() =>
  [modes.order, modes.edit, modes.view].includes(props.mode),
)
const showStudyDate = computed(() =>
  [
    modes.existing,
    modes.complete,
    modes.result,
    modes.edit,
    modes.view,
  ].includes(props.mode),
)
const studyDateRequired = computed(() =>
  props.mode === modes.complete,
)
const showResultDate = computed(() =>
  [modes.existing, modes.result, modes.edit, modes.view]
    .includes(props.mode),
)
const showFindings = computed(() =>
  [
    modes.existing,
    modes.result,
    modes.review,
    modes.edit,
    modes.view,
  ].includes(props.mode),
)
const showInterpretation = computed(() =>
  [
    modes.existing,
    modes.review,
    modes.edit,
    modes.view,
  ].includes(props.mode),
)
const showDocument = computed(() =>
  [modes.existing, modes.result, modes.edit, modes.view]
    .includes(props.mode),
)
const showMarkReviewed = computed(() =>
  props.mode === modes.existing && !readonly.value,
)
const findingsRequired = computed(() =>
  [modes.existing, modes.result].includes(props.mode),
)
const showSaveAndAdd = computed(() =>
  [modes.order, modes.existing].includes(props.mode),
)

const typeOptions = computed(() =>
  Object.values(diagnosticStudyTypes).map(value => ({
    label: t(diagnosticStudyI18nKey('dsType', value)),
    value,
  })),
)

const dialogTitle = computed(() => {
  if (props.mode === modes.existing) {
    return t('dsExistingTitle')
  }
  if (props.mode === modes.complete) {
    return t('dsCompleteTitle')
  }
  if (props.mode === modes.result) {
    return t('dsResultTitle')
  }
  if (props.mode === modes.review) {
    return t('dsReviewTitle')
  }
  if (props.mode === modes.view) {
    return t('dsViewTitle')
  }
  if (props.mode === modes.edit) {
    return t('dsEditTitle')
  }

  return t('dsOrderTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === modes.existing) {
    return t('dsExistingSubtitle')
  }
  if (props.mode === modes.order) {
    return t('dsOrderSubtitle')
  }

  return ''
})

const primaryLabel = computed(() => {
  if (props.mode === modes.complete) {
    return t('dsActionComplete')
  }
  if (props.mode === modes.result) {
    return t('dsActionAddResult')
  }
  if (props.mode === modes.review) {
    return t('dsActionReview')
  }
  if (props.mode === modes.existing) {
    return t('dsSaveStudy')
  }

  return t('dsSaveStudy')
})

const documentStatus = computed(() => {
  if (pendingFile.value?.name) {
    return pendingFile.value.name
  }
  if (local.sourceDocumentName) {
    return local.sourceDocumentName
  }

  return t('dsNoDocumentSelected')
})

function resetErrors() {
  errors.studyName = ''
  errors.studyDate = ''
  errors.findings = ''
}

function syncLocal() {
  resetErrors()
  pendingFile.value = null
  const source = props.study
    ? cloneDiagnosticStudy(props.study)
    : emptyDiagnosticStudyDraft(props.mode)
  Object.assign(local, source)
  local.markAsReviewed = Boolean(props.study?.markAsReviewed)
}

watch(
  () => [props.modelValue, props.mode, props.study],
  ([isOpen]) => {
    if (isOpen) {
      syncLocal()
    }
  },
)

function validate() {
  resetErrors()
  if ([modes.order, modes.existing, modes.edit].includes(props.mode)
    && !String(local.studyName ?? '').trim()) {
    errors.studyName = t('dsStudyNameRequired')
  }
  if (props.mode === modes.complete
    && !String(local.studyDate ?? '').trim()) {
    errors.studyDate = t('dsStudyDateRequired')
  }
  if ([modes.existing, modes.result].includes(props.mode)
    && !String(local.findings ?? '').trim()) {
    errors.findings = t('dsFindingsRequired')
  }

  return !errors.studyName && !errors.studyDate && !errors.findings
}

function onSave(addAnother) {
  if (!validate()) {
    return
  }
  emit('save', {
    draft: cloneDiagnosticStudy(local),
    addAnother: Boolean(addAnother),
    file: pendingFile.value || null,
  })
}

function onCancel() {
  emit('cancel')
  open.value = false
}
</script>
