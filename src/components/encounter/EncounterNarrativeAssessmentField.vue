<template>
  <div
    class="encounter-narrative-assessment"
    :data-testid="tid.narrativeAssessment(field.fieldKey)">
    <p class="text-body2 text-grey-7 q-mb-sm">
      {{ statusLabel }}
    </p>
    <p
      v-if="resultSummary"
      class="text-body2 q-mb-sm">
      {{ resultSummary }}
    </p>
    <div class="row q-gutter-sm">
      <q-btn
        v-if="showComplete"
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        :label="t('encounterNarrativeCompleteAssessment')"
        :data-testid="tid.narrativeAssessmentComplete(
          field.fieldKey,
        )"
        @click="emit('complete')"
      />
      <q-btn
        v-if="showView"
        no-caps
        outline
        color="primary"
        class="app-btn-outline"
        :label="t('screeningActionView')"
        :data-testid="tid.narrativeAssessmentView(
          field.fieldKey,
        )"
        @click="emit('view')"
      />
      <q-btn
        v-if="showEdit"
        no-caps
        unelevated
        color="primary"
        class="app-btn-primary"
        :label="t('edit')"
        :data-testid="tid.narrativeAssessmentEdit(
          field.fieldKey,
        )"
        @click="emit('edit')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { screeningStatuses } from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  canView: {
    type: Boolean,
    default: false,
  },
  canAdd: {
    type: Boolean,
    default: false,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['complete', 'view', 'edit'])
const { t } = useI18n()

const screeningId = computed(() => props.field?.screeningId ?? null)
const status = computed(() =>
  String(props.field?.screeningStatus ?? '').toLowerCase(),
)

const statusLabel = computed(() => {
  if (status.value === screeningStatuses.completed) {
    return t('screeningStatusCompleted')
  }
  if (status.value === screeningStatuses.draft) {
    return t('screeningStatusInProgress')
  }
  if (status.value === screeningStatuses.cancelled) {
    return t('screeningStatusCancelled')
  }

  return t('encounterNarrativeAssessmentNotCompleted')
})

const resultSummary = computed(() => {
  if (status.value !== screeningStatuses.completed) {
    return ''
  }
  const score = props.field?.screeningTotalScore
  const interpretation = String(
    props.field?.screeningInterpretationLabel ?? '',
  ).trim()
  const parts = []
  if (score != null && score !== '') {
    parts.push(`${t('screeningOverallScore')}: ${score}`)
  }
  if (interpretation) {
    parts.push(`${t('screeningInterpretation')}: ${interpretation}`)
  }

  return parts.join(' · ')
})

const showComplete = computed(() =>
  props.canAdd && screeningId.value == null,
)

const showView = computed(() =>
  props.canView && screeningId.value != null,
)

const showEdit = computed(() =>
  props.canEdit
    && screeningId.value != null
    && status.value === screeningStatuses.draft,
)
</script>
