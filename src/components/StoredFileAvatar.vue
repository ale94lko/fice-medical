<template>
  <div
    class="stored-file-avatar"
    :class="{
      'stored-file-avatar--loading': loading,
      'stored-file-avatar--previewable': canPreview,
    }">
    <q-spinner
      v-if="loading"
      color="primary"
      :size="spinnerSize"
    />
    <button
      v-else-if="canPreview"
      type="button"
      class="stored-file-avatar__preview-btn"
      :aria-label="previewAriaLabel"
      :data-testid="previewTriggerTestId"
      @click.stop="previewOpen = true">
      <img
        :src="previewSrc"
        alt=""
        class="stored-file-avatar__image"
      />
      <span
        class="stored-file-avatar__zoom"
        aria-hidden="true">
        <q-icon name="zoom_in" size="22px" />
      </span>
    </button>
    <img
      v-else-if="previewSrc"
      :src="previewSrc"
      alt=""
      class="stored-file-avatar__image"
    />
    <slot v-else name="placeholder">
      <ClientOverviewProfileAvatarPlaceholder />
    </slot>
    <StoredFilePreviewDialog
      v-if="previewable"
      v-model="previewOpen"
      :file-id="fileId"
      :src="previewSrc"
      :title="previewTitle"
    />
  </div>
</template>

<script setup>
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import ClientOverviewProfileAvatarPlaceholder from
  'components/client-overview/ClientOverviewProfileAvatarPlaceholder.vue'
import StoredFilePreviewDialog from
  'components/StoredFilePreviewDialog.vue'
import { useStoredFilePreview } from
  'src/composables/useStoredFilePreview.js'
import { photoPreviewTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  fileId: {
    type: [Number, String],
    default: null,
  },
  spinnerSize: {
    type: String,
    default: '28px',
  },
  previewable: {
    type: Boolean,
    default: false,
  },
  previewTitle: {
    type: String,
    default: '',
  },
  previewLabel: {
    type: String,
    default: '',
  },
  previewTestId: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
const fileIdRef = toRef(props, 'fileId')
const { previewSrc, loading } = useStoredFilePreview(fileIdRef)
const previewOpen = ref(false)

const canPreview = computed(() =>
  props.previewable && Boolean(previewSrc.value),
)

const previewAriaLabel = computed(() =>
  String(props.previewLabel ?? '').trim() || t('photoPreviewAria'),
)

const previewTriggerTestId = computed(() =>
  String(props.previewTestId ?? '').trim()
  || photoPreviewTestIds.trigger,
)
</script>
