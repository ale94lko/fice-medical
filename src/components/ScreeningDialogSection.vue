<template>
  <section
    class="screening-dialog-section"
    :data-testid="sectionTestId || undefined">
    <button
      type="button"
      class="screening-dialog-section__header row items-center no-wrap"
      :data-testid="toggleTestId || undefined"
      :aria-expanded="isExpanded"
      @click="toggleExpanded">
      <span class="screening-dialog-section__index">{{ index }}.</span>
      <span class="screening-dialog-section__title col text-left">
        {{ title }}
      </span>
      <q-icon
        :name="statusIcon"
        size="20px"
        :class="`screening-dialog-section__status--${status}`"
      />
      <q-icon
        :name="chevronIcon"
        size="20px"
        class="screening-dialog-section__chevron"
      />
    </button>

    <q-slide-transition>
      <div v-show="isExpanded" class="screening-dialog-section__panel">
        <p
          v-if="description"
          class="screening-dialog-section__description text-body2 text-grey-7">
          {{ description }}
        </p>
        <div class="screening-dialog-section__fields">
          <slot />
        </div>
      </div>
    </q-slide-transition>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  index: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'pending',
  },
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  sectionTestId: {
    type: String,
    default: '',
  },
  toggleTestId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const isExpanded = ref(props.modelValue ?? true)

watch(
  () => props.modelValue,
  value => {
    if (value !== undefined) {
      isExpanded.value = value
    }
  },
)

const chevronIcon = computed(() =>
  isExpanded.value ? 'expand_less' : 'expand_more',
)

const statusIcon = computed(() => {
  if (props.status === 'complete') {
    return 'check_circle'
  }
  if (props.status === 'warning' || props.status === 'in_progress') {
    return 'error_outline'
  }

  return 'radio_button_unchecked'
})

function toggleExpanded() {
  if (props.modelValue === undefined) {
    isExpanded.value = !isExpanded.value

    return
  }
  emit('update:modelValue', !props.modelValue)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.screening-dialog-section {
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface;
  overflow: hidden;
}

.screening-dialog-section__header {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 14px 16px;
  gap: 10px;
  cursor: pointer;
}

.screening-dialog-section__index {
  font-weight: 700;
  color: $text-strong;
}

.screening-dialog-section__title {
  font-weight: 700;
  color: $text-strong;
}

.screening-dialog-section__chevron {
  color: $text-muted;
}

.screening-dialog-section__status--complete {
  color: $positive;
}

.screening-dialog-section__status--warning,
.screening-dialog-section__status--in_progress {
  color: #ea580c;
}

.screening-dialog-section__status--pending {
  color: #cbd5e1;
}

.screening-dialog-section__panel {
  padding: 0 16px 16px;
}

.screening-dialog-section__description {
  margin: 0 0 12px;
}

.screening-dialog-section__fields {
  display: flex;
  flex-direction: column;
}
</style>
