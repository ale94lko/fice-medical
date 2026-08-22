<template>
  <div class="subsection-heading">
    <span
      v-if="step != null"
      class="subsection-heading__step">
      {{ step }}
    </span>
    <q-icon
      v-if="icon"
      class="subsection-heading__icon"
      :name="icon"
      size="18px"
      aria-hidden="true"
    />
    <span class="subsection-heading__title">{{ title }}</span>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  step: {
    type: [Number, String],
    default: null,
  },
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.subsection-heading {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-weight: 600;
  color: $text-strong;

  &__icon {
    position: static !important;
    flex: 0 0 18px;
    width: 18px !important;
    min-width: 18px;
    height: 18px !important;
  }

  &__title {
    position: static;
    min-width: 0;
  }

  &__step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: $primary;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
  }
}
</style>
