<template>
  <StoredFileAvatar
    v-if="hasPhoto"
    :file-id="photoFileId"
    spinner-size="18px">
    <template #placeholder>
      <q-icon
        name="person"
        :size="iconSize"
        class="header-user-avatar__placeholder-icon"
      />
    </template>
  </StoredFileAvatar>
  <q-icon
    v-else
    name="person"
    :size="iconSize"
    class="header-user-avatar__placeholder-icon"
  />
</template>

<script setup>
import { computed } from 'vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'

const props = defineProps({
  photoFileId: {
    type: [Number, String],
    default: null,
  },
  iconSize: {
    type: String,
    default: '22px',
  },
})

const hasPhoto = computed(() => {
  const id = Number(props.photoFileId)

  return Number.isFinite(id) && id > 0
})
</script>

<style lang="scss" scoped>
.header-user-avatar {
  &__placeholder-icon {
    opacity: 0.9;
  }
}
</style>
