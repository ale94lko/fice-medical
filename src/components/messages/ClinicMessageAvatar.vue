<template>
  <div
    class="clinic-message-avatar"
    :class="[
      `clinic-message-avatar--${size}`,
      { 'clinic-message-avatar--photo': hasPhoto },
    ]"
    :aria-hidden="hasPhoto && previewable
      ? undefined
      : true"
    :title="name || undefined"
  >
    <StoredFileAvatar
      :file-id="fileId"
      :previewable="previewable && hasPhoto"
      :spinner-size="spinnerSize"
      :preview-label="previewLabel"
      :preview-test-id="previewTestId"
    >
      <template #placeholder>
        <ClientOverviewProfileAvatarPlaceholder />
      </template>
    </StoredFileAvatar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ClientOverviewProfileAvatarPlaceholder from
  'src/components/client-overview/ClientOverviewProfileAvatarPlaceholder.vue'
import StoredFileAvatar from
  'src/components/StoredFileAvatar.vue'

const spinnerBySize = {
  sm: '14px',
  md: '18px',
  lg: '28px',
}

const props = defineProps({
  name: { type: String, default: '' },
  initials: { type: String, default: '' },
  fileId: { type: [Number, String], default: null },
  previewable: { type: Boolean, default: false },
  previewLabel: { type: String, default: '' },
  previewTestId: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg'].includes(value),
  },
})

const hasPhoto = computed(() => {
  const id = Number(props.fileId)

  return Number.isFinite(id) && id > 0
})

const spinnerSize = computed(() =>
  spinnerBySize[props.size] || spinnerBySize.md,
)
</script>
