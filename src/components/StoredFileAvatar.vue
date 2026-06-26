<template>
  <div
    class="stored-file-avatar"
    :class="{ 'stored-file-avatar--loading': loading }">
    <q-spinner
      v-if="loading"
      color="primary"
      :size="spinnerSize"
    />
    <img
      v-else-if="previewSrc"
      :src="previewSrc"
      alt=""
      class="stored-file-avatar__image"
    />
    <slot v-else name="placeholder">
      <ClientOverviewProfileAvatarPlaceholder />
    </slot>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
import ClientOverviewProfileAvatarPlaceholder from
  'components/client-overview/ClientOverviewProfileAvatarPlaceholder.vue'
import { useStoredFilePreview } from
  'src/composables/useStoredFilePreview.js'

const props = defineProps({
  fileId: {
    type: [Number, String],
    default: null,
  },
  spinnerSize: {
    type: String,
    default: '28px',
  },
})

const fileIdRef = toRef(props, 'fileId')
const { previewSrc, loading } = useStoredFilePreview(fileIdRef)
</script>
