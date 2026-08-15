<template>
  <q-icon
    :name="iconName"
    class="cursor-pointer password-toggle-icon"
    role="button"
    tabindex="0"
    :data-testid="testId || undefined"
    :aria-label="titleText"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @keydown.enter.prevent="onKeyboardToggle"
    @keydown.space.prevent="onKeyboardToggle"
  >
    <q-tooltip
      v-model="tooltipOpen"
      no-parent-event
      class="app-info-tooltip"
      anchor="top middle"
      self="bottom middle"
      :offset="[0, 6]">
      {{ titleText }}
    </q-tooltip>
  </q-icon>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { passwordToggleIconName }
  from 'src/composables/usePasswordVisibility.js'

const LONG_PRESS_MS = 450
const MOVE_TOLERANCE_PX = 10

const props = defineProps({
  showPlain: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['toggle'])

const { t } = useI18n()

const tooltipOpen = ref(false)
const iconName = computed(() => passwordToggleIconName(props.showPlain))
const titleText = computed(() =>
  props.showPlain ? t('hidePassword') : t('showPassword'),
)

let pressTimer = null
let pressActive = false
let longPressFired = false
let startX = 0
let startY = 0

function clearPressTimer() {
  if (pressTimer == null) {
    return
  }
  clearTimeout(pressTimer)
  pressTimer = null
}

function resetPressState() {
  clearPressTimer()
  pressActive = false
  longPressFired = false
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }
  // Keep focus on the field; still allow our press handling.
  event.preventDefault()
  pressActive = true
  longPressFired = false
  tooltipOpen.value = false
  startX = event.clientX
  startY = event.clientY
  clearPressTimer()
  pressTimer = window.setTimeout(() => {
    pressTimer = null
    if (!pressActive) {
      return
    }
    longPressFired = true
    tooltipOpen.value = true
  }, LONG_PRESS_MS)
}

function onPointerUp(event) {
  if (!pressActive) {
    return
  }
  const wasLongPress = longPressFired
  const moved = Math.hypot(
    event.clientX - startX,
    event.clientY - startY,
  ) > MOVE_TOLERANCE_PX
  resetPressState()
  if (wasLongPress || moved) {
    return
  }
  tooltipOpen.value = false
  emit('toggle')
}

function onPointerCancel() {
  resetPressState()
  tooltipOpen.value = false
}

function onPointerLeave(event) {
  // Mouse leave mid-press cancels; touch leave is often noisy.
  if (event.pointerType !== 'mouse' || !pressActive) {
    return
  }
  resetPressState()
  tooltipOpen.value = false
}

function onKeyboardToggle() {
  tooltipOpen.value = false
  emit('toggle')
}

onBeforeUnmount(() => {
  resetPressState()
})
</script>
