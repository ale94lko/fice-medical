<template>
  <div class="client-list-summary row q-col-gutter-md">
    <div
      v-for="card in cards"
      :key="card.id"
      class="col-12 col-sm-6 col-lg-3">
      <article
        class="client-list-summary__card"
        :class="[
          `client-list-summary__card--${card.tone}`,
          {
            'client-list-summary__card--active':
              activeFilter === card.id,
          },
        ]"
        :data-testid="card.testId"
        role="button"
        tabindex="0"
        @click="emit('filter', card.id)"
        @keydown.enter.prevent="emit('filter', card.id)"
        @keydown.space.prevent="emit('filter', card.id)">
        <div class="client-list-summary__card-main row items-center no-wrap">
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
        <div class="client-list-summary__card-link">
          <span>{{ t('clientListSummaryViewClients') }}</span>
          <q-icon name="chevron_right" size="16px" />
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { clientListTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  metrics: {
    type: Object,
    default: () => ({}),
  },
  activeFilter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['filter'])

const { t } = useI18n()

const cards = computed(() => [
  {
    id: 'upcomingAppointments',
    tone: 'blue',
    icon: 'event',
    label: t('clientListSummaryUpcomingAppointments'),
    description: t('clientListSummaryUpcomingAppointmentsHint'),
    count: props.metrics.upcomingAppointments ?? 0,
    testId: clientListTestIds.summaryUpcoming,
  },
  {
    id: 'missingInformation',
    tone: 'orange',
    icon: 'warning_amber',
    label: t('clientListSummaryMissingInformation'),
    description: t('clientListSummaryMissingInformationHint'),
    count: props.metrics.missingInformation ?? 0,
    testId: clientListTestIds.summaryMissing,
  },
  {
    id: 'pendingBilling',
    tone: 'green',
    icon: 'attach_money',
    label: t('clientListSummaryPendingBilling'),
    description: t('clientListSummaryPendingBillingHint'),
    count: props.metrics.pendingBilling ?? 0,
    testId: clientListTestIds.summaryBilling,
  },
  {
    id: 'authorizationsExpiring',
    tone: 'purple',
    icon: 'description',
    label: t('clientListSummaryAuthorizationsExpiring'),
    description: t('clientListSummaryAuthorizationsExpiringHint'),
    count: props.metrics.authorizationsExpiring ?? 0,
    testId: clientListTestIds.summaryAuthorizations,
  },
])
</script>
