<template>
  <q-select
    :model-value="modelValue"
    outlined
    hide-bottom-space
    use-input
    fill-input
    hide-selected
    input-debounce="350"
    emit-value
    map-options
    clearable
    option-value="value"
    option-label="label"
    :options="filteredOptions"
    :loading="searchLoading"
    :disable="disable || readonly"
    :readonly="readonly"
    :placeholder="placeholder"
    :data-testid="testId || undefined"
    @filter="onFilter"
    @popup-show="onPopupShow"
    @popup-hide="onPopupHide"
    @virtual-scroll="onVirtualScroll"
    @update:model-value="onSelected">
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ optionName(scope.opt) }}</q-item-label>
          <q-item-label
            v-if="scope.opt.caption"
            caption>
            {{ scope.opt.caption }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #selected-item="scope">
      <span class="staff-without-system-user-select__selected-label">
        {{ optionName(scope.opt) }}
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
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  fetchStaffWithoutSystemUserPage,
  resolveStaffWithoutSystemUserHasMore,
  STAFF_WITHOUT_SYSTEM_USER_LIST_LIMIT,
} from 'src/utils/staff-without-system-user-api.js'
import { isStaffListServerSearchQuery } from 'src/utils/staff-list-search.js'
import { staffStatuses } from 'components/constants.js'

const props = defineProps({
  modelValue: {
    default: null,
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
  testId: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: staffStatuses.active,
  },
  active: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const filterNeedle = ref('')
const searchLoading = ref(false)
const loadingMore = ref(false)
const userScrolled = ref(false)
const requestId = ref(0)
const selectedOption = ref(null)
const filteredOptions = ref([])
const browseOptions = ref([])
const browsePage = ref(0)
const browseHasMore = ref(false)
const searchOptions = ref([])
const searchPage = ref(0)
const searchHasMore = ref(false)

const noOptionsLabel = computed(() =>
  searchLoading.value ? t('appLoading') : t('userRelatedStaffEmpty'),
)

function optionName(option) {
  if (!option) {
    return ''
  }

  return String(option.name ?? option.label ?? '').trim()
}

function mergeUniqueOptions(current, incoming) {
  const seen = new Set(
    (current ?? []).map(option => String(option.value)),
  )
  const next = [...(current ?? [])]

  for (const option of incoming ?? []) {
    const key = String(option.value)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    next.push(option)
  }

  return next
}

function ensureSelectedInOptions(options) {
  const selected = selectedOption.value
  if (!selected?.value) {
    return options ?? []
  }
  const exists = (options ?? []).some(
    option => option.value === selected.value,
  )
  if (exists) {
    return options ?? []
  }

  return [selected, ...(options ?? [])]
}

function resetState() {
  filterNeedle.value = ''
  searchLoading.value = false
  loadingMore.value = false
  userScrolled.value = false
  requestId.value += 1
  selectedOption.value = null
  filteredOptions.value = []
  browseOptions.value = []
  browsePage.value = 0
  browseHasMore.value = false
  searchOptions.value = []
  searchPage.value = 0
  searchHasMore.value = false
}

async function loadFirstPage({ query, currentRequestId }) {
  const q = String(query ?? '').trim()
  const isServerSearch = isStaffListServerSearchQuery(q)
  const { options, pagination } = await fetchStaffWithoutSystemUserPage({
    page: 0,
    limit: STAFF_WITHOUT_SYSTEM_USER_LIST_LIMIT,
    q,
    status: props.status,
  }, t)

  if (currentRequestId !== requestId.value) {
    return null
  }

  const hasMore = resolveStaffWithoutSystemUserHasMore(
    pagination,
    options.length,
  )

  if (isServerSearch) {
    searchOptions.value = options
    searchPage.value = 0
    searchHasMore.value = hasMore
  } else {
    browseOptions.value = options
    browsePage.value = 0
    browseHasMore.value = hasMore
  }

  filteredOptions.value = options

  return options
}

async function loadNextPage(virtualScrollRef) {
  const q = filterNeedle.value.trim()
  const isServerSearch = isStaffListServerSearchQuery(q)
  const hasMore = isServerSearch
    ? searchHasMore.value
    : browseHasMore.value

  if (!hasMore || loadingMore.value || searchLoading.value) {
    return
  }

  const currentRequestId = requestId.value
  const nextPage = (
    isServerSearch ? searchPage.value : browsePage.value
  ) + 1
  const scrollIndex = filteredOptions.value.length - 1

  loadingMore.value = true
  try {
    const { options: pageOptions, pagination } =
      await fetchStaffWithoutSystemUserPage({
        page: nextPage,
        limit: STAFF_WITHOUT_SYSTEM_USER_LIST_LIMIT,
        q,
        status: props.status,
      }, t)

    if (currentRequestId !== requestId.value) {
      return
    }

    const merged = mergeUniqueOptions(
      isServerSearch ? searchOptions.value : browseOptions.value,
      pageOptions,
    )
    const options = ensureSelectedInOptions(merged)
    const hasMoreNext = resolveStaffWithoutSystemUserHasMore(
      pagination,
      options.length,
    )

    if (isServerSearch) {
      searchOptions.value = options
      searchPage.value = nextPage
      searchHasMore.value = hasMoreNext
    } else {
      browseOptions.value = options
      browsePage.value = nextPage
      browseHasMore.value = hasMoreNext
    }

    filteredOptions.value = options
    await nextTick()
    if (typeof virtualScrollRef?.refresh === 'function') {
      virtualScrollRef.refresh(scrollIndex)
    }
  } finally {
    if (currentRequestId === requestId.value) {
      loadingMore.value = false
    }
  }
}

async function bootstrapBrowseOptions() {
  if (!props.active || browseOptions.value.length) {
    return
  }

  const currentRequestId = requestId.value
  try {
    await loadFirstPage({ query: '', currentRequestId })
  } catch {
    if (currentRequestId === requestId.value) {
      filteredOptions.value = []
      browseOptions.value = []
      browseHasMore.value = false
    }
  }
}

function restoreBrowseList(update) {
  const apply = () => {
    filteredOptions.value = ensureSelectedInOptions(browseOptions.value)
  }

  if (update) {
    update(apply)
  } else {
    apply()
  }
}

function onFilter(val, update, abort) {
  filterNeedle.value = String(val ?? '')
  const q = filterNeedle.value.trim()
  const currentRequestId = ++requestId.value

  if (q.length > 0 && !isStaffListServerSearchQuery(q)) {
    update(() => {
      filteredOptions.value = selectedOption.value
        ? [selectedOption.value]
        : []
    })

    return
  }

  if (!q && browseOptions.value.length) {
    userScrolled.value = false
    restoreBrowseList(update)

    return
  }

  void (async() => {
    const isServerSearch = isStaffListServerSearchQuery(q)
    if (isServerSearch) {
      userScrolled.value = false
      searchLoading.value = true
    }

    try {
      await loadFirstPage({ query: q, currentRequestId })
      if (currentRequestId !== requestId.value) {
        return
      }

      update(() => {
        filteredOptions.value = ensureSelectedInOptions(
          isServerSearch
            ? searchOptions.value
            : browseOptions.value,
        )
      })
    } catch {
      if (currentRequestId === requestId.value) {
        abort()
      }
    } finally {
      if (isServerSearch && currentRequestId === requestId.value) {
        searchLoading.value = false
      }
    }
  })()
}

function onPopupShow() {
  userScrolled.value = false
  void bootstrapBrowseOptions()
}

function onPopupHide() {
  userScrolled.value = false
}

function onVirtualScroll({
  from,
  to,
  direction,
  ref: virtualScrollRef,
}) {
  if (from > 0) {
    userScrolled.value = true
  }

  const lastIndex = filteredOptions.value.length - 1
  if (
    !userScrolled.value
    || lastIndex < 0
    || to !== lastIndex
    || direction === 'decrease'
    || loadingMore.value
    || searchLoading.value
  ) {
    return
  }

  void loadNextPage(virtualScrollRef)
}

function onSelected(value) {
  emit('update:modelValue', value ?? null)
  if (!value) {
    selectedOption.value = null

    return
  }

  const match = filteredOptions.value.find(
    option => option.value === value,
  )
  if (match) {
    selectedOption.value = match
  }
}

watch(
  () => props.active,
  (isActive) => {
    if (!isActive) {
      resetState()
      return
    }
    void bootstrapBrowseOptions()
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      selectedOption.value = null
      return
    }
    const match = filteredOptions.value.find(
      option => option.value === value,
    )
    if (match) {
      selectedOption.value = match
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.staff-without-system-user-select__selected-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
