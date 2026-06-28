<template>
  <div class="client-profile-photo-field">
    <div class="client-profile-photo-field__avatar-shell">
      <div
        class="client-profile-photo-field__avatar"
        role="img"
        :aria-label="t('clientOverviewProfilePhotoPlaceholder')">
        <q-spinner
          v-if="uploading"
          class="client-profile-photo-field__spinner"
          color="primary"
          size="28px"
        />
        <img
          v-else-if="previewSrc"
          :src="previewSrc"
          alt=""
          class="client-profile-photo-field__image"
        />
        <ClientOverviewProfileAvatarPlaceholder
          v-else
          class="client-profile-photo-field__placeholder"
        />
      </div>
    </div>
    <button
      type="button"
      class="client-profile-photo-field__camera-btn"
      :disabled="disabled || uploading"
      :data-testid="clientPageTestIds.profilePhotoCamera"
      :aria-label="t('clientProfilePhotoUpload')"
      @click="openPicker">
      <q-icon name="photo_camera" size="18px" />
    </button>
    <input
      ref="fileInputRef"
      type="file"
      class="client-profile-photo-field__input"
      accept="image/jpeg,image/png,image/webp,image/gif"
      capture="user"
      @change="onFileInput"
    />

    <ClientProfilePhotoCropDialog
      v-model="cropDialogOpen"
      :image-file="pendingCropFile"
      :saving="uploading"
      @confirm="onCropConfirm"
      @cancel="onCropCancel"
    />
  </div>
</template>

<script setup>
import { ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import ClientOverviewProfileAvatarPlaceholder from
  'components/client-overview/ClientOverviewProfileAvatarPlaceholder.vue'
import ClientProfilePhotoCropDialog from
  'components/ClientProfilePhotoCropDialog.vue'
import {
  clientProfilePhotoMaxBytes,
  clientProfilePhotoMimeTypes,
  quasarNotifyTypes,
  storedFileCategories,
} from 'components/constants.js'
import { useStoredFilePreview } from
  'src/composables/useStoredFilePreview.js'
import { uploadStoredFile } from 'src/utils/stored-file-api.js'
import { clientPageTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  fileId: {
    type: [Number, String],
    default: null,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  fileCategory: {
    type: String,
    default: () => storedFileCategories.clientProfile,
  },
})

const emit = defineEmits(['update:fileId'])

const { t } = useI18n()
const $q = useQuasar()
const fileInputRef = ref(null)
const uploading = ref(false)
const cropDialogOpen = ref(false)
const pendingCropFile = ref(null)

const fileIdRef = toRef(props, 'fileId')
const { previewSrc } = useStoredFilePreview(fileIdRef)

function openPicker() {
  if (props.disabled || uploading.value) {
    return
  }
  fileInputRef.value?.click()
}

function onFileInput(event) {
  const file = event.target?.files?.[0]
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  if (!file) {
    return
  }
  if (!clientProfilePhotoMimeTypes.includes(file.type)) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('clientProfilePhotoInvalidType'),
      position: 'top',
    })

    return
  }
  if (file.size > clientProfilePhotoMaxBytes) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('clientProfilePhotoTooLarge'),
      position: 'top',
    })

    return
  }

  pendingCropFile.value = file
  cropDialogOpen.value = true
}

function onCropCancel() {
  pendingCropFile.value = null
}

async function onCropConfirm(file) {
  uploading.value = true
  try {
    const clientId = String(props.clientId ?? '').trim()
    const uploaded = await uploadStoredFile(
      file,
      props.fileCategory,
      clientId ? { clientId } : {},
    )
    emit('update:fileId', uploaded.id)
    cropDialogOpen.value = false
    pendingCropFile.value = null
  } catch (error) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: String(
        error?.response?.data?.message
        ?? error?.message
        ?? t('clientProfilePhotoUploadError'),
      ),
      position: 'top',
    })
  } finally {
    uploading.value = false
  }
}
</script>
