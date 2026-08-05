<template>
  <AddClientLabeledField
    :label="label"
    class="clinical-resource-keywords-field">
    <q-select
      ref="selectRef"
      :model-value="modelValue"
      class="clinical-resource-keywords-field__select"
      :data-testid="testId"
      outlined
      options-dense
      hide-bottom-space
      use-input
      use-chips
      multiple
      emit-value
      map-options
      input-debounce="300"
      :options="filteredOptions"
      :loading="loading"
      :readonly="readonly"
      :disable="disable"
      :placeholder="selectPlaceholder"
      :error="Boolean(error)"
      :error-message="error"
      popup-content-class="clinical-resource-keywords-menu"
      :popup-content-style="popupContentStyle"
      @filter="onFilter"
      @focus="onFocus"
      @popup-show="onPopupShow"
      @new-value="onNewValue"
      @update:model-value="onUpdate"
      @input-value="onInputValue">
      <template
        v-if="showSuggestionsHeader"
        #before-options>
        <q-item
          dense
          class="clinical-resource-keywords-menu__header">
          <q-item-section class="text-caption text-grey-7 text-uppercase">
            {{ t('clinicalResourceKeywordsSuggestions') }}
          </q-item-section>
        </q-item>
      </template>

      <template #option="scope">
        <q-separator
          v-if="scope.opt.isNew && showSuggestionsHeader"
          class="clinical-resource-keywords-menu__sep"
        />
        <q-item
          v-bind="scope.itemProps"
          dense
          :class="{
            'clinical-resource-keywords-menu__new': scope.opt.isNew,
          }">
          <q-item-section
            v-if="scope.opt.isNew"
            avatar
            class="clinical-resource-keywords-menu__new-avatar">
            <q-avatar
              size="28px"
              color="primary"
              text-color="white"
              icon="add"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ scope.opt.label }}
            </q-item-label>
            <q-item-label
              v-if="scope.opt.isNew"
              caption>
              {{ t('clinicalResourceKeywordsNewTagHint') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template #no-option>
        <q-item
          v-if="canShowMenu"
          dense>
          <q-item-section class="text-grey-7">
            {{ t('clinicalResourceKeywordsNoOptions') }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <p
      v-if="hint && !error"
      class="clinical-resource-keywords-hint text-caption
        text-grey-7 q-mb-none">
      {{ hint }}
    </p>
  </AddClientLabeledField>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import { clinicalResourceFieldKeys as fk } from 'components/constants.js'
import { listClinicalResources } from 'src/utils/clinical-resource-api.js'

const MIN_CHARS = 3

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  /** Optional seed tags (e.g. from the current list page). */
  suggestions: {
    type: Array,
    default: () => [],
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

const selectRef = ref(null)
const loading = ref(false)
const knownTags = ref([])
const filteredOptions = ref([])
const filterText = ref('')
const tagsLoaded = ref(false)

const popupContentStyle = {
  maxHeight: '240px',
}

const selectPlaceholder = computed(() => {
  if (props.modelValue?.length) {
    return ''
  }

  return props.placeholder
})

const canShowMenu = computed(
  () => normalizeTag(filterText.value).length >= MIN_CHARS,
)

const showSuggestionsHeader = computed(() =>
  canShowMenu.value
  && filteredOptions.value.some(opt => opt && !opt.isNew),
)

function normalizeTag(value) {
  return String(value ?? '').trim()
}

function tagKey(value) {
  return normalizeTag(value).toLowerCase()
}

function uniqueTags(list) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    const tag = normalizeTag(item)
    const key = tagKey(tag)
    if (!tag || seen.has(key)) {
      continue
    }
    seen.add(key)
    out.push(tag)
  }

  return out
}

function mergeKnownTags(extra = []) {
  knownTags.value = uniqueTags([
    ...knownTags.value,
    ...props.suggestions,
    ...extra,
    ...(props.modelValue ?? []),
  ]).sort((a, b) => a.localeCompare(b))
}

async function ensureKnownTagsLoaded() {
  if (tagsLoaded.value || loading.value) {
    mergeKnownTags()

    return
  }
  loading.value = true
  try {
    const result = await listClinicalResources({
      page: 1,
      limit: 200,
    }, t)
    const collected = []
    for (const item of result.items ?? []) {
      const keywords = item?.[fk.keywords]
      if (!Array.isArray(keywords)) {
        continue
      }
      for (const keyword of keywords) {
        collected.push(keyword)
      }
    }
    mergeKnownTags(collected)
    tagsLoaded.value = true
  } catch {
    mergeKnownTags()
  } finally {
    loading.value = false
  }
}

function hideMenu() {
  nextTick(() => {
    selectRef.value?.hidePopup?.()
  })
}

function clearTypedInput() {
  filterText.value = ''
  filteredOptions.value = []
  nextTick(() => {
    selectRef.value?.updateInputValue?.('', true)
    selectRef.value?.hidePopup?.()
  })
}

function buildOptions(needleRaw) {
  const needle = normalizeTag(needleRaw)
  if (needle.length < MIN_CHARS) {
    return []
  }

  const needleKey = tagKey(needle)
  const selectedKeys = new Set(
    (props.modelValue ?? []).map(tagKey).filter(Boolean),
  )
  const available = knownTags.value.filter(
    tag => !selectedKeys.has(tagKey(tag)),
  )
  const matching = available.filter(tag =>
    tagKey(tag).includes(needleKey),
  )

  const options = matching.map(tag => ({
    label: tag,
    value: tag,
    isNew: false,
  }))

  const exactExists = knownTags.value.some(tag => tagKey(tag) === needleKey)
    || selectedKeys.has(needleKey)

  if (!exactExists) {
    options.push({
      label: t('clinicalResourceKeywordsNewTag', { tag: needle }),
      value: needle,
      isNew: true,
    })
  }

  return options
}

function refreshOptions(val = filterText.value) {
  filteredOptions.value = buildOptions(val)
}

function onFilter(val, update) {
  filterText.value = String(val ?? '')
  const needle = normalizeTag(filterText.value)

  if (needle.length < MIN_CHARS) {
    update(() => {
      filteredOptions.value = []
    })
    hideMenu()

    return
  }

  update(() => {
    refreshOptions(filterText.value)
  })
}

async function onFocus() {
  await ensureKnownTagsLoaded()
  filteredOptions.value = []
  hideMenu()
}

async function onPopupShow() {
  await ensureKnownTagsLoaded()
  if (!canShowMenu.value) {
    filteredOptions.value = []
    hideMenu()

    return
  }
  refreshOptions(filterText.value)
}

function onInputValue(val) {
  filterText.value = String(val ?? '')
  if (normalizeTag(filterText.value).length < MIN_CHARS) {
    filteredOptions.value = []
    hideMenu()
  }
}

function onUpdate(value) {
  const next = uniqueTags(Array.isArray(value) ? value : [])
  emit('update:modelValue', next)
  clearTypedInput()
}

function onNewValue(val, done) {
  const tag = normalizeTag(val)
  if (!tag || tag.length < MIN_CHARS) {
    return
  }
  done(tag, 'add-unique')
  clearTypedInput()
}

watch(
  () => props.suggestions,
  () => {
    mergeKnownTags()
    if (canShowMenu.value) {
      refreshOptions(filterText.value)
    }
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  () => {
    mergeKnownTags()
  },
  { deep: true },
)
</script>

<style lang="scss">
.clinical-resource-keywords-hint {
  margin-top: 4px;
}

.clinical-resource-keywords-field__select {
  .q-chip {
    background: #e8eef2;
    color: rgba(0, 0, 0, 0.75);
    font-weight: 500;
  }
}

.clinical-resource-keywords-menu {
  max-height: 240px !important;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

  .q-item {
    min-height: 36px;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .clinical-resource-keywords-menu__header {
    min-height: 28px;
    pointer-events: none;
    padding-top: 8px;
    padding-bottom: 2px;
  }

  .clinical-resource-keywords-menu__sep {
    margin: 4px 0;
  }

  .clinical-resource-keywords-menu__new-avatar {
    min-width: 40px;
    padding-right: 8px;
  }

  .clinical-resource-keywords-menu__new {
    .q-item__label {
      color: var(--q-primary);
      font-weight: 600;
    }

    .q-item__label--caption {
      color: rgba(0, 0, 0, 0.54);
      font-weight: 400;
    }
  }
}
</style>
