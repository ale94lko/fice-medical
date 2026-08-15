<template>
  <div class="app-header-mobile-overflow">
    <div
      class="app-header-mobile-overflow__anchors"
      aria-hidden="true">
      <ClinicalResourcesQuickPanel
        v-if="showClinical"
        ref="clinicalRef"
      />
      <AppHeaderNotifications
        ref="notificationsRef"
        @update:unread-count="onUnreadCount"
      />
    </div>

    <q-btn
      flat
      dense
      round
      icon="more_vert"
      class="app-header-mobile-overflow__trigger"
      :aria-label="t('moreActions')"
      :data-testid="layoutTestIds.headerOverflow">
      <q-badge
        v-if="unreadCount"
        floating
        rounded
        color="negative"
        :label="unreadCount > 9 ? '9+' : unreadCount"
      />

      <q-menu
        anchor="bottom right"
        self="top right"
        :offset="[0, 8]"
        class="app-light-menu app-header-mobile-overflow__menu"
        :data-testid="layoutTestIds.headerOverflowMenu">
        <q-list class="app-header-mobile-overflow__list">
          <q-item
            v-if="activeSubtenant"
            :clickable="hasMultipleSubtenants"
            :data-testid="layoutTestIds.headerOverflowSubtenant"
            :aria-label="subtenantAriaLabel">
            <q-item-section avatar>
              <span
                class="app-header-mobile-overflow__clinic-icon"
                aria-hidden="true">
                <StoredFileAvatar
                  v-if="hasPhotoFileId(activeSubtenant.photoFileId)"
                  :file-id="activeSubtenant.photoFileId"
                  spinner-size="14px"
                  class="app-subtenant__logo">
                  <template #placeholder>
                    <q-icon
                      name="corporate_fare"
                      size="18px"
                      color="primary"
                    />
                  </template>
                </StoredFileAvatar>
                <q-icon
                  v-else
                  name="corporate_fare"
                  size="18px"
                  color="primary"
                />
              </span>
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ activeSubtenant.name }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="hasMultipleSubtenants"
              side>
              <q-icon name="chevron_right" size="18px" />
            </q-item-section>
            <q-menu
              v-if="hasMultipleSubtenants"
              anchor="top end"
              self="top start"
              :offset="[8, 0]"
              class="app-subtenant-menu app-light-menu">
              <q-list dense>
                <q-item
                  v-for="item in subtenants"
                  :key="item.id"
                  v-close-popup
                  clickable
                  :active="item.id === activeSubtenantId"
                  active-class="app-subtenant-menu__item--active"
                  @click="selectSubtenant(item.id)">
                  <q-item-section avatar>
                    <span
                      class="app-header-mobile-overflow__clinic-icon"
                      aria-hidden="true">
                      <StoredFileAvatar
                        v-if="hasPhotoFileId(item.photoFileId)"
                        :file-id="item.photoFileId"
                        spinner-size="14px"
                        class="app-subtenant__logo">
                        <template #placeholder>
                          <q-icon
                            name="corporate_fare"
                            size="18px"
                            color="primary"
                          />
                        </template>
                      </StoredFileAvatar>
                      <q-icon
                        v-else
                        name="corporate_fare"
                        size="18px"
                        color="primary"
                      />
                    </span>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ item.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section
                    v-if="item.id === activeSubtenantId"
                    side>
                    <q-icon
                      name="check"
                      color="primary"
                      size="18px"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>

          <q-separator
            v-if="activeSubtenant"
            class="app-header-mobile-overflow__separator"
          />

          <q-item
            v-if="showClinical"
            v-close-popup
            clickable
            :data-testid="layoutTestIds.headerOverflowClinical"
            @click="openClinical">
            <q-item-section avatar>
              <q-icon name="menu_book" />
            </q-item-section>
            <q-item-section>
              {{ t('navClinicalResources') }}
            </q-item-section>
          </q-item>

          <q-item
            v-close-popup
            clickable
            :data-testid="layoutTestIds.headerOverflowNotifications"
            @click="openNotifications">
            <q-item-section avatar>
              <q-icon name="notifications" />
            </q-item-section>
            <q-item-section>
              {{ t('notificationsTitle') }}
            </q-item-section>
            <q-item-section
              v-if="unreadCount"
              side>
              <q-badge
                rounded
                color="negative"
                :label="unreadCount > 9 ? '9+' : unreadCount"
              />
            </q-item-section>
          </q-item>

          <q-separator class="app-header-mobile-overflow__separator" />

          <div
            v-if="hasStaffProfile"
            class="app-header-mobile-overflow__user">
            <span
              class="app-header-user-menu__avatar
                app-header-user-menu__avatar--sm"
              aria-hidden="true">
              <HeaderUserAvatar
                :photo-file-id="staffProfile.photoFileId"
                icon-size="20px"
              />
            </span>
            <div class="app-header-mobile-overflow__user-text">
              <p class="app-header-mobile-overflow__user-name">
                {{ staffProfile.name }}
              </p>
              <p
                v-if="staffProfile.position"
                class="app-header-mobile-overflow__user-meta">
                {{ staffProfile.position }}
              </p>
            </div>
          </div>

          <q-item
            v-close-popup
            clickable
            :data-testid="layoutTestIds.userMenuMyProfile"
            @click="goMyProfile">
            <q-item-section avatar>
              <q-icon name="person_outline" />
            </q-item-section>
            <q-item-section>
              {{ t('headerUserMyProfile') }}
            </q-item-section>
          </q-item>

          <template v-if="hasStaffProfile">
            <q-item
              v-close-popup
              clickable
              :data-testid="layoutTestIds.userMenuSettings">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>
                {{ t('headerUserSettings') }}
              </q-item-section>
            </q-item>
            <q-item
              v-close-popup
              clickable
              :data-testid="layoutTestIds.userMenuHelp">
              <q-item-section avatar>
                <q-icon name="help_outline" />
              </q-item-section>
              <q-item-section>
                {{ t('headerUserHelpSupport') }}
              </q-item-section>
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

          <q-separator class="app-header-mobile-overflow__separator" />

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

    <ModalComponent
      v-model="switchConfirmOpen"
      test-id="subtenant-switch-unsaved"
      :title="t('subtenantSwitchUnsavedTitle')"
      :message="t('subtenantSwitchUnsavedMessage')"
      :confirm-text="t('keepEditing')"
      :cancel-text="t('discardChanges')"
      @confirm="dismissSwitchConfirm"
      @cancel="confirmSwitchDiscard"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import AppHeaderNotifications from
  'components/AppHeaderNotifications.vue'
import ClinicalResourcesQuickPanel from
  'components/clinical/ClinicalResourcesQuickPanel.vue'
import HeaderUserAvatar from 'components/HeaderUserAvatar.vue'
import ModalComponent from 'components/ModalComponent.vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import { useAuthStore } from 'stores/auth-store.js'
import { hasUnsavedChanges } from
  'src/composables/useUnsavedChangesRegistry.js'
import { layoutTestIds } from 'src/test-ids/index.js'
import { resolveSubtenantSwitchRoute } from
  'src/utils/subtenant-switch-navigation.js'

defineProps({
  showClinical: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['change-password', 'logout'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const {
  linkedStaffProfile,
  subtenants,
  activeSubtenantId,
  hasMultipleSubtenants,
} = storeToRefs(authStore)

const clinicalRef = ref(null)
const notificationsRef = ref(null)
const unreadCount = ref(0)
const switchConfirmOpen = ref(false)
const pendingSubtenantId = ref(null)

const staffProfile = computed(() => linkedStaffProfile.value ?? {})
const hasStaffProfile = computed(() => Boolean(linkedStaffProfile.value))
const activeSubtenant = computed(() => authStore.activeSubtenant)

const subtenantAriaLabel = computed(() => {
  const name = activeSubtenant.value?.name ?? ''
  if (hasMultipleSubtenants.value) {
    return t('subtenantSwitcherAria')
  }

  return t('subtenantActiveAria', { name })
})

function hasPhotoFileId(photoFileId) {
  const id = Number(photoFileId)

  return Number.isFinite(id) && id > 0
}

function onUnreadCount(count) {
  unreadCount.value = Number(count) || 0
}

function goMyProfile() {
  router.push({ name: 'MyProfile' })
}

async function openClinical() {
  await nextTick()
  clinicalRef.value?.open?.()
}

async function openNotifications() {
  await nextTick()
  notificationsRef.value?.open?.()
}

function applySubtenantSwitch(id) {
  const fallbackRoute = resolveSubtenantSwitchRoute(route.path)
  authStore.setActiveSubtenant(id)
  if (fallbackRoute && route.path !== fallbackRoute) {
    router.push(fallbackRoute)
  }
}

function selectSubtenant(id) {
  if (id === authStore.activeSubtenantId) {
    return
  }
  if (hasUnsavedChanges()) {
    pendingSubtenantId.value = id
    switchConfirmOpen.value = true

    return
  }
  applySubtenantSwitch(id)
}

function dismissSwitchConfirm() {
  switchConfirmOpen.value = false
  pendingSubtenantId.value = null
}

function confirmSwitchDiscard() {
  switchConfirmOpen.value = false
  const id = pendingSubtenantId.value
  pendingSubtenantId.value = null
  if (id != null) {
    applySubtenantSwitch(id)
  }
}
</script>
