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
      :aria-label="t('subtenantSwitcherAria')">
      <SubtenantPillContent
        :name="activeSubtenant.name"
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
              <q-icon name="corporate_fare" color="primary" />
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
      <SubtenantPillContent :name="activeSubtenant.name" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'stores/auth-store.js'
import SubtenantPillContent from 'components/SubtenantPillContent.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const {
  subtenants,
  activeSubtenantId,
  hasMultipleSubtenants,
} = storeToRefs(authStore)

const activeSubtenant = computed(() => authStore.activeSubtenant)

function selectSubtenant(id) {
  authStore.setActiveSubtenant(id)
}
</script>
