<template>
  <div
    class="clinician-select-avatar"
    :class="{
      'clinician-select-avatar--photo': hasPhoto,
    }">
    <StoredFileAvatar
      v-if="hasPhoto"
      :file-id="photoFileId"
      spinner-size="16px">
      <template #placeholder>
        <q-icon
          name="person"
          size="18px"
          class="clinician-select-avatar__placeholder-icon"
        />
      </template>
    </StoredFileAvatar>
    <q-icon
      v-else
      name="person"
      size="18px"
      class="clinician-select-avatar__placeholder-icon"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'

const props = defineProps({
  photoFileId: {
    type: [Number, String],
    default: null,
  },
})

const hasPhoto = computed(() => {
  const id = Number(props.photoFileId)

  return Number.isFinite(id) && id > 0
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.clinician-select-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $grey-3;
  color: $grey-7;

  &--photo {
    background: transparent;
  }

  &__placeholder-icon {
    opacity: 0.72;
  }
}
</style>
