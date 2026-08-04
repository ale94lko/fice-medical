<template>
  <div
    ref="rootRef"
    class="address-line-autocomplete">
    <FormField
      v-if="externalLabel"
      :label="label"
      :required="required">
      <q-input
        ref="inputRef"
        outlined
        hide-bottom-space
        class="full-width"
        lazy-rules="ondemand"
        :model-value="modelValue"
        :rules="rules"
        :readonly="readonly"
        :disable="disable"
        :maxlength="maxlengthResolved"
        :placeholder="placeholder || undefined"
        :error="error"
        :error-message="errorMessage"
        :data-testid="testId"
        @update:model-value="onUserInput"
      >
        <template
          v-if="loading"
          #append>
          <q-spinner size="18px" color="primary" />
        </template>
      </q-input>
    </FormField>
    <q-input
      v-else
      ref="inputRef"
      outlined
      hide-bottom-space
      class="full-width"
      lazy-rules="ondemand"
      :model-value="modelValue"
      :label="label || undefined"
      :rules="rules"
      :readonly="readonly"
      :disable="disable"
      :maxlength="maxlengthResolved"
      :placeholder="placeholder || undefined"
      :error="error"
      :error-message="errorMessage"
      :data-testid="testId"
      @update:model-value="onUserInput"
    >
      <template
        v-if="loading"
        #append>
        <q-spinner size="18px" color="primary" />
      </template>
    </q-input>

    <div
      v-if="menuOpen"
      class="address-line-autocomplete__menu q-mt-xs"
      :data-testid="`${testIdPrefix}-results`">
      <q-list
        v-if="results.length"
        bordered
        separator
        class="rounded-borders address-line-autocomplete__list">
        <q-item
          v-for="result in results"
          :key="result.placeId"
          v-ripple
          clickable
          :data-testid="`${testIdPrefix}-result-${result.placeId}`"
          @click="onSelect(result)">
          <q-item-section>
            <q-item-label>
              {{ resultLabel(result) }}
            </q-item-label>
            <q-item-label
              v-if="resultCaption(result)"
              caption>
              {{ resultCaption(result) }}
            </q-item-label>
          </q-item-section>
          <q-item-section
            v-if="detailLoadingId === result.placeId"
            side>
            <q-spinner size="18px" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
      <p
        v-else-if="searched && !loading"
        class="text-caption text-grey-7 q-mb-none q-px-sm">
        {{ t('addressPlacesEmpty') }}
      </p>
      <p
        v-if="errorText"
        class="text-negative text-caption q-mb-none q-px-sm q-mt-xs">
        {{ errorText }}
      </p>
      <p
        v-if="showOsmAttribution"
        class="text-caption text-grey-6 q-mb-none q-px-sm q-mt-xs">
        {{ t('addressPlacesOsmAttribution') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import FormField from 'components/FormField.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  ADDRESS_SEARCH_DEBOUNCE_MS,
  ADDRESS_SEARCH_MIN_CHARS,
  fetchPlaceDetails,
  isAddressPlaceSearchAvailable,
  searchPlaces,
} from 'src/utils/address-places-search.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  maxlength: {
    type: [Number, String],
    default: undefined,
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
  error: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  externalLabel: {
    type: Boolean,
    default: true,
  },
  testId: {
    type: String,
    default: 'address-line-1',
  },
  testIdPrefix: {
    type: String,
    default: 'address-places',
  },
  resetKey: {
    type: [String, Number, Boolean],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const { t } = useI18n()
const $q = useQuasar()

const rootRef = ref(null)
const inputRef = ref(null)
const results = ref([])
const searched = ref(false)
const loading = ref(false)
const errorText = ref('')
const detailLoadingId = ref(null)
const providerUsed = ref('')
const menuOpen = ref(false)

let debounceTimer = null
let searchRequestId = 0

const available = computed(() => isAddressPlaceSearchAvailable())

const maxlengthResolved = computed(() => {
  if (props.maxlength == null || props.maxlength === '') {
    return undefined
  }
  const n = Number(props.maxlength)

  return Number.isFinite(n) ? n : undefined
})

const showOsmAttribution = computed(
  () => providerUsed.value === 'photon'
    || results.value.some(row => row.provider === 'photon'),
)

function resultLabel(result) {
  return String(result?.address || result?.name || '').trim()
}

function resultCaption(result) {
  const address = String(result?.address || '').trim()
  const name = String(result?.name || '').trim()
  if (!name || name === address) {
    return ''
  }

  return name
}

function clearMenu() {
  results.value = []
  searched.value = false
  errorText.value = ''
  detailLoadingId.value = null
  providerUsed.value = ''
  menuOpen.value = false
}

function clearDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function resetState() {
  clearDebounce()
  searchRequestId += 1
  loading.value = false
  clearMenu()
}

function toErrorMessage(err) {
  const message = String(err?.message ?? '')

  return message.includes('not configured') || message.includes('browser')
    ? t('addressPlacesUnavailable')
    : t('addressPlacesError')
}

function onUserInput(value) {
  let next = value == null ? '' : String(value)
  const maxLen = maxlengthResolved.value
  if (maxLen != null) {
    next = next.slice(0, maxLen)
  }
  emit('update:modelValue', next)
  scheduleSearch(next)
}

function scheduleSearch(value) {
  clearDebounce()
  if (!available.value || props.readonly || props.disable) {
    clearMenu()

    return
  }
  const q = String(value ?? '').trim()
  if (q.length < ADDRESS_SEARCH_MIN_CHARS) {
    clearMenu()

    return
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    runSearch(q)
  }, ADDRESS_SEARCH_DEBOUNCE_MS)
}

async function runSearch(q) {
  const requestId = ++searchRequestId
  loading.value = true
  errorText.value = ''
  providerUsed.value = ''
  menuOpen.value = true
  try {
    const list = await searchPlaces({
      q,
      kind: 'address',
    })
    if (requestId !== searchRequestId) {
      return
    }
    results.value = list
    providerUsed.value = list[0]?.provider || 'photon'
  } catch (err) {
    if (requestId !== searchRequestId) {
      return
    }
    results.value = []
    errorText.value = toErrorMessage(err)
  } finally {
    if (requestId === searchRequestId) {
      searched.value = true
      loading.value = false
    }
  }
}

async function onSelect(result) {
  detailLoadingId.value = result.placeId
  try {
    const details = await fetchPlaceDetails(result)
    clearDebounce()
    searchRequestId += 1
    loading.value = false
    clearMenu()
    if (details?.addressLine1) {
      emit('update:modelValue', details.addressLine1)
    }
    emit('select', details)
  } catch (err) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: toErrorMessage(err),
      position: 'top',
    })
  } finally {
    detailLoadingId.value = null
  }
}

function onDocumentPointerDown(event) {
  const root = rootRef.value
  if (!root || !menuOpen.value) {
    return
  }
  if (!root.contains(event.target)) {
    clearMenu()
  }
}

watch(
  () => props.resetKey,
  () => {
    resetState()
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  clearDebounce()
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

async function validate() {
  return inputRef.value?.validate?.()
}

function resetValidation() {
  inputRef.value?.resetValidation?.()
}

defineExpose({
  validate,
  resetValidation,
  resetState,
})
</script>

<style lang="scss" scoped>
.address-line-autocomplete {
  position: relative;
  width: 100%;
}

.address-line-autocomplete__menu {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  background: #fff;
}

.address-line-autocomplete__list {
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
}
</style>
