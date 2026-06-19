<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog clinical-note-dialog app-dialog-card">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ dialogSubtitle }}
        </p>

        <div class="insurance-dialog__card-section">
          <SubsectionHeading
            icon="info"
            :title="t('clinicalNoteSectionGeneral')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('clinicalNoteDateTime')"
                required
                :test-id="tid.field('date-time')">
                <div
                  class="row q-col-gutter-sm
                    clinical-note-dialog__datetime-row">
                  <div class="col-6">
                    <ClientDateField
                      v-model="local.noteDate"
                      class="clinical-note-dialog__datetime-input"
                      :readonly="readonly"
                      :max-today="true"
                      :close-label="t('close')"
                      :error="Boolean(errors.noteDate)"
                      :error-message="errors.noteDate"
                      :test-id="tid.field('date')"
                    />
                  </div>
                  <div class="col-6">
                    <q-input
                      v-model="local.noteTime"
                      outlined
                      hide-bottom-space
                      class="clinical-note-dialog__datetime-input"
                      :readonly="readonly"
                      :data-testid="tid.field('time')"
                      :placeholder="t('clinicalNoteTimePlaceholder')"
                      :error="Boolean(errors.noteTime)"
                      :error-message="errors.noteTime"
                      @blur="normalizeNoteTime"
                    >
                      <template v-if="!readonly" #append>
                        <q-icon
                          name="schedule"
                          color="primary"
                          class="cursor-pointer">
                          <q-popup-proxy
                            cover
                            transition-show="scale"
                            transition-hide="scale">
                            <q-time
                              v-model="timePickerValue"
                              mask="h:mm A"
                              format12h
                              @update:model-value="onTimePickerChange">
                              <div class="row items-center justify-end">
                                <q-btn
                                  v-close-popup
                                  no-caps
                                  flat
                                  color="primary"
                                  :label="t('close')"
                                />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </AddClientLabeledField>
            </div>
            <div class="col-12 col-md-6">
              <AddClientLabeledField
                :label="t('clinicalNoteClinician')"
                required
                :test-id="tid.field('clinician')">
                <FormSelect
                  v-model="local.clinicianId"
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  :readonly="readonly"
                  :options="clinicianOptions"
                  :placeholder="t('clinicalNoteClinicianPlaceholder')"
                  :error="Boolean(errors.clinicianId)"
                  :error-message="errors.clinicianId"
                  :test-id="tid.field('clinician')"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="description"
            :title="t('clinicalNoteSectionContent')"
          />
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <AddClientLabeledField
                :label="t('clinicalNoteSubjective')"
                required
                :test-id="tid.field('subjective')">
                <q-input
                  v-model="local.subjective"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="clinicalNoteSoapMaxLength"
                  :placeholder="t('clinicalNoteSubjectivePlaceholder')"
                  :error="Boolean(errors.subjective)"
                  :error-message="errors.subjective"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('clinicalNoteObjective')"
                required
                :test-id="tid.field('objective')">
                <q-input
                  v-model="local.objective"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="clinicalNoteSoapMaxLength"
                  :placeholder="t('clinicalNoteObjectivePlaceholder')"
                  :error="Boolean(errors.objective)"
                  :error-message="errors.objective"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('clinicalNoteAssessment')"
                required
                :test-id="tid.field('assessment')">
                <q-input
                  v-model="local.assessment"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="clinicalNoteSoapMaxLength"
                  :placeholder="t('clinicalNoteAssessmentPlaceholder')"
                  :error="Boolean(errors.assessment)"
                  :error-message="errors.assessment"
                />
              </AddClientLabeledField>
            </div>
            <div class="col-12">
              <AddClientLabeledField
                :label="t('clinicalNotePlan')"
                required
                :test-id="tid.field('plan')">
                <q-input
                  v-model="local.plan"
                  outlined
                  hide-bottom-space
                  type="textarea"
                  autogrow
                  counter
                  :readonly="readonly"
                  :maxlength="clinicalNoteSoapMaxLength"
                  :placeholder="t('clinicalNotePlanPlaceholder')"
                  :error="Boolean(errors.plan)"
                  :error-message="errors.plan"
                />
              </AddClientLabeledField>
            </div>
          </div>
        </div>

        <div
          v-if="showSignatureSection"
          class="insurance-dialog__card-section q-mt-lg">
          <SubsectionHeading
            icon="draw"
            :title="t('clinicalNoteSectionSignature')"
          />
          <SignatureCanvas
            ref="signatureCanvasRef"
            v-model="local.signatureData"
            :readonly="readonly"
            class="q-mt-md"
          />
          <p
            v-if="errors.signatureData"
            class="text-negative text-caption q-mt-xs q-mb-none">
            {{ errors.signatureData }}
          </p>
          <p
            v-if="local.isSigned && local.signedAt"
            class="text-caption text-grey-7 q-mt-sm q-mb-none">
            {{ t('clinicalNoteSignedAt', {
              date: formatSignedDate(local.signedAt),
            }) }}
          </p>
          <template v-if="!readonly">
            <p class="text-caption text-grey-7 q-mt-md q-mb-none">
              {{ t('clinicalNoteDraftHint') }}
            </p>
            <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
              {{ t('clinicalNoteSignedRestrictionHint') }}
            </p>
          </template>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="readonly ? t('close') : t('cancel')"
          @click="onCancel"
        />
        <template v-if="!readonly">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :loading="saving"
            :data-testid="tid.btn('save-draft')"
            :label="t('clinicalNoteSaveDraft')"
            @click="onSaveDraft"
          />
          <q-btn
            v-if="canSign"
            no-caps
            unelevated
            color="primary"
            class="app-btn-primary"
            :loading="saving"
            :data-testid="tid.btn('sign')"
            :label="t('clinicalNoteSign')"
            @click="requestSign"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <ModalComponent
    v-model="signConfirmOpen"
    :title="t('clinicalNoteSignConfirmTitle')"
    :message="t('clinicalNoteSignConfirmMessage')"
    :confirm-text="t('clinicalNoteSign')"
    :cancel-text="t('cancel')"
    test-id="clinical-note-sign"
    @confirm="onSignConfirmed"
  />
</template>

<script setup>
import {
  computed,
  nextTick,
  reactive,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import {
  clinicalNoteSoapMaxLength,
} from 'components/constants.js'
import {
  clinicalNoteHasCompleteSoap,
  createEmptyClinicalNote,
  prepareClinicalNoteForSave,
} from 'src/utils/clinical-note-orders.js'
import {
  isClinicalNoteDateTimeAfterNow,
  isClinicalNoteDateTimeBeforeAdmission,
  isValidClinicalNoteDateTime,
  normalizeClinicalNoteTime,
} from 'src/utils/clinical-note-datetime.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  note: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'add',
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  admissionDate: {
    type: String,
    default: '',
  },
  canSign: {
    type: Boolean,
    default: true,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'save-draft',
  'sign',
  'cancel',
])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = ref(createEmptyClinicalNote())
const errors = reactive({})
const signatureCanvasRef = ref(null)
const signConfirmOpen = ref(false)

const readonly = computed(() =>
  props.mode === 'view' || local.value.isSigned,
)

const dialogTitle = computed(() => {
  if (props.mode === 'view') {
    return t('clinicalNoteViewTitle')
  }
  if (props.mode === 'edit') {
    return t('clinicalNoteEditTitle')
  }

  return t('clinicalNoteAddTitle')
})

const dialogSubtitle = computed(() => {
  if (props.mode === 'view') {
    return t('clinicalNoteViewSubtitle')
  }

  return t('clinicalNoteAddSubtitle')
})

const showSignatureSection = computed(
  () => props.mode !== 'view'
    || local.value.isSigned
    || Boolean(local.value.signatureData),
)

const timePickerValue = computed({
  get: () => local.value.noteTime,
  set: value => {
    local.value.noteTime = value
  },
})

watch(
  () => [props.modelValue, props.note],
  async([visible, note]) => {
    if (!visible) {
      return
    }
    local.value = note
      ? prepareClinicalNoteForSave(note)
      : createEmptyClinicalNote()
    Object.keys(errors).forEach(key => {
      delete errors[key]
    })
    await nextTick()
    signatureCanvasRef.value?.resize?.()
  },
  { immediate: true },
)

function formatSignedDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime())
    ? raw
    : date.toLocaleString()
}

function normalizeNoteTime() {
  local.value.noteTime = normalizeClinicalNoteTime(local.value.noteTime)
}

function onTimePickerChange(value) {
  local.value.noteTime = value
}

function clearErrors() {
  Object.keys(errors).forEach(key => {
    delete errors[key]
  })
}

function validateDateTime({ requiredForSign = false } = {}) {
  if (!isValidClinicalNoteDateTime(
    local.value.noteDate,
    local.value.noteTime,
  )) {
    if (!local.value.noteDate) {
      errors.noteDate = t('clinicalNoteDateRequired')
    }
    if (!local.value.noteTime) {
      errors.noteTime = t('clinicalNoteTimeRequired')
    }

    return false
  }
  if (isClinicalNoteDateTimeAfterNow(
    local.value.noteDate,
    local.value.noteTime,
  )) {
    errors.noteDate = t('clinicalNoteDateNotFuture')

    return false
  }
  if (isClinicalNoteDateTimeBeforeAdmission(
    local.value.noteDate,
    local.value.noteTime,
    props.admissionDate,
  )) {
    errors.noteDate = t('clinicalNoteDateBeforeAdmission')

    return false
  }
  if (requiredForSign && !local.value.noteDate) {
    errors.noteDate = t('clinicalNoteDateRequired')

    return false
  }

  return true
}

function validateDraft() {
  clearErrors()
  let valid = true
  if (local.value.clinicianId == null || local.value.clinicianId === '') {
    errors.clinicianId = t('clinicalNoteClinicianRequired')
    valid = false
  }
  if (!validateDateTime()) {
    valid = false
  }

  return valid
}

function validateSign() {
  clearErrors()
  let valid = validateDraft()
  if (!clinicalNoteHasCompleteSoap(local.value)) {
    if (!String(local.value.subjective ?? '').trim()) {
      errors.subjective = t('clinicalNoteSubjectiveRequired')
    }
    if (!String(local.value.objective ?? '').trim()) {
      errors.objective = t('clinicalNoteObjectiveRequired')
    }
    if (!String(local.value.assessment ?? '').trim()) {
      errors.assessment = t('clinicalNoteAssessmentRequired')
    }
    if (!String(local.value.plan ?? '').trim()) {
      errors.plan = t('clinicalNotePlanRequired')
    }
    valid = false
  }
  signatureCanvasRef.value?.flush?.()
  if (!String(local.value.signatureData ?? '').trim()) {
    errors.signatureData = t('clinicalNoteSignatureRequired')
    valid = false
  }

  return valid
}

function buildPayload() {
  return prepareClinicalNoteForSave(local.value, {
    noteDate: local.value.noteDate,
    noteTime: local.value.noteTime,
  })
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function onSaveDraft() {
  if (!validateDraft()) {
    return
  }
  emit('save-draft', buildPayload())
}

function requestSign() {
  if (!validateSign()) {
    return
  }
  signConfirmOpen.value = true
}

function onSignConfirmed() {
  signConfirmOpen.value = false
  emit('sign', buildPayload())
}
</script>

<style lang="scss" scoped>
.clinical-note-dialog__datetime-row {
  width: 100%;
}

.clinical-note-dialog__datetime-input {
  width: 100%;
}
</style>
