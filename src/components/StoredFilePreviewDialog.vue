<template>
  <q-dialog
    v-model="open"
    :data-testid="modalTestIds.dialog(photoPreviewTestIds.dialog)"
    transition-show="scale"
    transition-hide="scale">
    <div class="photo-preview-dialog">
      <q-btn
        flat
        round
        dense
        icon="close"
        class="photo-preview-dialog__close"
        :aria-label="t('close')"
        :data-testid="modalTestIds.cancel(photoPreviewTestIds.dialog)"
        @click="onClose"
      />
      <div
        v-if="loading"
        class="photo-preview-dialog__status">
        <q-spinner color="white" size="32px" />
      </div>
      <p
        v-else-if="error"
        class="photo-preview-dialog__error">
        {{ error }}
      </p>
      <img
        v-else-if="displaySrc"
        :src="displaySrc"
        class="photo-preview-dialog__image"
        :alt="altText"
        :data-testid="photoPreviewTestIds.image"
      />
    </div>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { modalTestIds, photoPreviewTestIds } from
  'src/test-ids/index.js'
import {
  fetchStoredFileBlob,
  revokeStoredFileImageSrc,
} from 'src/utils/stored-file-api.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  fileId: {
    type: [Number, String],
    default: null,
  },
  src: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loading = ref(false)
const error = ref('')
const blobUrl = ref('')
let ownsBlob = false

const altText = computed(() =>
  String(props.title ?? '').trim() || t('photoPreviewTitle'),
)

const displaySrc = computed(() =>
  String(props.src ?? '').trim() || blobUrl.value,
)

function parseFileId(value) {
  const id = Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

function clearOwnedBlob() {
  if (ownsBlob && blobUrl.value) {
    revokeStoredFileImageSrc(blobUrl.value)
  }
  blobUrl.value = ''
  ownsBlob = false
}

async function loadPreview() {
  error.value = ''
  if (String(props.src ?? '').trim()) {
    clearOwnedBlob()

    return
  }
  const fileId = parseFileId(props.fileId)
  if (fileId == null) {
    clearOwnedBlob()

    return
  }
  loading.value = true
  clearOwnedBlob()
  try {
    const blob = await fetchStoredFileBlob(fileId, true)
    blobUrl.value = URL.createObjectURL(blob)
    ownsBlob = true
  } catch (err) {
    if (!isAuthSessionEndUIError(err)) {
      error.value = t('photoPreviewError')
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [open.value, props.fileId, props.src],
  ([isOpen]) => {
    if (isOpen) {
      void loadPreview()

      return
    }
    clearOwnedBlob()
    error.value = ''
  },
)

function onClose() {
  open.value = false
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.photo-preview-dialog {
  position: relative;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.photo-preview-dialog__close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 36px;
  height: 36px;
  background: $surface !important;
  color: $text-strong !important;
  box-shadow: $shadow-sm;
}

.photo-preview-dialog__image {
  display: block;
  width: min(72vw, 72vh, 440px);
  height: min(72vw, 72vh, 440px);
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  box-shadow: $shadow-md;
}

.photo-preview-dialog__status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(72vw, 72vh, 440px);
  height: min(72vw, 72vh, 440px);
}

.photo-preview-dialog__error {
  margin: 0;
  max-width: 280px;
  color: $white;
  text-align: center;
}
</style>
