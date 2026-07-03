<template>
  <q-select
    :model-value="modelValue"
    outlined
    hide-bottom-space
    emit-value
    map-options
    option-label="label"
    option-value="value"
    :options="options"
    :placeholder="placeholder"
    :disable="disable"
    :error="error"
    :error-message="errorMessage"
    :clearable="clearable"
    :data-testid="testId || undefined"
    @update:model-value="emit('update:modelValue', $event)">
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar class="clinician-form-select__avatar-section">
          <ClinicianSelectAvatar
            :photo-file-id="scope.opt.photoFileId"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ optionName(scope.opt) }}</q-item-label>
          <q-item-label
            v-if="optionCaption(scope.opt)"
            caption>
            {{ optionCaption(scope.opt) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #selected-item="scope">
      <span class="clinician-form-select__selected-label">
        {{ optionName(scope.opt) }}
      </span>
    </template>
  </q-select>
</template>

<script setup>
import ClinicianSelectAvatar from 'components/ClinicianSelectAvatar.vue'

defineProps({
  modelValue: {
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

function optionName(option) {
  return String(option?.name ?? option?.label ?? '').trim()
}

function optionCaption(option) {
  return String(option?.caption ?? '').trim()
}
</script>

<style lang="scss" scoped>
.clinician-form-select {
  &__avatar-section {
    min-width: 0;
    padding-right: 8px;
  }

  &__selected-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
