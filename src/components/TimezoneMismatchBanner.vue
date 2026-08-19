<template>
  <div
    v-if="mismatch"
    class="timezone-mismatch"
    @mouseenter="openMenu"
    @mouseleave="scheduleClose"
  >
    <button
      type="button"
      class="timezone-mismatch__trigger"
      :aria-label="t('timezoneMismatchTitle')"
      :data-testid="testIds.banner"
      @click="toggleMenu"
    >
      <q-icon name="public" size="22px" />
    </button>
    <q-menu
      v-model="menuOpen"
      no-parent-event
      anchor="bottom start"
      self="top start"
      :offset="[0, 8]"
      class="timezone-mismatch-menu app-light-menu"
      :data-testid="testIds.menu"
      @mouseenter="openMenu"
      @mouseleave="scheduleClose"
    >
      <div class="timezone-mismatch-menu__header">
        <div
          class="timezone-mismatch-menu__icon"
          aria-hidden="true"
        >
          <q-icon name="public" size="20px" />
        </div>
        <div class="timezone-mismatch-menu__heading">
          <p class="timezone-mismatch-menu__title">
            {{ t('timezoneMismatchTitle') }}
          </p>
          <p class="timezone-mismatch-menu__lead">
            {{ t('timezoneMismatchLead') }}
          </p>
        </div>
      </div>
      <div class="timezone-mismatch-menu__body">
        <div class="timezone-mismatch-menu__zones">
          <div
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                usingBrowser,
            }"
          >
            <span class="timezone-mismatch-menu__label">
              {{ t('timezoneMismatchDeviceLabel') }}
            </span>
            <span class="timezone-mismatch-menu__value">
              {{ browserZone }}
            </span>
            <span
              v-if="usingBrowser"
              class="timezone-mismatch-menu__badge"
            >
              {{ t('timezoneMismatchInUse') }}
            </span>
          </div>
          <div
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                !usingBrowser,
            }"
          >
            <span class="timezone-mismatch-menu__label">
              {{ t('timezoneMismatchClinicLabel') }}
            </span>
            <span class="timezone-mismatch-menu__value">
              {{ clinicZone }}
            </span>
            <span
              v-if="!usingBrowser"
              class="timezone-mismatch-menu__badge"
            >
              {{ t('timezoneMismatchInUse') }}
            </span>
          </div>
        </div>
        <p class="timezone-mismatch-menu__hint">
          {{ t('timezoneMismatchSessionHint') }}
        </p>
      </div>
      <div class="timezone-mismatch-menu__actions">
        <q-btn
          v-if="usingBrowser"
          outline
          dense
          no-caps
          color="primary"
          class="app-btn-outline"
          :label="t('timezoneMismatchRevertClinic')"
          :data-testid="testIds.revert"
          @click="onRevert"
        />
        <template v-else>
          <q-btn
            unelevated
            dense
            no-caps
            color="primary"
            class="app-btn-primary"
            :label="t('timezoneMismatchUseDevice')"
            :data-testid="testIds.useDevice"
            @click="onUseDevice"
          />
          <q-btn
            outline
            dense
            no-caps
            color="primary"
            class="app-btn-outline timezone-mismatch-menu__keep"
            :label="t('timezoneMismatchKeepClinic')"
            :data-testid="testIds.keepClinic"
            @click="onKeepClinic"
          />
        </template>
      </div>
    </q-menu>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { layoutTestIds } from 'src/test-ids'
import { useSessionDisplayTimezone } from
  'src/composables/useSessionDisplayTimezone.js'

const props = defineProps({
  placement: {
    type: String,
    default: 'brand',
  },
})

const CLOSE_MS = 180
const { t } = useI18n()
const {
  mismatch,
  usingBrowser,
  clinicZone,
  browserZone,
  useBrowserZone,
  keepClinicZone,
  revertToClinicZone,
} = useSessionDisplayTimezone()

const testIds = computed(() => {
  if (props.placement === 'encounter') {
    return {
      banner: layoutTestIds.timezoneBannerEncounter,
      menu: layoutTestIds.timezoneBannerEncounterMenu,
      useDevice: layoutTestIds.timezoneBannerEncounterUseDevice,
      keepClinic:
        layoutTestIds.timezoneBannerEncounterKeepClinic,
      revert: layoutTestIds.timezoneBannerEncounterRevert,
    }
  }

  return {
    banner: layoutTestIds.timezoneBanner,
    menu: layoutTestIds.timezoneBannerMenu,
    useDevice: layoutTestIds.timezoneBannerUseDevice,
    keepClinic: layoutTestIds.timezoneBannerKeepClinic,
    revert: layoutTestIds.timezoneBannerRevert,
  }
})

const menuOpen = ref(false)
let closeTimer = null

function clearCloseTimer() {
  if (closeTimer) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

function openMenu() {
  clearCloseTimer()
  menuOpen.value = true
}

function scheduleClose() {
  clearCloseTimer()
  closeTimer = window.setTimeout(() => {
    menuOpen.value = false
    closeTimer = null
  }, CLOSE_MS)
}

function closeMenu() {
  clearCloseTimer()
  menuOpen.value = false
}

function toggleMenu() {
  clearCloseTimer()
  menuOpen.value = !menuOpen.value
}

function onUseDevice() {
  useBrowserZone()
}

function onKeepClinic() {
  keepClinicZone()
  closeMenu()
}

function onRevert() {
  revertToClinicZone()
}
</script>
