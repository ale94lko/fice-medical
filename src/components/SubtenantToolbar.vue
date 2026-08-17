<template>
  <div
    v-if="activeSubtenant"
    class="app-subtenant">
    <q-btn
      v-if="hasMultipleSubtenants"
      flat
      dense
      no-caps
      unelevated
      class="app-subtenant__pill app-subtenant__pill--interactive"
      :data-testid="subtenantToolbarTestIds.picker"
      :aria-label="t('subtenantSwitcherAria')">
      <SubtenantPillContent
        :name="activeSubtenant.name"
        :photo-file-id="activeSubtenant.photoFileId"
        show-chevron
      />
      <q-menu
        anchor="bottom right"
        self="top right"
        class="app-subtenant-menu app-light-menu"
        :offset="[0, 8]">
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
              <StoredFileAvatar
                v-if="hasPhotoFileId(item.photoFileId)"
                :file-id="item.photoFileId"
                spinner-size="14px"
                class="app-subtenant-menu__logo">
                <template #placeholder>
                  <q-icon name="corporate_fare" color="primary" />
                </template>
              </StoredFileAvatar>
              <q-icon
                v-else
                name="corporate_fare"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.name }}</q-item-label>
              <q-item-label
                v-if="item.code"
                caption>
                {{ item.code }}
              </q-item-label>
            </q-item-section>
            <q-item-section
              v-if="item.id === activeSubtenantId"
              side>
              <q-icon name="check" color="primary" size="18px" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <div
      v-else
      class="app-subtenant__pill"
      role="status"
      :aria-label="t('subtenantActiveAria', { name: activeSubtenant.name })">
      <SubtenantPillContent
        :name="activeSubtenant.name"
        :photo-file-id="activeSubtenant.photoFileId"
      />
    </div>
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
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'stores/auth-store.js'
import SubtenantPillContent from 'components/SubtenantPillContent.vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import ModalComponent from 'components/ModalComponent.vue'
import { hasUnsavedChanges } from
  'src/composables/useUnsavedChangesRegistry.js'
import { resolveSubtenantSwitchRoute } from
  'src/utils/subtenant-switch-navigation.js'
import { subtenantToolbarTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const switchConfirmOpen = ref(false)
const pendingSubtenantId = ref(null)

const {
  subtenants,
  activeSubtenantId,
  hasMultipleSubtenants,
} = storeToRefs(authStore)

const activeSubtenant = computed(() => authStore.activeSubtenant)

function hasPhotoFileId(photoFileId) {
  const id = Number(photoFileId)

  return Number.isFinite(id) && id > 0
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
