<template>
  <div class="my-profile-field-grid">
    <div class="row q-col-gutter-md">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="field.fullWidth ? 'col-12' : 'col-12 col-md-6'">
        <p class="my-profile-field-grid__label">
          {{ field.label }}
        </p>
        <p
          class="my-profile-field-grid__value"
          :class="{
            'my-profile-field-grid__value--bio': field.fullWidth,
          }">
          {{ field.value || '—' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  fields: {
    type: Array,
    default: () => [],
  },
})
</script>
