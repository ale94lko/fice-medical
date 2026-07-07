<template>
  <div class="my-profile-quick-actions">
    <div class="my-profile-quick-actions__list">
      <button
        type="button"
        class="my-profile-quick-actions__item"
        :data-testid="myProfileTestIds.changePassword"
        @click="emit('change-password')">
        <span class="my-profile-quick-actions__icon">
          <q-icon name="lock_reset" size="20px" />
        </span>
        <span class="my-profile-quick-actions__text">
          <p class="my-profile-quick-actions__title">
            {{ t('changePassword') }}
          </p>
          <p class="my-profile-quick-actions__subtitle">
            {{ t('myProfileQuickChangePasswordHint') }}
          </p>
        </span>
        <q-icon
          name="chevron_right"
          size="20px"
          class="my-profile-quick-actions__chevron"
        />
      </button>

      <GenerateDocumentAction
        v-if="userId"
        :document-type="documentTypes.userProfile"
        :context="{ userId }"
        flat
        button-class="my-profile-quick-actions__item"
        icon=""
        :label="''">
        <template #trigger="{ open }">
          <button
            type="button"
            class="my-profile-quick-actions__item"
            @click="open">
            <span class="my-profile-quick-actions__icon">
              <q-icon name="description" size="20px" />
            </span>
            <span class="my-profile-quick-actions__text">
              <p class="my-profile-quick-actions__title">
                {{ t('generateDocumentAction') }}
              </p>
              <p class="my-profile-quick-actions__subtitle">
                {{ t('myProfileQuickDownloadDataHint') }}
              </p>
            </span>
            <q-icon
              name="chevron_right"
              size="20px"
              class="my-profile-quick-actions__chevron"
            />
          </button>
        </template>
      </GenerateDocumentAction>

      <button
        type="button"
        class="my-profile-quick-actions__item"
        disabled>
        <span class="my-profile-quick-actions__icon">
          <q-icon name="verified_user" size="20px" />
        </span>
        <span class="my-profile-quick-actions__text">
          <p class="my-profile-quick-actions__title">
            {{ t('myProfileQuickTwoFactor') }}
          </p>
          <p class="my-profile-quick-actions__subtitle">
            {{ t('myProfileQuickTwoFactorHint') }}
          </p>
        </span>
        <q-icon
          name="chevron_right"
          size="20px"
          class="my-profile-quick-actions__chevron"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import GenerateDocumentAction from
  'components/documents/GenerateDocumentAction.vue'
import { documentTypes } from 'src/utils/document-generation-constants.js'
import { myProfileTestIds } from 'src/test-ids/index.js'

defineProps({
  userId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['change-password'])

const { t } = useI18n()
</script>
