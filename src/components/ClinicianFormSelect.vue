<template>
  <q-select
    class="clinician-form-select"
    :model-value="modelValue"
    outlined
    hide-bottom-space
    emit-value
    map-options
    use-input
    input-debounce="0"
    :option-label="optionName"
    option-value="value"
    :options="filteredOptions"
    :placeholder="placeholder"
    :disable="disable"
    :readonly="readonly"
    :loading="loading"
    :error="error"
    :error-message="errorMessage"
    :clearable="showClearable"
    :multiple="multiple"
    :use-chips="useChips"
    :fill-input="fillInput"
    :hide-selected="hideSelected"
    :data-testid="testId || undefined"
    @filter="onFilter"
    @update:model-value="onUpdate">
    <template #option="scope">
      <q-item
        v-bind="scope.itemProps"
        class="clinician-form-select__option">
        <q-item-section
          v-if="multiple"
          side
          class="clinician-form-select__check-section"
          @click.stop>
          <q-checkbox
            dense
            :model-value="scope.selected"
            tabindex="-1"
            @update:model-value="scope.toggleOption(scope.opt)"
          />
        </q-item-section>
        <q-item-section
          avatar
          class="clinician-form-select__avatar-section">
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
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey-7">
          {{ noOptionsLabel || t('clinicianSelectNoOptions') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ClinicianSelectAvatar from 'components/ClinicianSelectAvatar.vue'
import { hasSelectValue, isEmpty } from 'src/utils/base.js'

const props = defineProps({
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
  readonly: {
    type: Boolean,
    default: false,
  },
  loading: {
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
  multiple: {
    type: Boolean,
    default: false,
  },
  /**
   * When false with multiple, selected values are not shown as chips
   * (use an external table instead).
   */
  showSelectedInField: {
    type: Boolean,
    default: true,
  },
  noOptionsLabel: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const filteredOptions = ref([])

const showClearable = computed(
  () => props.clearable && hasSelectValue(props.modelValue),
)

const useChips = computed(
  () => props.multiple && props.showSelectedInField,
)

const hideSelected = computed(() => {
  if (!props.multiple) {
    return true
  }

  return !props.showSelectedInField
})

const fillInput = computed(() => !props.multiple)

watch(
  () => props.options,
  options => {
    filteredOptions.value = Array.isArray(options) ? [...options] : []
  },
  { immediate: true, deep: true },
)

function optionName(option) {
  return String(option?.name ?? option?.label ?? '').trim()
}

function optionCaption(option) {
  return String(option?.caption ?? '').trim()
}

function optionSearchText(option) {
  return [
    option?.name,
    option?.label,
    option?.caption,
    option?.npi,
    option?.specialty,
    option?.staffCode,
  ]
    .map(part => String(part ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ')
}

function onFilter(val, update) {
  update(() => {
    const list = Array.isArray(props.options) ? props.options : []
    const needle = String(val ?? '').trim().toLowerCase()
    if (!needle) {
      filteredOptions.value = [...list]

      return
    }
    filteredOptions.value = list.filter(option =>
      optionSearchText(option).includes(needle),
    )
  })
}

function onUpdate(value) {
  if (props.multiple) {
    if (value == null || (Array.isArray(value) && value.length === 0)) {
      emit('update:modelValue', [])

      return
    }
    emit('update:modelValue', value)

    return
  }
  if (isEmpty(value)) {
    emit('update:modelValue', null)

    return
  }
  emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.clinician-form-select {
  &__check-section {
    padding-right: 4px;
    min-width: 0;
  }

  &__avatar-section {
    min-width: 0;
    padding-right: 8px;
  }

  &__selected-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__option {
    :deep(.q-checkbox__inner) {
      color: $primary;
    }
  }
}
</style>
