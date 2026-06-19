<template>
  <q-item
    clickable
    v-ripple
    class="app-drawer__subitem"
    :to="to"
    :active-class="activeClass"
    :data-testid="testId || undefined">
    <q-item-section avatar class="app-drawer__subitem-icon">
      <q-icon :name="icon" size="18px" />
    </q-item-section>
    <q-item-section>
      <slot />
    </q-item-section>
  </q-item>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
  to: {
    type: [String, Object],
    default: undefined,
  },
  activeClass: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
})
</script>
