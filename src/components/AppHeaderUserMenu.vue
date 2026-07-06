<template>
  <q-btn
    flat
    dense
    no-caps
    unelevated
    class="app-header-user-menu__trigger"
    :class="{
      'app-header-user-menu__trigger--staff': hasStaffProfile,
    }"
    :aria-label="menuAriaLabel"
    :data-testid="layoutTestIds.userMenu">
    <template v-if="hasStaffProfile">
      <span class="app-header-user-menu__trigger-inner">
        <span
          class="app-header-user-menu__avatar
            app-header-user-menu__avatar--sm"
          aria-hidden="true">
          <HeaderUserAvatar
            :photo-file-id="staffProfile.photoFileId"
            icon-size="20px"
          />
        </span>
        <span class="app-header-user-menu__trigger-text gt-xs">
          <span class="app-header-user-menu__name">
            {{ staffProfile.name }}
          </span>
          <span
            v-if="staffProfile.position"
            class="app-header-user-menu__position">
            {{ staffProfile.position }}
          </span>
        </span>
        <q-icon
          class="app-header-user-menu__chevron gt-xs"
          name="expand_more"
          size="20px"
          aria-hidden="true"
        />
      </span>
    </template>
    <q-icon
      v-else
      name="manage_accounts"
      size="24px"
    />

    <q-menu
      anchor="bottom right"
      self="top right"
      class="app-header-user-menu app-light-menu"
      :offset="[0, 8]">
      <div
        v-if="hasStaffProfile"
        class="app-header-user-menu__header">
        <span
          class="app-header-user-menu__avatar
            app-header-user-menu__avatar--lg"
          aria-hidden="true">
          <HeaderUserAvatar
            :photo-file-id="staffProfile.photoFileId"
            icon-size="28px"
          />
        </span>
        <div class="app-header-user-menu__header-text">
          <p class="app-header-user-menu__header-name">
            {{ staffProfile.name }}
          </p>
          <p
            v-if="staffProfile.position"
            class="app-header-user-menu__header-position">
            {{ staffProfile.position }}
          </p>
          <p
            v-if="activeSubtenantName"
            class="app-header-user-menu__header-site">
            {{ activeSubtenantName }}
          </p>
        </div>
      </div>

      <q-list class="app-header-user-menu__list">
        <template v-if="hasStaffProfile">
          <q-item
            v-close-popup
            clickable
            :data-testid="layoutTestIds.userMenuMyProfile">
            <q-item-section avatar>
              <q-icon name="person_outline" />
            </q-item-section>
            <q-item-section>{{ t('headerUserMyProfile') }}</q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            :data-testid="layoutTestIds.userMenuSettings">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>{{ t('headerUserSettings') }}</q-item-section>
          </q-item>
          <q-item
            v-close-popup
            clickable
            :data-testid="layoutTestIds.userMenuHelp">
            <q-item-section avatar>
              <q-icon name="help_outline" />
            </q-item-section>
            <q-item-section>{{ t('headerUserHelpSupport') }}</q-item-section>
          </q-item>
        </template>

        <q-item
          v-close-popup
          clickable
          :data-testid="layoutTestIds.changePassword"
          @click="emit('change-password')">
          <q-item-section avatar>
            <q-icon name="lock_reset" />
          </q-item-section>
          <q-item-section>{{ t('changePassword') }}</q-item-section>
        </q-item>

        <q-separator class="app-header-user-menu__separator" />

        <q-item
          v-close-popup
          clickable
          class="app-header-user-menu__logout-item"
          :data-testid="layoutTestIds.signOut"
          @click="emit('logout')">
          <q-item-section avatar>
            <q-icon
              name="logout"
              class="app-header-user-menu__logout-icon"
            />
          </q-item-section>
          <q-item-section class="app-header-user-menu__logout-label">
            {{ t('signOut') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import HeaderUserAvatar from 'components/HeaderUserAvatar.vue'
import { useAuthStore } from 'stores/auth-store.js'
import { layoutTestIds } from 'src/test-ids/index.js'

const emit = defineEmits(['change-password', 'logout'])

const { t } = useI18n()
const authStore = useAuthStore()
const { linkedStaffProfile, activeSubtenant } = storeToRefs(authStore)

const staffProfile = computed(() => linkedStaffProfile.value ?? {})
const hasStaffProfile = computed(() => Boolean(linkedStaffProfile.value))
const activeSubtenantName = computed(
  () => String(activeSubtenant.value?.name ?? '').trim(),
)

const menuAriaLabel = computed(() =>
  hasStaffProfile.value
    ? t('headerUserMenuAria', { name: staffProfile.value.name })
    : t('headerUserMenuGenericAria'),
)
</script>
