<template>
  <div class="client-list-summary billing-queue-summary
    row q-col-gutter-md">
    <div
      v-for="card in cards"
      :key="card.id"
      class="client-list-summary__col col-12 col-sm-6 col-md-4 col-xl">
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
import { claimQueueTabs } from 'src/utils/claim-work-queue.js'
import { claimListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  active: {
    type: String,
    default: claimQueueTabs.needsAttention,
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
    id: claimQueueTabs.needsAttention,
    label: t('claimQueueNeedsAttention'),
    description: t('claimQueueNeedsAttentionHint'),
    count: props.counts.needsAttention ?? 0,
    icon: 'error_outline',
    tone: 'red',
    testId: claimListTestIds.queueTab(
      claimQueueTabs.needsAttention,
    ),
  },
  {
    id: claimQueueTabs.ready,
    label: t('claimQueueReady'),
    description: t('claimQueueReadyHint'),
    count: props.counts.ready ?? 0,
    icon: 'check_circle',
    tone: 'green',
    testId: claimListTestIds.queueTab(claimQueueTabs.ready),
  },
  {
    id: claimQueueTabs.submitted,
    label: t('claimQueueSubmitted'),
    description: t('claimQueueSubmittedHint'),
    count: props.counts.submitted ?? 0,
    icon: 'send',
    tone: 'teal',
    testId: claimListTestIds.queueTab(claimQueueTabs.submitted),
  },
  {
    id: claimQueueTabs.accepted,
    label: t('claimQueueAccepted'),
    description: t('claimQueueAcceptedHint'),
    count: props.counts.accepted ?? 0,
    icon: 'verified',
    tone: 'green',
    testId: claimListTestIds.queueTab(claimQueueTabs.accepted),
  },
  {
    id: claimQueueTabs.rejected,
    label: t('claimQueueRejected'),
    description: t('claimQueueRejectedHint'),
    count: props.counts.rejected ?? 0,
    icon: 'cancel',
    tone: 'red',
    testId: claimListTestIds.queueTab(claimQueueTabs.rejected),
  },
  {
    id: claimQueueTabs.paid,
    label: t('claimQueuePaid'),
    description: t('claimQueuePaidHint'),
    count: props.counts.paid ?? 0,
    icon: 'paid',
    tone: 'green',
    testId: claimListTestIds.queueTab(claimQueueTabs.paid),
  },
  {
    id: claimQueueTabs.partiallyPaid,
    label: t('claimQueuePartiallyPaid'),
    description: t('claimQueuePartiallyPaidHint'),
    count: props.counts.partiallyPaid ?? 0,
    icon: 'pie_chart',
    tone: 'teal',
    testId: claimListTestIds.queueTab(claimQueueTabs.partiallyPaid),
  },
  {
    id: claimQueueTabs.denied,
    label: t('claimQueueDenied'),
    description: t('claimQueueDeniedHint'),
    count: props.counts.denied ?? 0,
    icon: 'gavel',
    tone: 'red',
    testId: claimListTestIds.queueTab(claimQueueTabs.denied),
  },
  {
    id: claimQueueTabs.all,
    label: t('claimQueueAll'),
    description: t('claimQueueAllHint'),
    count: props.counts.all ?? 0,
    icon: 'description',
    tone: 'teal',
    testId: claimListTestIds.queueTab(claimQueueTabs.all),
  },
])

function isActive(id) {
  return props.active === id
}
</script>
