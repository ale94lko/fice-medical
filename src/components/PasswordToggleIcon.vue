<template>
  <q-icon
    :name="iconName"
    class="cursor-pointer"
    :data-testid="testId || undefined"
    :aria-label="titleText"
    @click="emit('toggle')"
  >
    <q-tooltip
      class="app-info-tooltip"
      anchor="top middle"
      self="bottom middle"
      :offset="[0, 6]">
      {{ titleText }}
    </q-tooltip>
  </q-icon>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { passwordToggleIconName }
  from 'src/composables/usePasswordVisibility.js'

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

const iconName = computed(() => passwordToggleIconName(props.showPlain))

const titleText = computed(() =>
  props.showPlain ? t('hidePassword') : t('showPassword'),
)
</script>
