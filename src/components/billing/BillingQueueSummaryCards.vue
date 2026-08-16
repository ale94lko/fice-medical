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
import { billingQueueTabs } from 'src/utils/billing-work-queue.js'
import { superbillListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  active: {
    type: String,
    default: billingQueueTabs.needsAttention,
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
    id: billingQueueTabs.needsAttention,
    label: t('billingQueueNeedsAttention'),
    description: t('billingQueueNeedsAttentionHint'),
    count: props.counts.needsAttention ?? 0,
    icon: 'error_outline',
    tone: 'red',
    testId: superbillListTestIds.queueTab(
      billingQueueTabs.needsAttention,
    ),
  },
  {
    id: billingQueueTabs.readyForReview,
    label: t('billingQueueReadyForReview'),
    description: t('billingQueueReadyForReviewHint'),
    count: props.counts.readyForReview ?? 0,
    icon: 'schedule',
    tone: 'orange',
    testId: superbillListTestIds.queueTab(
      billingQueueTabs.readyForReview,
    ),
  },
  {
    id: billingQueueTabs.onHold,
    label: t('billingQueueOnHold'),
    description: t('billingQueueOnHoldHint'),
    count: props.counts.onHold ?? 0,
    icon: 'pause_circle',
    tone: 'grey',
    testId: superbillListTestIds.queueTab(
      billingQueueTabs.onHold,
    ),
  },
  {
    id: billingQueueTabs.reviewed,
    label: t('billingQueueReviewed'),
    description: t('billingQueueReviewedHint'),
    count: props.counts.reviewed ?? 0,
    icon: 'check_circle',
    tone: 'green',
    testId: superbillListTestIds.queueTab(
      billingQueueTabs.reviewed,
    ),
  },
  {
    id: billingQueueTabs.all,
    label: t('billingQueueAllSuperbills'),
    description: t('billingQueueAllHint'),
    count: props.counts.all ?? 0,
    icon: 'description',
    tone: 'teal',
    testId: superbillListTestIds.queueTab(
      billingQueueTabs.all,
    ),
  },
])

function isActive(id) {
  return props.active === id
}
</script>
