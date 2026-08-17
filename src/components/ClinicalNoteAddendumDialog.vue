<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        :info="t('clinicalNoteAddendumSubtitle')"
        @close="onCancel">
        {{ t('clinicalNoteAddendumTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clinicalNoteAddendumImmutableHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="t('clinicalNoteClinician')"
              required
              :test-id="tid.field('addendum-clinician')">
              <ClinicianFormSelect
                v-model="local.clinicianId"
                :options="clinicianOptions"
                :placeholder="t('clinicalNoteClinicianPlaceholder')"
                :error="Boolean(errors.clinicianId)"
                :error-message="errors.clinicianId"
                :test-id="tid.field('addendum-clinician')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('clinicalNoteAddendumBody')"
              required
              :test-id="tid.field('addendum-body')">
              <q-input
                v-model="local.body"
                outlined
                hide-bottom-space
                type="textarea"
                autogrow
                counter
                :maxlength="clinicalNoteSoapMaxLength"
                :placeholder="t('clinicalNoteAddendumBodyPlaceholder')"
                :error="Boolean(errors.body)"
                :error-message="errors.body"
                :data-testid="tid.field('addendum-body')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('clinicalNoteAddendumReason')"
              required
              :test-id="tid.field('addendum-reason')">
              <q-input
                v-model="local.reason"
                outlined
                hide-bottom-space
                :maxlength="255"
                :placeholder="t('clinicalNoteAddendumReasonPlaceholder')"
                :error="Boolean(errors.reason)"
                :error-message="errors.reason"
                :data-testid="tid.field('addendum-reason')"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <SubsectionHeading
              icon="draw"
              :title="t('clinicalNoteSectionSignature')"
            />
            <SignatureCanvas
              ref="signatureCanvasRef"
              v-model="local.signatureData"
              class="q-mt-md"
              :hint="t('clinicalNoteAddendumSignatureHint')"
            />
            <p
              v-if="errors.signatureData"
              class="text-negative text-caption q-mt-xs q-mb-none">
              {{ errors.signatureData }}
            </p>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :data-testid="tid.btn('sign-addendum')"
          :label="t('clinicalNoteAddendumSign')"
          @click="requestSign"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <ModalComponent
    v-model="signConfirmOpen"
    :title="t('clinicalNoteAddendumConfirmTitle')"
    :message="t('clinicalNoteAddendumConfirmMessage')"
    :confirm-text="t('clinicalNoteAddendumSign')"
    :cancel-text="t('cancel')"
    test-id="clinical-note-addendum-sign"
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
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClinicianFormSelect from 'components/ClinicianFormSelect.vue'
import ModalComponent from 'components/ModalComponent.vue'
import SignatureCanvas from 'components/SignatureCanvas.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import { clinicalNoteSoapMaxLength } from 'components/constants.js'
import { clinicalNoteTestIds as tid } from 'src/test-ids/index.js'
import { resolveDefaultResponsibleClinicianOption } from
  'src/utils/care-plan-orders.js'
import { useAuthStore } from 'src/stores/auth-store.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'sign',
  'cancel',
])

const { t } = useI18n()
const authStore = useAuthStore()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const local = ref(emptyAddendum())
const errors = reactive({})
const signatureCanvasRef = ref(null)
const signConfirmOpen = ref(false)

function emptyAddendum() {
  return {
    clinicianId: null,
    body: '',
    reason: '',
    signatureData: '',
  }
}

function applyDefaultClinician() {
  if (local.value.clinicianId) {
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

function clearErrors() {
  Object.keys(errors).forEach(key => {
    delete errors[key]
  })
}

watch(
  () => [props.modelValue, props.clinicianOptions],
  async([visible]) => {
    if (!visible) {
      return
    }
    local.value = emptyAddendum()
    applyDefaultClinician()
    clearErrors()
    await nextTick()
    signatureCanvasRef.value?.resize?.()
  },
  { immediate: true },
)

function validate() {
  clearErrors()
  let valid = true
  if (local.value.clinicianId == null || local.value.clinicianId === '') {
    errors.clinicianId = t('clinicalNoteClinicianRequired')
    valid = false
  }
  if (!String(local.value.body ?? '').trim()) {
    errors.body = t('clinicalNoteAddendumBodyRequired')
    valid = false
  }
  if (!String(local.value.reason ?? '').trim()) {
    errors.reason = t('clinicalNoteAddendumReasonRequired')
    valid = false
  }
  signatureCanvasRef.value?.flush?.()
  if (!String(local.value.signatureData ?? '').trim()) {
    errors.signatureData = t('clinicalNoteSignatureRequired')
    valid = false
  }

  return valid
}

function onCancel() {
  emit('cancel')
  open.value = false
}

function requestSign() {
  if (!validate()) {
    return
  }
  signConfirmOpen.value = true
}

function onSignConfirmed() {
  signConfirmOpen.value = false
  emit('sign', {
    clinicianId: local.value.clinicianId,
    body: String(local.value.body ?? '').trim(),
    reason: String(local.value.reason ?? '').trim(),
    signatureData: local.value.signatureData,
  })
}
</script>
