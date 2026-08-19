<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog clinical-note-dialog app-dialog-card">
      <AppDialogHeader
        test-id="clinical-note"
        :close-label="t('close')"
        :info="dialogSubtitle"
        @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
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
                  <div :class="isMobile ? 'col-12' : 'col-6'">
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
                  <div :class="isMobile ? 'col-12' : 'col-6'">
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
                                  :data-testid="tid.btn('time-close')"
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
                <ClinicianFormSelect
                  v-model="local.clinicianId"
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
          <div
            class="clinical-note-dialog__signature-header
              row items-center no-wrap">
            <SubsectionHeading
              class="col"
              icon="draw"
              :title="t('clinicalNoteSectionSignature')"
            />
            <q-btn
              v-if="isMobile && !readonly"
              no-caps
              :outline="Boolean(local.signatureData)"
              :flat="!local.signatureData"
              :color="local.signatureData ? 'primary' : 'grey-5'"
              class="app-btn-outline signature-canvas__clear
                clinical-note-dialog__clear-signature"
              :class="{
                'clinical-note-dialog__clear-signature--idle':
                  !local.signatureData,
              }"
              icon="restart_alt"
              :data-testid="signatureCanvasTestIds.clear"
              :disable="!local.signatureData"
              :label="t('carePlanSignatureClear')"
              @click="clearSignaturePad"
            />
          </div>
          <SignatureCanvas
            ref="signatureCanvasRef"
            v-model="local.signatureData"
            :readonly="readonly"
            :show-clear="!isMobile"
            :hint="t('clinicalNoteSignatureHint')"
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

        <ClinicalNoteAddendaSection
          v-if="readonly && local.isSigned"
          :addenda="local.addenda"
          :can-add="canSign"
          :adding="saving"
          @add="emit('add-addendum')"
        />
      </q-card-section>

      <q-card-actions
        align="right"
        class="app-dialog-card__actions"
        :class="{
          'clinical-note-dialog__actions--mobile':
            isMobile && !readonly,
        }">
        <template v-if="isMobile && !readonly">
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
          <q-btn
            v-else
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :loading="saving"
            :data-testid="tid.btn('save-draft')"
            :label="t('clinicalNoteSaveDraft')"
            @click="onSaveDraft"
          />
          <AdminListPageActions
            :compact="true"
            :actions="mobileOverflowActions"
            :menu-test-id="tid.btn('actions-menu')"
          />
        </template>
        <template v-else>
          <q-btn
            no-caps
            flat
            class="app-btn-outline"
            :label="readonly ? t('close') : t('cancel')"
            :data-testid="readonly ? tid.btn('close') : tid.btn('cancel')"
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
import AdminListPageActions from
  'components/admin-table/AdminListPageActions.vue'
import ClientDateField from 'components/ClientDateField.vue'
import ClinicalNoteAddendaSection from
  'components/ClinicalNoteAddendaSection.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
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
import { formatDateTime } from 'src/utils/app-datetime.js'
import { clinicalNoteTestIds as tid, signatureCanvasTestIds } from
  'src/test-ids/index.js'
import { useViewportLayout } from
  'src/composables/useViewportLayout.js'
import { resolveDefaultResponsibleClinicianOption } from
  'src/utils/care-plan-orders.js'
import { useAuthStore } from 'src/stores/auth-store.js'

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
  'add-addendum',
  'cancel',
])

const { t } = useI18n()
const { isMobile } = useViewportLayout()
const authStore = useAuthStore()

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

function applyDefaultClinician() {
  if (props.mode !== 'add' || local.value.clinicianId) {
    return
  }
  const option = resolveDefaultResponsibleClinicianOption(
    props.clinicianOptions,
    { staffMember: authStore.userInfo?.staffMember ?? null },
  )
  if (!option) {
    return
  }
  local.value.clinicianId = option.value
}

watch(
  () => [props.modelValue, props.note, props.mode],
  async([visible, note]) => {
    if (!visible) {
      return
    }
    local.value = note
      ? prepareClinicalNoteForSave(note)
      : createEmptyClinicalNote()
    applyDefaultClinician()
    Object.keys(errors).forEach(key => {
      delete errors[key]
    })
    await nextTick()
    signatureCanvasRef.value?.resize?.()
  },
  { immediate: true },
)

watch(
  () => props.clinicianOptions,
  () => {
    if (!open.value) {
      return
    }
    applyDefaultClinician()
  },
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

function formatSignedDate(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '—'
  }

  return formatDateTime(raw) || raw
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

function clearSignaturePad() {
  signatureCanvasRef.value?.clear()
}

function onSaveDraft() {
  if (!validateDraft()) {
    return
  }
  emit('save-draft', buildPayload())
}

const mobileOverflowActions = computed(() => {
  const actions = [
    {
      key: 'cancel',
      label: t('cancel'),
      icon: 'close',
      testId: tid.btn('cancel'),
      onClick: onCancel,
    },
  ]
  if (props.canSign) {
    actions.push({
      key: 'saveDraft',
      label: t('clinicalNoteSaveDraft'),
      icon: 'save',
      testId: tid.btn('save-draft'),
      disable: props.saving,
      onClick: onSaveDraft,
    })
  }

  return actions
})

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
@import 'src/css/quasar.variables';

.clinical-note-dialog__datetime-row {
  width: 100%;
}

.clinical-note-dialog__datetime-input {
  width: 100%;
}

.clinical-note-dialog__actions--mobile {
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 8px;
}

.clinical-note-dialog__signature-header {
  gap: 8px;

  .subsection-heading {
    min-width: 0;
  }
}

.clinical-note-dialog__clear-signature {
  flex: 0 0 auto;
  transition: opacity 0.15s ease, color 0.15s ease,
    border-color 0.15s ease, background-color 0.15s ease;

  &--idle,
  &.disabled,
  &[disabled] {
    opacity: 0.38;
    color: $text-muted !important;
    border-color: transparent !important;
    background: transparent !important;
  }
}
</style>
