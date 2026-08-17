<template>
  <div class="client-list-summary billing-queue-summary
    row q-col-gutter-md">
    <div
      v-for="card in cards"
      :key="card.id"
      class="client-list-summary__col col-12 col-sm-6 col-md-3">
      <article
        class="client-list-summary__card"
        :class="{
          'client-list-summary__card--active': isActive(card.id),
        }"
        :data-testid="card.testId"
        role="button"
        tabindex="0"
        @click="emit('select', card.id)"
        @keydown.enter.prevent="emit('select', card.id)"
        @keydown.space.prevent="emit('select', card.id)">
        <div class="client-list-summary__card-main
          row items-center no-wrap">
          <p class="client-list-summary__card-value q-mb-none">
            {{ card.count }}
          </p>
          <div class="client-list-summary__card-copy col">
            <p class="client-list-summary__card-label q-mb-none">
              {{ card.label }}
            </p>
            <p class="client-list-summary__card-description q-mb-none">
              {{ card.description }}
            </p>
          </div>
          <div
            class="client-list-summary__card-icon"
            :class="`client-list-summary__card-icon--${card.tone}`">
            <q-icon :name="card.icon" size="18px" />
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { denialQueueTabs } from 'src/utils/denial-work-queue.js'
import { denialListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  active: {
    type: String,
    default: denialQueueTabs.needsReview,
  },
  counts: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select'])
const { t } = useI18n()

const cards = computed(() => [
  {
    id: denialQueueTabs.needsReview,
    label: t('denialQueueNeedsReview'),
    description: t('denialQueueNeedsReviewHint'),
    count: props.counts.needsReview ?? 0,
    icon: 'error_outline',
    tone: 'red',
    testId: denialListTestIds.queueTab(denialQueueTabs.needsReview),
  },
  {
    id: denialQueueTabs.inProgress,
    label: t('denialQueueInProgress'),
    description: t('denialQueueInProgressHint'),
    count: props.counts.inProgress ?? 0,
    icon: 'play_circle',
    tone: 'teal',
    testId: denialListTestIds.queueTab(denialQueueTabs.inProgress),
  },
  {
    id: denialQueueTabs.waiting,
    label: t('denialQueueWaiting'),
    description: t('denialQueueWaitingHint'),
    count: props.counts.waiting ?? 0,
    icon: 'hourglass_empty',
    tone: 'teal',
    testId: denialListTestIds.queueTab(denialQueueTabs.waiting),
  },
  {
    id: denialQueueTabs.readyForResubmission,
    label: t('denialQueueReady'),
    description: t('denialQueueReadyHint'),
    count: props.counts.readyForResubmission ?? 0,
    icon: 'task_alt',
    tone: 'green',
    testId: denialListTestIds.queueTab(
      denialQueueTabs.readyForResubmission,
    ),
  },
  {
    id: denialQueueTabs.appeal,
    label: t('denialQueueAppeal'),
    description: t('denialQueueAppealHint'),
    count: props.counts.appeal ?? 0,
    icon: 'gavel',
    tone: 'teal',
    testId: denialListTestIds.queueTab(denialQueueTabs.appeal),
  },
  {
    id: denialQueueTabs.resolved,
    label: t('denialQueueResolved'),
    description: t('denialQueueResolvedHint'),
    count: props.counts.resolved ?? 0,
    icon: 'check_circle',
    tone: 'green',
    testId: denialListTestIds.queueTab(denialQueueTabs.resolved),
  },
  {
    id: denialQueueTabs.all,
    label: t('denialQueueAll'),
    description: t('denialQueueAllHint'),
    count: props.counts.all ?? 0,
    icon: 'description',
    tone: 'teal',
    testId: denialListTestIds.queueTab(denialQueueTabs.all),
  },
])

function isActive(id) {
  return props.active === id
}
</script>
