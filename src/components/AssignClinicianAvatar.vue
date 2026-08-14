<template>
  <div
    class="assign-clinicians-dialog__avatar"
    :class="{
      'assign-clinicians-dialog__avatar--photo': hasPhoto,
    }">
    <StoredFileAvatar
      v-if="hasPhoto"
      :file-id="item.photoFileId"
      spinner-size="16px"
    />
    <span v-else>{{ item.initials || '?' }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const hasPhoto = computed(() => {
  const id = Number(props.item?.photoFileId)

  return Number.isFinite(id) && id > 0
})
</script>
