<template>
  <section
    class="add-client-form__section"
    :data-testid="sectionTestId || undefined">
    <div
      class="add-client-form__accordion-header row items-center no-wrap">
      <AddClientSectionHeading
        class="col"
        :icon="icon"
        :title="title"
      />
      <q-btn
        flat
        round
        dense
        color="grey-8"
        class="add-client-form__accordion-chevron"
        :data-testid="toggleTestId || undefined"
        :icon="chevronIcon"
        :aria-label="toggleAriaLabel"
        @click="toggleExpanded"
      />
    </div>

    <q-slide-transition>
      <div v-show="isExpanded" class="add-client-form__accordion-panel">
        <div
          v-if="$slots.hint"
          class="form-field__hint add-client-form__section-hint">
          <q-icon
            name="info_outline"
            size="14px"
            class="form-field__hint-icon"
          />
          <div class="form-field__hint-content">
            <slot name="hint" />
          </div>
        </div>
        <div class="add-client-form__fields add-client-form__accordion-body">
          <slot />
        </div>
      </div>
    </q-slide-transition>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientSectionHeading from 'components/AddClientSectionHeading.vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
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

const { t } = useI18n()

const isExpanded = ref(props.modelValue ?? true)

watch(
  () => props.modelValue,
  value => {
    if (value !== undefined) {
      isExpanded.value = value
    }
  },
)

watch(isExpanded, value => {
  emit('update:modelValue', value)
})

const chevronIcon = computed(() =>
  isExpanded.value ? 'expand_less' : 'expand_more',
)

const toggleAriaLabel = computed(() =>
  isExpanded.value
    ? t('sectionAccordionCollapse', { title: props.title })
    : t('sectionAccordionExpand', { title: props.title }),
)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>
