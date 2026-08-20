<template>
  <section
    class="encounter-workspace-card"
    :data-testid="tid.qualityMeasures">
    <div class="encounter-workspace-card__head">
      <div>
        <h2>{{ t('encounterClinicalQualityMeasures') }}</h2>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterClinicalQualityMeasuresHint') }}
        </p>
      </div>
    </div>

    <p class="text-body2 text-grey-7 q-mb-md">
      {{ t('encounterClinicalQualityMeasuresNote') }}
    </p>

    <div
      v-if="loading"
      class="row flex-center q-pa-lg">
      <q-spinner color="primary" size="32px" />
    </div>

    <p
      v-else-if="loadError"
      class="text-body2 text-negative q-mb-none">
      {{ loadError }}
    </p>

    <div
      v-else-if="measures.length"
      class="add-client-form__fmh-list-card">
      <div
        v-for="measure in measures"
        :key="measure.code"
        class="encounter-quality-measure-row">
        <FormToggle
          :model-value="measure.addressed"
          :label="measure.displayName"
          :disable="!canEdit || savingCode === measure.code"
          :test-id="tid.qualityMeasure(measure.code)"
          @update:model-value="value => onToggle(measure, value)"
        />
        <p
          v-if="measure.addressed"
          class="text-caption text-grey-7 q-mb-none
            encounter-quality-measure-row__meta">
          {{ addressedMeta(measure) }}
        </p>
      </div>
    </div>

    <p
      v-else
      class="text-body2 text-grey-7 q-mb-none">
      {{ t('encounterClinicalQualityMeasuresEmpty') }}
    </p>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import FormToggle from 'components/FormToggle.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'
import { formatDateTime } from 'src/utils/app-datetime.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import {
  addressEncounterQualityMeasure,
  listEncounterQualityMeasures,
  removeEncounterQualityMeasure,
} from 'src/utils/quality-measure-api.js'

const props = defineProps({
  encounterId: {
    type: [Number, String],
    default: null,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['changed'])
const { t } = useI18n()
const $q = useQuasar()

const measures = ref([])
const loading = ref(false)
const loadError = ref('')
const savingCode = ref('')

watch(
  () => props.encounterId,
  () => {
    void loadMeasures()
  },
)

onMounted(() => {
  void loadMeasures()
})

async function loadMeasures() {
  const encounterId = props.encounterId
  if (encounterId == null || String(encounterId).trim() === '') {
    measures.value = []

    return
  }
  loading.value = true
  loadError.value = ''
  try {
    measures.value = await listEncounterQualityMeasures(encounterId)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      loadError.value = t('encounterClinicalQualityMeasuresLoadError')
    }
  } finally {
    loading.value = false
  }
}

function addressedMeta(measure) {
  const name = String(measure?.addressedByName ?? '').trim()
  const when = formatDateTime(measure?.addressedAt)
  if (name && when) {
    return t('encounterClinicalQualityMeasuresAddressedByAt', {
      name,
      date: when,
    })
  }
  if (name) {
    return t('encounterClinicalQualityMeasuresAddressedBy', {
      name,
    })
  }
  if (when) {
    return t('encounterClinicalQualityMeasuresAddressedAt', {
      date: when,
    })
  }

  return ''
}

async function onToggle(measure, addressed) {
  const encounterId = props.encounterId
  if (!props.canEdit || encounterId == null || !measure?.code) {
    return
  }
  const previous = measure.addressed
  measure.addressed = addressed
  savingCode.value = measure.code
  try {
    if (addressed) {
      const saved = await addressEncounterQualityMeasure(
        encounterId,
        measure.code,
      )
      Object.assign(measure, saved, { addressed: true })
    } else {
      await removeEncounterQualityMeasure(
        encounterId,
        measure.code,
      )
      measure.addressed = false
      measure.addressedBy = null
      measure.addressedByName = ''
      measure.addressedAt = null
      measure.id = null
    }
    emit('changed')
  } catch (error) {
    measure.addressed = previous
    if (!isAuthSessionEndUIError(error)) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('encounterClinicalQualityMeasuresSaveError'),
      })
    }
  } finally {
    savingCode.value = ''
  }
}
</script>

<style lang="scss" scoped>
.encounter-quality-measure-row {
  padding: 12px 16px;

  & + & {
    border-top: 1px solid $border-subtle;
  }
}

.encounter-quality-measure-row__meta {
  margin-left: 52px;
}
</style>
