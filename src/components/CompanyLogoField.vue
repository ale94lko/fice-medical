<template>
  <div class="company-logo-field">
    <div class="company-logo-field__preview" aria-hidden="true">
      <q-spinner
        v-if="uploading || previewLoading"
        class="company-logo-field__spinner"
        color="primary"
        size="28px"
      />
      <img
        v-else-if="previewSrc"
        :src="previewSrc"
        alt=""
        class="company-logo-field__image"
      />
      <div
        v-else
        class="company-logo-field__placeholder">
        <q-icon name="apartment" size="36px" color="grey-6" />
      </div>
    </div>

    <div
      v-if="!disabled"
      class="company-logo-field__actions row q-gutter-sm items-center">
      <q-btn
        no-caps
        outline
        dense
        color="primary"
        class="app-btn-outline"
        icon="upload"
        :disable="uploading"
        :loading="uploading"
        :label="hasFile
          ? t('subtenantLogoReplace')
          : t('subtenantLogoUpload')"
        :data-testid="testId"
        @click="openPicker"
      />
    </div>

    <input
      ref="fileInputRef"
      type="file"
      class="company-logo-field__input"
      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
      @change="onFileInput"
    />
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clientProfilePhotoMaxBytes,
  quasarNotifyTypes,
  storedFileCategories,
} from 'components/constants.js'
import { useStoredFilePreview } from
  'src/composables/useStoredFilePreview.js'
import { uploadStoredFile } from 'src/utils/stored-file-api.js'

const COMPANY_LOGO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]

const props = defineProps({
  fileId: {
    type: [Number, String],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  fileCategory: {
    type: String,
    default: () => storedFileCategories.companyLogo,
  },
  testId: {
    type: String,
    default: 'company-logo-upload',
  },
})

const emit = defineEmits(['update:fileId'])

const { t } = useI18n()
const $q = useQuasar()
const fileInputRef = ref(null)
const uploading = ref(false)

const fileIdRef = toRef(props, 'fileId')
const { previewSrc, loading: previewLoading } = useStoredFilePreview(
  fileIdRef,
)

const hasFile = computed(() => {
  const id = Number(props.fileId)

  return Number.isFinite(id) && id > 0
})

function openPicker() {
  if (props.disabled || uploading.value) {
    return
  }
  fileInputRef.value?.click()
}

async function uploadLogo(file) {
  if (!COMPANY_LOGO_MIME_TYPES.includes(file.type)) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('subtenantLogoInvalidType'),
      position: 'top',
    })

    return
  }
  if (file.size > clientProfilePhotoMaxBytes) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('subtenantLogoTooLarge'),
      position: 'top',
    })

    return
  }

  uploading.value = true
  try {
    const uploaded = await uploadStoredFile(file, props.fileCategory)
    emit('update:fileId', uploaded.id)
  } catch (error) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(
        error?.response?.data?.message
        ?? error?.message
        ?? t('subtenantLogoUploadError'),
      ),
      position: 'top',
    })
  } finally {
    uploading.value = false
  }
}

function onFileInput(event) {
  const file = event.target?.files?.[0]
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  if (!file) {
    return
  }
  void uploadLogo(file)
}
</script>

<style lang="scss" scoped>
.company-logo-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.company-logo-field__preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 96px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.company-logo-field__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  padding: 8px;
}

.company-logo-field__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-logo-field__spinner {
  position: absolute;
}

.company-logo-field__input {
  display: none;
}
</style>
