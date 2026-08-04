<template>
  <div
    v-if="available && !readonly"
    class="pharmacy-places-search">
    <SubsectionHeading
      icon="search"
      :title="t('pharmacyPlacesSearch')"
    />
    <div class="row q-col-gutter-md q-mt-md items-end">
      <div class="col">
        <AddClientLabeledField
          :label="t('pharmacyPlacesQuery')"
          :test-id="fieldTestId('query')">
          <q-input
            v-model="query"
            outlined
            hide-bottom-space
            clearable
            :placeholder="t('pharmacyPlacesQueryPlaceholder')"
            :data-testid="fieldTestId('query')"
            @keyup.enter="onSearch"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </AddClientLabeledField>
      </div>
      <div class="col-auto">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :loading="loading"
          :disable="!queryTrimmed"
          :label="t('pharmacyPlacesSearchBtn')"
          :data-testid="btnTestId('search')"
          @click="onSearch"
        />
      </div>
    </div>

    <p
      v-if="error"
      class="text-negative text-caption q-mt-sm q-mb-none">
      {{ error }}
    </p>

    <div
      v-if="searched && !loading"
      class="pharmacy-places-search__results q-mt-sm">
      <q-list
        v-if="results.length"
        bordered
        separator
        class="rounded-borders">
        <q-item
          v-for="result in results"
          :key="result.placeId"
          v-ripple
          clickable
          :data-testid="btnTestId(`result-${result.placeId}`)"
          @click="onSelect(result)">
          <q-item-section>
            <q-item-label>{{ result.name }}</q-item-label>
            <q-item-label caption>{{ result.address }}</q-item-label>
          </q-item-section>
          <q-item-section
            v-if="detailLoadingId === result.placeId"
            side>
            <q-spinner size="18px" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
      <p v-else class="text-caption text-grey-7 q-mb-none">
        {{ t('pharmacyPlacesEmpty') }}
      </p>
    </div>

    <p
      v-if="showOsmAttribution"
      class="text-caption text-grey-6 q-mt-sm q-mb-none">
      {{ t('pharmacyPlacesOsmAttribution') }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import AddClientLabeledField from 'components/AddClientLabeledField.vue'
import SubsectionHeading from 'components/SubsectionHeading.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import {
  fetchPlaceDetails,
  isAddressPlaceSearchAvailable,
  searchPlaces,
} from 'src/utils/address-places-search.js'

const props = defineProps({
  readonly: {
    type: Boolean,
    default: false,
  },
  resetKey: {
    type: [String, Number, Boolean],
    default: null,
  },
  testIdPrefix: {
    type: String,
    default: 'pharmacy-places',
  },
})

const emit = defineEmits(['select'])

const { t } = useI18n()
const $q = useQuasar()

const query = ref('')
const results = ref([])
const searched = ref(false)
const loading = ref(false)
const error = ref('')
const detailLoadingId = ref(null)
const providerUsed = ref('')

const available = computed(() => isAddressPlaceSearchAvailable())
const queryTrimmed = computed(() => String(query.value ?? '').trim())

const showOsmAttribution = computed(
  () => providerUsed.value === 'photon'
    || results.value.some(row => row.provider === 'photon'),
)

function fieldTestId(name) {
  return `${props.testIdPrefix}-field-${name}`
}

function btnTestId(name) {
  return `${props.testIdPrefix}-btn-${name}`
}

function resetState() {
  query.value = ''
  results.value = []
  searched.value = false
  error.value = ''
  detailLoadingId.value = null
  providerUsed.value = ''
}

function errorMessage(err) {
  const message = String(err?.message ?? '')

  return message.includes('not configured') || message.includes('browser')
    ? t('pharmacyPlacesUnavailable')
    : t('pharmacyPlacesError')
}

async function onSearch() {
  const q = queryTrimmed.value
  if (!q) {
    return
  }
  loading.value = true
  error.value = ''
  providerUsed.value = ''
  try {
    const list = await searchPlaces({
      q,
      kind: 'pharmacy',
    })
    results.value = list
    providerUsed.value = list[0]?.provider || 'photon'
  } catch (err) {
    results.value = []
    error.value = errorMessage(err)
  } finally {
    searched.value = true
    loading.value = false
  }
}

async function onSelect(result) {
  detailLoadingId.value = result.placeId
  try {
    const details = await fetchPlaceDetails(result)
    emit('select', details)
  } catch (err) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: errorMessage(err),
      position: 'top',
    })
  } finally {
    detailLoadingId.value = null
  }
}

watch(
  () => props.resetKey,
  () => {
    resetState()
  },
)

watch(queryTrimmed, value => {
  if (value) {
    return
  }
  results.value = []
  searched.value = false
  error.value = ''
  detailLoadingId.value = null
  providerUsed.value = ''
})

defineExpose({ resetState })
</script>

<style lang="scss" scoped>
.pharmacy-places-search__results {
  max-height: 220px;
  overflow-y: auto;
}
</style>
