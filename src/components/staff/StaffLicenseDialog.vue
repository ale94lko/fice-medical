<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="family-medical-history-dialog app-dialog-card">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ dialogTitle }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('staffLicenseDialogSubtitle') }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseTypeLabel')"
              required>
              <TextInput
                v-model="local.type"
                :external-label="true"
                :disable="readonly"
                :error="Boolean(errors.type)"
                :error-message="errors.type"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseIdentifierLabel')"
              required>
              <TextInput
                v-model="local.identifier"
                :external-label="true"
                :disable="readonly"
                :error="Boolean(errors.identifier)"
                :error-message="errors.identifier"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField
              :label="t('staffLicenseExpirationLabel')"
              required>
              <ClientDateField
                v-model="local.expirationDate"
                :readonly="readonly"
                :close-label="t('close')"
                :error="Boolean(errors.expirationDate)"
                :error-message="errors.expirationDate"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12 col-md-6">
            <AddClientLabeledField :label="t('staffLicenseStatusLabel')">
              <FormSelect
                v-model="local.status"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :readonly="readonly"
                :options="statusOptions"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <FormToggle
              v-model="local.isPrimary"
              :disable="readonly"
              :label="t('staffLicensePrimaryLabel')"
            />
          </div>
          <div class="col-12">
            <InsuranceCardUploadField
              v-model="attachmentFile"
              :label="t('staffLicenseAttachmentLabel')"
              :readonly="readonly"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          v-if="!readonly"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="saving"
          :label="t('save')"
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
import AppDialogHeader from 'components/AppDialogHeader.vue'
import ClientDateField from 'components/ClientDateField.vue'
import FormSelect from 'components/FormSelect.vue'
import FormToggle from 'components/FormToggle.vue'
import InsuranceCardUploadField from 'components/InsuranceCardUploadField.vue'
import TextInput from 'components/TextInput.vue'
import { storedFileCategories } from 'components/constants.js'
import { createEmptyStaffLicense } from 'src/utils/staff-form.js'
import { uploadStoredFile } from 'src/utils/stored-file-api.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  license: {
    type: Object,
    default: null,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const local = ref(createEmptyStaffLicense())
const attachmentFile = ref(null)
const errors = ref({})
const saving = ref(false)

const dialogTitle = computed(() =>
  props.license?.id ? t('staffLicenseEditTitle') : t('staffLicenseAddTitle'),
)

const statusOptions = computed(() => [
  { label: t('active'), value: 'Active' },
  { label: t('staffLicenseStatusExpired'), value: 'Expired' },
  { label: t('pending'), value: 'Pending' },
])

watch(open, visible => {
  if (!visible) {
    return
  }
  local.value = {
    ...createEmptyStaffLicense(),
    ...(props.license ?? {}),
  }
  attachmentFile.value = null
  errors.value = {}
})

function onCancel() {
  open.value = false
}

function validate() {
  const next = {}
  if (!String(local.value.type ?? '').trim()) {
    next.type = t('staffLicenseTypeRequired')
  }
  if (!String(local.value.identifier ?? '').trim()) {
    next.identifier = t('staffLicenseIdentifierRequired')
  }
  if (!String(local.value.expirationDate ?? '').trim()) {
    next.expirationDate = t('staffLicenseExpirationRequired')
  }
  errors.value = next

  return Object.keys(next).length === 0
}

async function onSave() {
  if (!validate()) {
    return
  }
  saving.value = true
  try {
    let attachmentFileId = local.value.attachmentFileId ?? null
    if (attachmentFile.value?.file) {
      const uploaded = await uploadStoredFile(
        attachmentFile.value.file,
        storedFileCategories.clinicianProfile,
      )
      attachmentFileId = uploaded?.id ?? attachmentFileId
    }
    emit('save', {
      ...local.value,
      attachmentFileId,
    })
    open.value = false
  } finally {
    saving.value = false
  }
}
</script>
