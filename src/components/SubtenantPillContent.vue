<template>
  <span class="app-subtenant__icon-badge" aria-hidden="true">
    <StoredFileAvatar
      v-if="hasPhoto"
      :file-id="photoFileId"
      spinner-size="14px"
      class="app-subtenant__logo">
      <template #placeholder>
        <q-icon name="corporate_fare" size="18px" />
      </template>
    </StoredFileAvatar>
    <q-icon
      v-else
      name="corporate_fare"
      size="18px"
    />
  </span>
  <span class="app-subtenant__name">{{ name }}</span>
  <q-icon
    v-if="showChevron"
    class="app-subtenant__chevron"
    name="expand_more"
    size="20px"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  photoFileId: {
    type: [Number, String],
    default: null,
  },
  showChevron: {
    type: Boolean,
    default: false,
  },
})

const hasPhoto = computed(() => {
  const id = Number(props.photoFileId)

  return Number.isFinite(id) && id > 0
})
</script>
