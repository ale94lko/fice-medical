<template>
  <section
    class="my-profile-summary"
    :data-testid="myProfileTestIds.summary">
    <div class="my-profile-summary__layout">
      <div class="my-profile-summary__avatar-wrap">
        <div class="my-profile-summary__avatar">
          <StoredFileAvatar
            v-if="hasPhoto"
            :file-id="profile.photoFileId"
            spinner-size="28px"
          />
          <span
            v-else-if="profile.initials"
            class="my-profile-summary__avatar-initials">
            {{ profile.initials }}
          </span>
          <q-icon
            v-else
            name="person"
            size="42px"
            color="primary"
          />
        </div>
      </div>

      <div class="my-profile-summary__identity">
        <h2 class="my-profile-summary__name">
          {{ profile.displayName }}
        </h2>
        <p
          v-if="profile.position !== '—'"
          class="my-profile-summary__position">
          {{ profile.position }}
        </p>
        <div class="my-profile-summary__contact-list">
          <div
            v-if="profile.email !== '—'"
            class="my-profile-summary__contact-item">
            <q-icon name="mail_outline" size="18px" />
            <span class="my-profile-summary__contact-text">
              {{ profile.email }}
            </span>
          </div>
          <div
            v-if="profile.phone !== '—'"
            class="my-profile-summary__contact-item">
            <q-icon name="phone" size="18px" />
            <span class="my-profile-summary__contact-text">
              {{ profile.phone }}
            </span>
          </div>
        </div>
      </div>

      <div class="my-profile-summary__meta-list">
        <div class="my-profile-summary__meta-item">
          <span class="my-profile-summary__meta-icon">
            <q-icon name="business" size="18px" />
          </span>
          <div>
            <p class="my-profile-summary__meta-label">
              {{ t('myProfileFieldClinic') }}
            </p>
            <p class="my-profile-summary__meta-value">
              {{ profile.clinicName }}
            </p>
          </div>
        </div>
        <div class="my-profile-summary__meta-item">
          <span class="my-profile-summary__meta-icon">
            <q-icon name="shield" size="18px" />
          </span>
          <div>
            <p class="my-profile-summary__meta-label">
              {{ t('myProfileFieldSystemRole') }}
            </p>
            <p class="my-profile-summary__meta-value">
              {{ profile.systemRole }}
            </p>
          </div>
        </div>
        <div class="my-profile-summary__meta-item">
          <span class="my-profile-summary__meta-icon">
            <q-icon name="event" size="18px" />
          </span>
          <div>
            <p class="my-profile-summary__meta-label">
              {{ t('myProfileFieldMemberSince') }}
            </p>
            <p class="my-profile-summary__meta-value">
              {{ profile.memberSince }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import { myProfileTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()

const hasPhoto = computed(() => {
  const id = Number(props.profile?.photoFileId)

  return Number.isFinite(id) && id > 0
})
</script>
