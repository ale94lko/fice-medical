<template>
  <div
    class="data-item-component"
    role="heading"
    aria-level="2">
    <q-item
      v-ripple
      :clickable="clickable"
      :data-testid="dataTestId"
      @click="emit('click', $event)">
      <q-item-section avatar>
        <q-avatar
          size="40px"
          :icon="icon"
          :color="iconColor"
          :text-color="iconTextColor" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ title }}
        </q-item-label>
        <q-item-label caption class="banner__meta">
          <q-icon
            v-if="subTitleIcon"
            size="14px"
            :name="subTitleIcon"
          />
          <span>{{ subTitle }}</span>
        </q-item-label>
      </q-item-section>
    </q-item>
    <span class="data-item-actions">
      <slot name="actions" />
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  iconStyle: {
    type: String,
    default: 'primary',
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    required: false,
  },
  subTitleIcon: {
    type: String,
    required: false,
  },
  dataTestId: {
    type: String,
    required: false,
  },
  clickable: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits(['click'])

const iconColor = computed(() => {
  let color
  switch (props.iconStyle) {
    case 'warning':
      color = 'warning'
      break

    default:
      color = 'teal-1'
      break
  }

  return color
})

const iconTextColor = computed(() => {
  let color
  switch (props.iconStyle) {
    case 'warning':
      color = 'white'
      break

    default:
      color = 'primary'
      break
  }

  return color
})
</script>
