<template>
  <q-select
    :model-value="modelValue"
    class="provider-taxonomy-select"
    outlined
    hide-bottom-space
    use-input
    input-debounce="300"
    emit-value
    map-options
    option-value="value"
    option-label="label"
    clearable
    :multiple="multiple"
    :use-chips="multiple"
    :fill-input="!multiple"
    :hide-selected="!multiple"
    :options="filteredOptions"
    :loading="searchLoading"
    :disable="disable || readonly"
    :readonly="readonly"
    :placeholder="placeholder"
    :error="error"
    :error-message="errorMessage"
    :rules="rules"
    :data-testid="testId || undefined"
    @filter="onFilter"
    @popup-show="onPopupShow"
    @update:model-value="onSelected">
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ optionLabel(scope.opt) }}</q-item-label>
          <q-item-label
            v-if="optionCaption(scope.opt)"
            caption>
            {{ optionCaption(scope.opt) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template
      v-if="!multiple"
      #selected-item="scope">
      <span class="provider-taxonomy-select__selected">
        {{ optionLabel(scope.opt) }}
      </span>
    </template>

    <template #no-option>
      <q-item>
        <q-item-section class="text-grey-7">
          {{ noOptionsLabel }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  fetchProviderTaxonomiesPage,
  mapProviderTaxonomyToSelectOption,
  PROVIDER_TAXONOMY_SEARCH_LIMIT,
} from 'src/utils/provider-taxonomy-api.js'

const props = defineProps({
  modelValue: {
    default: null,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  excludeCodes: {
    type: Array,
    default: () => [],
  },
  presetOptions: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
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
  rules: {
    type: Array,
    default: () => [],
  },
  testId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'select-option'])

const { t } = useI18n()
const searchLoading = ref(false)
const requestId = ref(0)
const filteredOptions = ref([])
const selectedOptions = ref([])

const noOptionsLabel = computed(() =>
  searchLoading.value
    ? t('appLoading')
    : t('staffTaxonomySearchEmpty'),
)

const excludedSet = computed(() => new Set(
  (props.excludeCodes ?? [])
    .map(code => String(code ?? '').trim())
    .filter(Boolean),
))

function optionLabel(option) {
  return String(option?.label ?? option?.displayName ?? '').trim()
}

function optionCaption(option) {
  return String(option?.caption ?? option?.code ?? '').trim()
}

function mergeUniqueOptions(current, incoming) {
  const seen = new Set(
    (current ?? []).map(option => String(option.value)),
  )
  const next = [...(current ?? [])]
  for (const option of incoming ?? []) {
    const key = String(option?.value ?? '')
    if (!key || seen.has(key) || excludedSet.value.has(key)) {
      continue
    }
    seen.add(key)
    next.push(option)
  }

  return next
}

function selectedCodes() {
  if (props.multiple) {
    return (props.modelValue ?? [])
      .map(code => String(code ?? '').trim())
      .filter(Boolean)
  }
  const code = String(props.modelValue ?? '').trim()

  return code ? [code] : []
}

function ensureSelectedInOptions(options) {
  let next = mergeUniqueOptions(props.presetOptions ?? [], options ?? [])
  for (const option of selectedOptions.value) {
    next = mergeUniqueOptions(next, [option])
  }

  return next.filter(option => {
    const code = String(option.value ?? '')
    if (excludedSet.value.has(code) && !selectedCodes().includes(code)) {
      return false
    }

    return true
  })
}

async function loadOptions(query, update) {
  const currentRequestId = ++requestId.value
  searchLoading.value = true
  try {
    const { options } = await fetchProviderTaxonomiesPage({
      q: query,
      active: true,
      page: 0,
      limit: PROVIDER_TAXONOMY_SEARCH_LIMIT,
    })
    if (currentRequestId !== requestId.value) {
      return
    }
    filteredOptions.value = ensureSelectedInOptions(options)
    update?.(filteredOptions.value)
  } catch {
    if (currentRequestId !== requestId.value) {
      return
    }
    filteredOptions.value = ensureSelectedInOptions([])
    update?.(filteredOptions.value)
  } finally {
    if (currentRequestId === requestId.value) {
      searchLoading.value = false
    }
  }
}

function onFilter(value, update, abort) {
  if (props.readonly || props.disable) {
    abort?.()
    return
  }
  loadOptions(value, update)
}

function onPopupShow() {
  if (!filteredOptions.value.length) {
    loadOptions('')
  }
}

function findOption(code) {
  const needle = String(code ?? '').trim()
  if (!needle) {
    return null
  }

  return (
    filteredOptions.value.find(option => option.value === needle)
    || selectedOptions.value.find(option => option.value === needle)
    || (props.presetOptions ?? []).find(option => option.value === needle)
    || null
  )
}

function onSelected(value) {
  if (props.multiple) {
    const codes = (value ?? [])
      .map(code => String(code ?? '').trim())
      .filter(Boolean)
      .filter(code => !excludedSet.value.has(code))
    const unique = [...new Set(codes)]
    selectedOptions.value = unique
      .map(code => findOption(code))
      .filter(Boolean)
    emit('update:modelValue', unique)
    emit('select-option', selectedOptions.value)
    return
  }

  const code = String(value ?? '').trim()
  const option = findOption(code)
  selectedOptions.value = option ? [option] : []
  emit('update:modelValue', code || null)
  emit('select-option', option)
}

function syncSelectedFromValue() {
  const codes = selectedCodes()
  selectedOptions.value = codes
    .map(code => {
      const existing = findOption(code)
      if (existing) {
        return existing
      }
      const preset = (props.presetOptions ?? []).find(
        option => option.value === code,
      )
      if (preset) {
        return preset
      }

      return mapProviderTaxonomyToSelectOption({
        code,
        displayName: code,
      })
    })
    .filter(Boolean)
  filteredOptions.value = ensureSelectedInOptions(filteredOptions.value)
}

watch(
  () => [props.modelValue, props.presetOptions, props.excludeCodes],
  () => {
    syncSelectedFromValue()
  },
  { immediate: true, deep: true },
)
</script>

<style lang="scss" scoped>
.provider-taxonomy-select {
  width: 100%;

  &__selected {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
