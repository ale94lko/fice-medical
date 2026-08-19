<template>
  <q-item
    v-if="mismatch && isMenuItem"
    v-close-popup
    clickable
    :data-testid="testIds.banner"
    :aria-label="t('subtenantTimezoneLabel')"
    @click="openPicker"
  >
    <q-item-section avatar>
      <q-icon name="public" />
    </q-item-section>
    <q-item-section>
      {{ t('subtenantTimezoneLabel') }}
    </q-item-section>
  </q-item>
  <q-dialog
    v-else-if="isDialog"
    v-model="pickerOpen"
    :data-testid="testIds.menu"
  >
    <q-card
      v-if="mismatch"
      class="timezone-mismatch-dialog app-dialog-card"
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
        <q-btn
          flat
          round
          dense
          icon="close"
          :aria-label="t('close')"
          @click="closePicker"
        />
      </div>
      <div class="timezone-mismatch-menu__body">
        <div class="timezone-mismatch-menu__zones">
          <button
            type="button"
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                usingBrowser,
            }"
            :aria-pressed="usingBrowser ? 'true' : 'false'"
            :data-testid="testIds.useDevice"
            @click="onUseDevice"
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
          </button>
          <button
            type="button"
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                !usingBrowser,
            }"
            :aria-pressed="usingBrowser ? 'false' : 'true'"
            :data-testid="testIds.keepClinic"
            @click="onUseClinic"
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
          </button>
        </div>
        <p class="timezone-mismatch-menu__hint">
          {{ t('timezoneMismatchSessionHint') }}
        </p>
      </div>
    </q-card>
  </q-dialog>
  <div
    v-else-if="mismatch"
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
          <button
            type="button"
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                usingBrowser,
            }"
            :aria-pressed="usingBrowser ? 'true' : 'false'"
            :data-testid="testIds.useDevice"
            @click="onUseDevice"
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
          </button>
          <button
            type="button"
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                !usingBrowser,
            }"
            :aria-pressed="usingBrowser ? 'false' : 'true'"
            :data-testid="testIds.keepClinic"
            @click="onUseClinic"
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
          </button>
        </div>
        <p class="timezone-mismatch-menu__hint">
          {{ t('timezoneMismatchSessionHint') }}
        </p>
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
  variant: {
    type: String,
    default: 'trigger',
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
  useClinicZone,
  pickerOpen,
  openPicker,
  closePicker,
} = useSessionDisplayTimezone()

const isMenuItem = computed(() => props.variant === 'menuItem')
const isDialog = computed(() => props.variant === 'dialog')

const testIds = computed(() => {
  if (props.placement === 'encounter') {
    return {
      banner: layoutTestIds.timezoneBannerEncounter,
      menu: layoutTestIds.timezoneBannerEncounterMenu,
      useDevice: layoutTestIds.timezoneBannerEncounterUseDevice,
      keepClinic:
        layoutTestIds.timezoneBannerEncounterKeepClinic,
    }
  }
  if (isMenuItem.value || isDialog.value) {
    return {
      banner: layoutTestIds.headerOverflowTimezone,
      menu: layoutTestIds.timezoneBannerMenu,
      useDevice: layoutTestIds.timezoneBannerUseDevice,
      keepClinic: layoutTestIds.timezoneBannerKeepClinic,
    }
  }

  return {
    banner: layoutTestIds.timezoneBanner,
    menu: layoutTestIds.timezoneBannerMenu,
    useDevice: layoutTestIds.timezoneBannerUseDevice,
    keepClinic: layoutTestIds.timezoneBannerKeepClinic,
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

function toggleMenu() {
  clearCloseTimer()
  menuOpen.value = !menuOpen.value
}

function onUseDevice() {
  useBrowserZone()
}

function onUseClinic() {
  useClinicZone()
}
</script>
