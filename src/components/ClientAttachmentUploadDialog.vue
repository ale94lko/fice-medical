<template>
  <q-dialog
    v-model="open"
    persistent
    :data-testid="modalTestIds.dialog(tid.uploadDialog)"
    transition-show="scale"
    transition-hide="scale">
    <q-card class="insurance-dialog app-dialog-card">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('clientAttachmentUploadTitle') }}
      </AppDialogHeader>
      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ t('clientAttachmentUploadHint') }}
        </p>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <FormField
              required
              :label="t('clientAttachmentFile')">
              <q-file
                v-model="file"
                outlined
                dense
                clearable
                :accept="acceptAttr"
                :max-file-size="storedFileMaxBytes"
                :data-testid="tid.uploadFile"
                @rejected="onRejected"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField
              required
              :label="t('clientAttachmentDocumentName')">
              <TextInput
                v-model="documentName"
                outlined
                dense
                hide-bottom-space
                :test-id="tid.uploadName"
                :maxlength="200"
              />
            </FormField>
          </div>
          <div class="col-12 col-md-6">
            <FormField
              required
              :label="t('clientAttachmentCategory')">
              <FormSelect
                v-model="category"
                outlined
                dense
                emit-value
                map-options
                :options="categoryOptions"
                :test-id="tid.uploadCategory"
              />
            </FormField>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="app-dialog-card__actions">
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="modalTestIds.cancel(tid.uploadDialog)"
          :label="t('cancel')"
          :disable="saving"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :data-testid="tid.uploadSubmit"
          :label="t('clientAttachmentUploadSubmit')"
          :loading="saving"
          :disable="!canSubmit"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormField from 'components/FormField.vue'
import FormSelect from 'components/FormSelect.vue'
import TextInput from 'components/TextInput.vue'
import {
  storedFileCategories,
  storedFileExtensions,
  storedFileMaxBytes,
  storedFileMimeTypes,
} from 'components/constants.js'
import { clientAttachmentsTestIds as tid, modalTestIds } from
  'src/test-ids/index.js'
import {
  CLIENT_ATTACHMENT_UPLOAD_CATEGORIES,
  clientFileCategoryI18nKey,
} from 'src/utils/client-files-i18n.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const { t, te } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const file = ref(null)
const documentName = ref('')
const category = ref(storedFileCategories.clinicalDocument)

const acceptAttr = computed(() =>
  [
    ...storedFileMimeTypes,
    ...storedFileExtensions.map(ext => `.${ext}`),
  ].join(','),
)

const categoryOptions = computed(() =>
  CLIENT_ATTACHMENT_UPLOAD_CATEGORIES.map(value => {
    const key = clientFileCategoryI18nKey(value)

    return {
      label: te(key) ? t(key) : value,
      value,
    }
  }),
)

const canSubmit = computed(() => {
  if (!(file.value instanceof Blob)) {
    return false
  }
  if (!String(documentName.value ?? '').trim()) {
    return false
  }
  if (!category.value) {
    return false
  }

  return true
})

watch(open, value => {
  if (!value) {
    return
  }
  file.value = null
  documentName.value = ''
  category.value = storedFileCategories.clinicalDocument
})

watch(file, value => {
  if (!(value instanceof File)) {
    return
  }
  if (!String(documentName.value ?? '').trim()) {
    documentName.value = value.name || ''
  }
})

function onRejected() {
  // Parent shows toast on submit; q-file also blocks oversized files.
}

function onCancel() {
  open.value = false
}

function onSubmit() {
  if (!canSubmit.value) {
    return
  }
  const name = String(documentName.value ?? '').trim()
  const source = file.value
  const renamed = source instanceof File
    ? new File([source], name, {
      type: source.type,
      lastModified: source.lastModified,
    })
    : source

  emit('submit', {
    file: renamed,
    category: category.value,
    documentName: name,
  })
}
</script>
