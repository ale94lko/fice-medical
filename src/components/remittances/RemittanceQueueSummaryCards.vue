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
import { remittanceQueueTabs } from 'src/utils/remittance-work-queue.js'
import { remittanceListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  active: {
    type: String,
    default: remittanceQueueTabs.needsReview,
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
    id: remittanceQueueTabs.needsReview,
    label: t('remittanceQueueNeedsReview'),
    description: t('remittanceQueueNeedsReviewHint'),
    count: props.counts.needsReview ?? 0,
    icon: 'error_outline',
    tone: 'red',
    testId: remittanceListTestIds.queueTab(
      remittanceQueueTabs.needsReview,
    ),
  },
  {
    id: remittanceQueueTabs.readyToPost,
    label: t('remittanceQueueReady'),
    description: t('remittanceQueueReadyHint'),
    count: props.counts.readyToPost ?? 0,
    icon: 'task_alt',
    tone: 'teal',
    testId: remittanceListTestIds.queueTab(
      remittanceQueueTabs.readyToPost,
    ),
  },
  {
    id: remittanceQueueTabs.posted,
    label: t('remittanceQueuePosted'),
    description: t('remittanceQueuePostedHint'),
    count: props.counts.posted ?? 0,
    icon: 'check_circle',
    tone: 'green',
    testId: remittanceListTestIds.queueTab(
      remittanceQueueTabs.posted,
    ),
  },
  {
    id: remittanceQueueTabs.all,
    label: t('remittanceQueueAll'),
    description: t('remittanceQueueAllHint'),
    count: props.counts.all ?? 0,
    icon: 'description',
    tone: 'teal',
    testId: remittanceListTestIds.queueTab(
      remittanceQueueTabs.all,
    ),
  },
])

function isActive(id) {
  return props.active === id
}
</script>
