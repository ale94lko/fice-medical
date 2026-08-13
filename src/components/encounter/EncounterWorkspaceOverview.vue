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
              @click="emit('requirement-action', item)"
            />
            <q-btn
              v-if="!item.completed && item.waivable && item.id != null"
              no-caps
              flat
              dense
              color="grey-7"
              :label="t('encounterRequirementWaive')"
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
              @click="emit('requirement-action', item)"
            />
          </div>
        </div>
      </div>
    </section>

    <aside class="encounter-workspace-card">
      <h2>{{ t('encounterQuickActions') }}</h2>
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

      <div
        class="encounter-workspace-billing q-mt-lg"
        :data-testid="tid.billing">
        <h3>{{ t('encounterBillingReadiness') }}</h3>
        <q-badge
          :color="billingTone"
          outline>
          {{ billingLabel }}
        </q-badge>
        <p
          v-if="billingMetaLabel"
          class="text-body2 text-grey-7 q-mb-none q-mt-sm">
          {{ billingMetaLabel }}
        </p>
        <ul
          v-if="billingChecks.length"
          class="encounter-workspace-billing__checks">
          <li
            v-for="check in billingChecks"
            :key="check.code || check.label">
            <q-icon
              :name="check.passed ? 'check' : 'close'"
              :color="check.passed ? 'positive' : 'negative'"
              size="16px"
            />
            <span>{{ check.label || check.message }}</span>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  encounterBillingReadinessStatuses,
  encounterRequirementStatuses,
} from 'components/constants.js'
import { encounterWorkspaceTestIds as tid } from
  'src/test-ids/encounter-workspace.js'

const props = defineProps({
  completion: {
    type: Object,
    default: () => ({}),
  },
  billingReadiness: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'requirement-action',
  'quick-action',
  'waive-requirement',
])
const { t } = useI18n()

const waivedStatus = encounterRequirementStatuses.waived

const requirements = computed(() =>
  Array.isArray(props.completion?.requirements)
    ? props.completion.requirements
    : [],
)

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

const billingTone = computed(() => {
  const status = props.billingReadiness?.status
  if (status === encounterBillingReadinessStatuses.ready) {
    return 'positive'
  }
  if (status === encounterBillingReadinessStatuses.billed) {
    return 'primary'
  }

  return 'warning'
})

const billingMetaLabel = computed(() => {
  const blocking = props.billingReadiness?.blockingCount
  const warning = props.billingReadiness?.warningCount
  if (blocking == null && warning == null) {
    return ''
  }

  return t('encounterBillingCounts', {
    blocking: blocking ?? 0,
    warning: warning ?? 0,
  })
})

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
