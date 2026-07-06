<template>
  <div class="admin-table-user-identity">
    <div
      class="admin-table-user-identity__avatar"
      aria-hidden="true">
      <StoredFileAvatar
        v-if="hasPhoto"
        :file-id="photoFileId"
        spinner-size="16px">
        <template #placeholder>
          <span
            class="admin-table-user-identity__initials"
            :style="avatarStyle">
            {{ initials }}
          </span>
        </template>
      </StoredFileAvatar>
      <span
        v-else
        class="admin-table-user-identity__initials"
        :style="avatarStyle">
        {{ initials }}
      </span>
    </div>
    <div class="admin-table-user-identity__text">
      <button
        v-if="clickable"
        type="button"
        class="admin-table-user-identity__name admin-data-table__link"
        :data-testid="nameTestId"
        @click="emit('open')">
        <AdminTableSearchHighlight
          :text="name || '—'"
          :query="highlightQuery"
        />
      </button>
      <p
        v-else
        class="admin-table-user-identity__name">
        <AdminTableSearchHighlight
          :text="name || '—'"
          :query="highlightQuery"
        />
      </p>
      <p class="admin-table-user-identity__email">
        <AdminTableSearchHighlight
          :text="email || '—'"
          :query="highlightQuery"
        />
      </p>
      <p
        v-if="caption"
        class="admin-table-user-identity__caption">
        {{ caption }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import AdminTableSearchHighlight from
  'components/admin-table/AdminTableSearchHighlight.vue'
import { resolveUserAvatarStyle } from 'src/utils/user-list-display.js'

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: '',
  },
  initials: {
    type: String,
    default: '?',
  },
  photoFileId: {
    type: [Number, String],
    default: null,
  },
  highlightQuery: {
    type: String,
    default: '',
  },
  clickable: {
    type: Boolean,
    default: true,
  },
  nameTestId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['open'])

const hasPhoto = computed(() => {
  const id = Number(props.photoFileId)

  return Number.isFinite(id) && id > 0
})

const avatarStyle = computed(() =>
  resolveUserAvatarStyle(props.name || props.email),
)
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.admin-table-user-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  &__avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;

    :deep(.stored-file-avatar) {
      width: 100%;
      height: 100%;
    }

    :deep(.stored-file-avatar__image) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
  }

  &__text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1.3;
    color: $text-strong;
    text-align: left;
  }

  &__email {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.35;
    color: $text-muted;
  }

  &__caption {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.3;
    color: $text-muted;
  }
}
</style>
