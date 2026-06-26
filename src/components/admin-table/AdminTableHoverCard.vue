<template>
  <span
    ref="anchorRef"
    class="admin-hover-card"
    @mouseenter="onPointerEnter"
    @mouseleave="onPointerLeave"
    @focusin="onPointerEnter"
    @focusout="onFocusOut">
    <slot name="anchor" />
    <q-menu
      v-model="isOpen"
      :target="true"
      :anchor="anchor"
      :self="self"
      :offset="offset"
      class="admin-hover-card__menu"
      no-parent-event
      no-focus
      no-refocus
      transition-show="fade"
      transition-hide="fade"
      @mouseenter="onPointerEnter"
      @mouseleave="onPointerLeave">
      <div
        class="admin-hover-card__panel"
        @mouseenter="onPointerEnter"
        @mouseleave="onPointerLeave">
        <slot />
      </div>
    </q-menu>
  </span>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  anchor: {
    type: String,
    default: 'top middle',
  },
  self: {
    type: String,
    default: 'bottom middle',
  },
  offset: {
    type: Array,
    default: () => [0, 6],
  },
  closeDelayMs: {
    type: Number,
    default: 150,
  },
})

const anchorRef = ref(null)
const isOpen = ref(false)
let closeTimer = null

function onPointerEnter() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  isOpen.value = true
}

function onPointerLeave() {
  closeTimer = setTimeout(() => {
    isOpen.value = false
    closeTimer = null
  }, props.closeDelayMs)
}

function onFocusOut(event) {
  const next = event.relatedTarget
  const root = anchorRef.value
  if (root && next instanceof Node && root.contains(next)) {
    return
  }

  onPointerLeave()
}
</script>
