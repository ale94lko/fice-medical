<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="documentGenerationTestIds.dialog">
    <q-card class="insurance-dialog app-dialog-card generate-document-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="onCancel">
        {{ t('generateDocumentDialogTitle') }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('generateDocumentDialogSubtitle') }}
        </p>

        <div class="row q-col-gutter-md">
          <div class="col-12">
            <AddClientLabeledField
              :label="requiredLabel(t('generateDocumentFormatLabel'))"
              :test-id="documentGenerationTestIds.format">
              <FormSelect
                v-model="selectedFormat"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="formatOptions"
                :loading="typesLoading"
                :disable="typesLoading || !formatOptions.length"
                :placeholder="t('generateDocumentFormatPlaceholder')"
                :test-id="documentGenerationTestIds.format"
              />
            </AddClientLabeledField>
          </div>
          <div class="col-12">
            <AddClientLabeledField
              :label="t('generateDocumentLocaleLabel')"
              :test-id="documentGenerationTestIds.locale">
              <FormSelect
                v-model="selectedLocale"
                outlined
                hide-bottom-space
                emit-value
                map-options
                :options="localeOptions"
                :placeholder="t('generateDocumentLocalePlaceholder')"
                :test-id="documentGenerationTestIds.locale"
              />
            </AddClientLabeledField>
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
          :disable="generating"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="download"
          :loading="generating"
          :disable="!canSubmit"
          :label="t('generateDocumentAction')"
          :data-testid="documentGenerationTestIds.submit"
          @click="onGenerate"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import FormSelect from 'components/FormSelect.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  apiErrorMessage,
  generateDocument,
  getDocumentTypes,
} from 'src/utils/documents-api.js'
import {
  findDocumentTypeInfo,
  resolveDocumentLocale,
  validateDocumentGenerationContext,
} from 'src/utils/document-generation-payload.js'
import {
  downloadStoredFile,
  triggerBlobDownload,
} from 'src/utils/stored-file-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { documentGenerationTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  documentType: {
    type: String,
    required: true,
  },
  context: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'generated', 'cancel'])

const { t, locale } = useI18n()
const $q = useQuasar()

const typesLoading = ref(false)
const generating = ref(false)
const documentTypes = ref([])
const selectedFormat = ref('')
const selectedLocale = ref(resolveDocumentLocale(locale.value))

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const typeInfo = computed(() =>
  findDocumentTypeInfo(documentTypes.value, props.documentType),
)

const formatOptions = computed(() =>
  (typeInfo.value?.supportedFormats ?? []).map(format => ({
    label: format,
    value: format,
  })),
)

const localeOptions = computed(() => [
  { label: t('generateDocumentLocaleEs'), value: 'es' },
  { label: t('generateDocumentLocaleEn'), value: 'en' },
])

const canSubmit = computed(() =>
  Boolean(selectedFormat.value)
  && !typesLoading.value
  && !generating.value
  && validateDocumentGenerationContext(
    typeInfo.value,
    props.context,
    props.documentType,
  ).length === 0,
)

function requiredLabel(text) {
  return `${text} *`
}

async function loadDocumentTypes() {
  typesLoading.value = true
  try {
    documentTypes.value = await getDocumentTypes()
    const formats = typeInfo.value?.supportedFormats ?? []
    if (!formats.includes(selectedFormat.value)) {
      selectedFormat.value = formats.includes('PDF')
        ? 'PDF'
        : (formats[0] ?? '')
    }
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('generateDocumentTypesError'),
      })
    }
  } finally {
    typesLoading.value = false
  }
}

async function onGenerate() {
  const missing = validateDocumentGenerationContext(
    typeInfo.value,
    props.context,
    props.documentType,
  )
  if (missing.length) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('generateDocumentMissingFields'),
    })

    return
  }

  generating.value = true
  try {
    const file = await generateDocument({
      documentType: props.documentType,
      format: selectedFormat.value,
      locale: selectedLocale.value,
      context: props.context,
    })
    $q.notify({
      type: quasarNotifyTypes.positive,
      message: t('generateDocumentSuccess', {
        fileName: file.originalFilename || file.name || '',
      }),
    })
    if (file.id != null) {
      const { blob, fileName } = await downloadStoredFile(file.id)
      triggerBlobDownload(
        blob,
        fileName || file.originalFilename || file.name,
      )
    }
    emit('generated', file)
    open.value = false
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: apiErrorMessage(error) || t('generateDocumentError'),
      })
    }
  } finally {
    generating.value = false
  }
}

function onCancel() {
  emit('cancel')
  open.value = false
}

watch(
  () => [open.value, props.documentType],
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    selectedLocale.value = resolveDocumentLocale(locale.value)
    void loadDocumentTypes()
  },
  { immediate: true },
)
</script>
