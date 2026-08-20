<template>
  <div
    class="encounter-workspace-overview"
    :data-testid="tid.overview">
    <section class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <h2>{{ t('encounterCompleteVisitTitle') }}</h2>
        <div class="encounter-workspace-overview__progress">
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ progressLabel }}
          </p>
          <div
            class="encounter-workspace-overview__progress-bar"
            aria-hidden="true">
            <span :style="{ width: `${progressPct}%` }" />
          </div>
        </div>
      </div>

      <div
        class="encounter-workspace-checklist"
        :data-testid="tid.checklist">
        <div
          v-for="item in requirements"
          :key="item.id || item.code || item.label"
          class="encounter-workspace-checklist__item"
          :class="{
            'encounter-workspace-checklist__item--done': item.completed,
            'encounter-workspace-checklist__item--required':
              item.required && !item.completed,
          }">
          <q-icon
            :name="item.completed ? 'check_circle' : 'radio_button_unchecked'"
            :color="item.completed ? 'positive' : 'warning'"
            size="22px"
          />
          <div class="encounter-workspace-checklist__body">
            <div class="row items-center q-gutter-sm">
              <strong>{{ item.label || item.code }}</strong>
              <q-badge
                v-if="item.required && !item.completed"
                color="orange"
                outline>
                {{ t('encounterRequired') }}
              </q-badge>
              <q-badge
                v-if="item.status === waivedStatus"
                color="grey"
                outline>
                {{ t('encounterRequirementWaived') }}
              </q-badge>
            </div>
            <p
              v-if="item.description"
              class="text-body2 text-grey-7 q-mb-none">
              {{ item.description }}
            </p>
          </div>
          <div class="encounter-workspace-checklist__actions">
            <q-btn
              v-if="!item.completed && item.actionLabel"
              no-caps
              unelevated
              color="primary"
              class="app-btn-primary"
              dense
              :label="item.actionLabel"
              :data-testid="tid.overviewAction(item.code)"
              @click="emit('requirement-action', item)"
            />
            <q-btn
              v-if="canWaiveRequirement
                && !item.completed
                && item.waivable
                && item.id != null"
              no-caps
              flat
              dense
              color="grey-7"
              :label="t('encounterRequirementWaive')"
              :data-testid="tid.overviewWaive(item.code)"
              @click="emit('waive-requirement', item)"
            />
          </div>
        </div>
        <p
          v-if="!requirements.length"
          class="text-body2 text-grey-7 q-mb-none">
          {{ t('encounterChecklistEmpty') }}
        </p>
      </div>

      <div
        v-if="optionalActions.length"
        class="encounter-workspace-optional q-mt-lg"
        :data-testid="tid.optionalActions">
        <h3>{{ t('encounterOtherClinicalActions') }}</h3>
        <div class="encounter-workspace-checklist">
          <div
            v-for="item in optionalActions"
            :key="`opt-${item.id || item.code || item.label}`"
            class="encounter-workspace-checklist__item">
            <q-icon
              name="info"
              color="primary"
              size="22px"
            />
            <div class="encounter-workspace-checklist__body">
              <strong>{{ item.label || item.code }}</strong>
              <p
                v-if="item.description"
                class="text-body2 text-grey-7 q-mb-none">
                {{ item.description }}
              </p>
            </div>
            <q-btn
              v-if="item.actionLabel"
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              dense
              :label="item.actionLabel"
              :data-testid="tid.overviewOptional(item.code)"
              @click="emit('requirement-action', item)"
            />
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="openProcessingIssues.length"
      class="encounter-workspace-card"
      :data-testid="tid.processingIssues">
      <div class="encounter-workspace-card__head">
        <div>
          <h2>{{ t('encounterProcessingTitle') }}</h2>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('encounterProcessingSubtitle') }}
          </p>
        </div>
      </div>
      <div
        v-for="issue in openProcessingIssues"
        :key="issue.processType"
        class="encounter-workspace-checklist__item q-mb-sm">
        <q-icon
          name="warning"
          color="warning"
          size="22px"
        />
        <div class="encounter-workspace-checklist__body">
          <strong>{{ processingLabel(issue) }}</strong>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ issue.userSafeMessage
              || t('encounterProcessingFailedFallback') }}
          </p>
        </div>
        <q-btn
          v-if="canRetryProcessing"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          dense
          :data-testid="tid.processingRetry(issue.processType)"
          :label="t('encounterProcessingRetry')"
          @click="emit('retry-processing', issue.processType)"
        />
      </div>
    </section>

    <section
      v-if="generatedNote || generationFailed"
      class="encounter-workspace-card"
      :data-testid="tid.generatedNote">
      <div class="encounter-workspace-card__head">
        <div>
          <h2>{{ t('encounterGeneratedNoteTitle') }}</h2>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ generatedNote?.templateName
              || t('encounterGeneratedNoteTitle') }}
          </p>
        </div>
        <AdminTableStatusCell
          :label="generatedStatusLabel"
          :variant="generatedStatusVariant"
        />
      </div>
      <p
        v-if="generationFailed"
        class="text-body2 text-negative q-mb-md">
        {{ t('encounterGeneratedNoteFailed') }}
      </p>
      <div
        v-else-if="generatedStale"
        class="encounter-workspace-billing__banner
          encounter-workspace-billing__banner--alert q-mb-md"
        :data-testid="tid.generatedNoteStale">
        <q-icon name="warning" color="warning" size="20px" />
        <div>
          <p class="q-mb-xs">
            {{ t('encounterGeneratedNoteStaleTitle') }}
          </p>
          <p class="q-mb-none">
            {{ t('encounterGeneratedNoteStaleBody') }}
          </p>
        </div>
      </div>
      <p
        v-else-if="generatedUnsigned"
        class="text-body2 text-grey-7 q-mb-md">
        {{ t('encounterGeneratedNoteReady') }}
      </p>
      <div class="row q-gutter-sm">
        <q-btn
          v-if="generationFailed && canRetryProcessing"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('encounterGeneratedNoteRetry')"
          :data-testid="tid.generatedNoteRetry"
          @click="emit('retry-generate')"
        />
        <q-btn
          v-else-if="!generationFailed"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('encounterGeneratedNoteReview')"
          :data-testid="tid.generatedNoteReview"
          @click="emit('review-generated-note')"
        />
        <q-btn
          v-if="generatedStale && canRegenerate"
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :label="t('encounterGeneratedNoteRegenerateShort')"
          :data-testid="tid.generatedNoteRegenerate"
          @click="emit('regenerate-generated-note')"
        />
      </div>
    </section>

    <section
      class="encounter-workspace-card encounter-workspace-billing"
      :data-testid="tid.billing">
      <div class="encounter-workspace-card__head">
        <h2>{{ t('encounterBillingReadiness') }}</h2>
        <AdminTableStatusCell
          :label="billingLabel"
          :variant="billingVariant"
        />
      </div>

      <div
        v-if="billingIsClear"
        class="encounter-workspace-billing__banner
          encounter-workspace-billing__banner--ready">
        <q-icon name="check_circle" color="positive" size="22px" />
        <div>
          <strong>{{ billingLabel }}</strong>
          <p class="text-body2 text-grey-7 q-mb-none">
            {{ t('encounterBillingReadyBody') }}
          </p>
        </div>
      </div>
      <div
        v-else-if="billingIssueCount"
        class="encounter-workspace-billing__banner
          encounter-workspace-billing__banner--alert">
        {{ t('encounterBillingAlert', {
          count: billingIssueCount,
        }) }}
      </div>

      <div
        v-if="billingChecks.length"
        class="encounter-workspace-checklist">
        <div
          v-for="check in billingChecks"
          :key="billingCheckKey(check)"
          class="encounter-workspace-checklist__item">
          <q-icon
            :name="billingCheckIcon(check)"
            :color="billingCheckColor(check)"
            size="22px"
          />
          <div class="encounter-workspace-checklist__body">
            <strong>{{ billingCheckTitle(check) }}</strong>
            <p
              v-if="check.message && !check.passed"
              class="text-body2 text-grey-7 q-mb-none">
              {{ check.message }}
            </p>
            <p
              v-else-if="check.serviceName"
              class="text-caption text-grey-7 q-mb-none">
              {{ check.serviceName }}
            </p>
          </div>
        </div>
      </div>
      <p
        v-else
        class="text-body2 text-grey-7 q-mb-none">
        {{ t('encounterBillingEmpty') }}
      </p>

      <div
        v-if="superbill?.id"
        class="encounter-workspace-billing__superbill">
        <div class="encounter-workspace-billing__superbill-row">
          <strong>{{ superbill.superbillNumber }}</strong>
          <AdminTableStatusCell
            :label="superbillStatusLabel"
            :variant="superbillVariant"
          />
        </div>
        <q-btn
          v-if="showViewSuperbill"
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          :data-testid="tid.viewSuperbill"
          :label="t('superbillViewFromEncounter')"
          @click="emit('view-superbill')"
        />
      </div>
      <div
        v-else-if="showGenerateSuperbill"
        class="encounter-workspace-billing__superbill">
        <p class="text-body2 text-grey-7 q-mb-sm">
          {{ t('superbillNoneYet') }}
        </p>
        <q-btn
          no-caps
          outline
          dense
          color="primary"
          class="app-btn-outline"
          :data-testid="tid.generateSuperbill"
          :label="t('superbillGenerateRetry')"
          @click="emit('generate-superbill')"
        />
      </div>
    </section>

    <aside class="encounter-workspace-card">
      <div class="encounter-workspace-card__head">
        <h2>{{ t('encounterQuickActions') }}</h2>
      </div>
      <div class="encounter-workspace-quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.key"
          type="button"
          class="encounter-workspace-quick-actions__item"
          @click="emit('quick-action', action.key)">
          <span
            class="encounter-workspace-quick-actions__icon"
            :class="`encounter-workspace-quick-actions__icon--${
              action.tone
            }`">
            <q-icon :name="action.icon" size="18px" />
          </span>
          <span class="encounter-workspace-quick-actions__label">
            {{ action.label }}
          </span>
          <q-icon name="chevron_right" size="18px" color="grey-6" />
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminTableStatusCell from
  'components/admin-table/AdminTableStatusCell.vue'
import {
  clinicalNoteStatuses,
  encounterBillingReadinessStatuses,
  encounterRequirementStatuses,
  encounterRequirementTypes,
  superbillStatuses,
} from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/index.js'
import {
  isReviewOfSystemsSection,
  parseReviewOfSystemsValues,
  reviewOfSystemsIssues,
} from 'src/utils/review-of-systems.js'
import {
  isPhysicalExamSection,
  parsePhysicalExamValues,
  physicalExamIssues,
} from 'src/utils/physical-exam.js'
import {
  isMentalStatusExamSection,
  mseIssues,
  parseMentalStatusExamValues,
} from 'src/utils/mental-status-exam.js'
import {
  assessmentPlanIssues,
  isAssessmentPlanSection,
  resolveAssessmentPlanRows,
} from 'src/utils/assessment-plan.js'

const props = defineProps({
  completion: {
    type: Object,
    default: () => ({}),
  },
  billingReadiness: {
    type: Object,
    default: () => ({}),
  },
  superbill: {
    type: Object,
    default: null,
  },
  showGenerateSuperbill: {
    type: Boolean,
    default: false,
  },
  showViewSuperbill: {
    type: Boolean,
    default: false,
  },
  canWaiveRequirement: {
    type: Boolean,
    default: false,
  },
  narrative: {
    type: Object,
    default: null,
  },
  diagnoses: {
    type: Array,
    default: () => [],
  },
  generatedNote: {
    type: Object,
    default: null,
  },
  processingIssues: {
    type: Array,
    default: () => [],
  },
  canRetryProcessing: {
    type: Boolean,
    default: false,
  },
  canRegenerate: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'requirement-action',
  'quick-action',
  'waive-requirement',
  'view-superbill',
  'generate-superbill',
  'review-generated-note',
  'retry-generate',
  'retry-processing',
  'regenerate-generated-note',
])
const { t } = useI18n()

const waivedStatus = encounterRequirementStatuses.waived

const generationFailed = computed(() =>
  Boolean(props.generatedNote?.generationFailed),
)

const openProcessingIssues = computed(() =>
  (props.processingIssues || []).filter(issue => issue?.isOpen),
)

function processingLabel(issue) {
  if (issue?.processType === 'SUPERBILL_GENERATION') {
    return t('encounterProcessingSuperbillFailed')
  }
  if (issue?.processType === 'CLINICAL_NOTE_GENERATION') {
    return t('encounterProcessingNoteFailed')
  }

  return t('encounterProcessingFailedFallback')
}

const generatedUnsigned = computed(() => {
  const status = String(props.generatedNote?.status ?? '').toUpperCase()

  return Boolean(props.generatedNote?.id)
    && status !== clinicalNoteStatuses.signed
    && status !== clinicalNoteStatuses.amended
    && status !== clinicalNoteStatuses.voided
})

const generatedStale = computed(() =>
  generatedUnsigned.value
  && Boolean(props.generatedNote?.regenerationRequired),
)

const generatedStatusLabel = computed(() => {
  const status = String(props.generatedNote?.status ?? '').toUpperCase()
  if (status === clinicalNoteStatuses.signed) {
    return t('clinicalNoteStatusSigned')
  }
  if (status === clinicalNoteStatuses.amended) {
    return t('clinicalNoteStatusAmended')
  }
  if (status === clinicalNoteStatuses.voided) {
    return t('clinicalNoteStatusVoided')
  }
  if (status === clinicalNoteStatuses.generated) {
    return t('clinicalNoteStatusGenerated')
  }

  return t('clinicalNoteStatusDraft')
})

const generatedStatusVariant = computed(() => {
  const status = String(props.generatedNote?.status ?? '').toUpperCase()
  if (status === clinicalNoteStatuses.signed
    || status === clinicalNoteStatuses.amended) {
    return 'active'
  }
  if (status === clinicalNoteStatuses.voided) {
    return 'inactive'
  }

  return 'pending'
})

const requirements = computed(() => {
  const list = Array.isArray(props.completion?.requirements)
    ? props.completion.requirements
    : []

  return list.map(item => {
    if (item.type !== encounterRequirementTypes.narrative
      || item.completed) {
      return item
    }
    const required = props.narrative?.requiredCount ?? 0
    const done = props.narrative?.completedRequiredCount ?? 0
    const missing = Math.max(0, required - done)
    const rosIncomplete = (props.narrative?.fields || [])
      .filter(field => isReviewOfSystemsSection(field))
      .some(field => reviewOfSystemsIssues(
        parseReviewOfSystemsValues(field.valueJson),
        Boolean(field.required),
      ).length > 0)
    const peIncomplete = (props.narrative?.fields || [])
      .filter(field => isPhysicalExamSection(field))
      .some(field => physicalExamIssues(
        parsePhysicalExamValues(field.valueJson),
        Boolean(field.required),
      ).length > 0)
    const mseIncomplete = (props.narrative?.fields || [])
      .filter(field => isMentalStatusExamSection(field))
      .some(field => mseIssues(
        parseMentalStatusExamValues(field.valueJson),
        Boolean(field.required),
      ).length > 0)
    const apField = (props.narrative?.fields || [])
      .find(field => isAssessmentPlanSection(field))
    const apRows = apField
      ? resolveAssessmentPlanRows(props.diagnoses, apField.valueJson)
      : []
    const apIssues = apField
      ? assessmentPlanIssues(apRows, Boolean(apField.required))
      : []
    const apIncomplete = apIssues.length > 0
    const noDiagnoses = !(props.diagnoses || []).length
    const diagnosisIncomplete = list.some(req =>
      req.type === encounterRequirementTypes.diagnosis
      && !req.completed)
    if (apIncomplete && noDiagnoses && diagnosisIncomplete) {
      return item
    }
    if (apIncomplete && missing <= 1) {
      const missingPlans = apIssues.filter(issue => issue.diagnosis).length

      return {
        ...item,
        description: missingPlans
          ? t('encounterNarrativeApIncompleteDetail', missingPlans)
          : t('encounterNarrativeApIncomplete'),
      }
    }
    if (peIncomplete && missing <= 1) {
      return {
        ...item,
        description: t('encounterNarrativePeIncomplete'),
      }
    }
    if (mseIncomplete && missing <= 1) {
      return {
        ...item,
        description: t('encounterNarrativeMseIncomplete'),
      }
    }
    if (rosIncomplete && missing <= 1) {
      return {
        ...item,
        description: t('encounterNarrativeRosIncomplete'),
      }
    }
    if (!missing) {
      return item
    }

    return {
      ...item,
      description: t('encounterNarrativeIncomplete', missing),
    }
  })
})

const optionalActions = computed(() =>
  Array.isArray(props.completion?.optionalActions)
    ? props.completion.optionalActions
    : [],
)

const completedCount = computed(() =>
  props.completion?.satisfiedCount
  ?? props.completion?.completedCount
  ?? 0,
)

const requiredCount = computed(() =>
  props.completion?.requiredCount ?? 0,
)

const progressPct = computed(() => {
  if (!requiredCount.value) {
    return 100
  }

  return Math.min(
    100,
    Math.round((completedCount.value / requiredCount.value) * 100),
  )
})

const progressLabel = computed(() =>
  t('encounterProgressLabel', {
    completed: completedCount.value,
    total: requiredCount.value,
  }),
)

const billingChecks = computed(() =>
  Array.isArray(props.billingReadiness?.checks)
    ? props.billingReadiness.checks
    : [],
)

const billingLabel = computed(() => {
  const status = props.billingReadiness?.status
  if (status === encounterBillingReadinessStatuses.ready) {
    return t('encounterBillingReady')
  }
  if (status === encounterBillingReadinessStatuses.billed) {
    return t('encounterBillingBilled')
  }

  return t('encounterBillingNotReady')
})

const billingVariant = computed(() => {
  const status = props.billingReadiness?.status
  if (status === encounterBillingReadinessStatuses.ready) {
    return 'active'
  }
  if (status === encounterBillingReadinessStatuses.billed) {
    return 'completed'
  }

  return 'pending'
})

const billingIsClear = computed(() => {
  const status = props.billingReadiness?.status

  return status === encounterBillingReadinessStatuses.ready
    || status === encounterBillingReadinessStatuses.billed
})

const billingIssueCount = computed(() => {
  const blocking = props.billingReadiness?.blockingCount ?? 0
  const warning = props.billingReadiness?.warningCount ?? 0

  return blocking + warning
})

const superbillStatusLabel = computed(() => {
  const status = props.superbill?.status
  if (status === superbillStatuses.ready) {
    return t('superbillStatusReady')
  }
  if (status === superbillStatuses.reviewed) {
    return t('superbillStatusReviewed')
  }
  if (status === superbillStatuses.voided) {
    return t('superbillStatusVoided')
  }

  return t('superbillStatusNotReady')
})

const superbillVariant = computed(() => {
  const status = props.superbill?.status
  if (status === superbillStatuses.ready) {
    return 'active'
  }
  if (status === superbillStatuses.reviewed) {
    return 'completed'
  }
  if (status === superbillStatuses.voided) {
    return 'inactive'
  }

  return 'pending'
})

function billingCheckKey(check) {
  return [
    check.code,
    check.serviceLineId,
    check.label,
  ].filter(Boolean).join('-')
}

function billingCheckIcon(check) {
  if (check.passed) {
    return 'check_circle'
  }
  if (check.severity === 'WARNING') {
    return 'error_outline'
  }

  return 'cancel'
}

function billingCheckColor(check) {
  if (check.passed) {
    return 'positive'
  }
  if (check.severity === 'WARNING') {
    return 'warning'
  }

  return 'negative'
}

function billingCheckTitle(check) {
  return check.label
    || check.title
    || check.serviceName
    || check.code
    || check.message
}

const quickActions = computed(() => [
  {
    key: 'vitals',
    label: t('encounterQuickAddVitals'),
    icon: 'favorite',
    tone: 'purple',
  },
  {
    key: 'medications',
    label: t('encounterQuickMedications'),
    icon: 'medication',
    tone: 'blue',
  },
  {
    key: 'care-plans',
    label: t('encounterQuickCarePlan'),
    icon: 'assignment',
    tone: 'green',
  },
  {
    key: 'follow-up',
    label: t('encounterQuickFollowUp'),
    icon: 'event',
    tone: 'orange',
  },
  {
    key: 'documents',
    label: t('encounterQuickDocument'),
    icon: 'attach_file',
    tone: 'blue',
  },
])
</script>
