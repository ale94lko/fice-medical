<template>
  <div class="staff-list-summary row q-col-gutter-md">
    <div
      v-for="card in cards"
      :key="card.id"
      class="staff-list-summary__col col-12 col-sm-6 col-md-4 col-xl">
      <article
        class="staff-list-summary__card client-list-summary__card"
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
        <div
          class="client-list-summary__card-main row items-center no-wrap">
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
          <span>{{ t('staffListSummaryViewAll') }}</span>
          <q-icon name="chevron_right" size="16px" />
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { staffListTestIds } from 'src/test-ids/index.js'

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
    id: 'totalStaff',
    tone: 'green',
    icon: 'groups',
    label: t('staffListSummaryTotalStaff'),
    description: t('staffListSummaryTotalStaffHint'),
    count: props.metrics.totalStaff ?? 0,
    testId: staffListTestIds.summaryTotal,
  },
  {
    id: 'clinicians',
    tone: 'blue',
    icon: 'medical_services',
    label: t('staffListSummaryClinicians'),
    description: t('staffListSummaryCliniciansHint'),
    count: props.metrics.clinicians ?? 0,
    testId: staffListTestIds.summaryClinicians,
  },
  {
    id: 'activeStaff',
    tone: 'purple',
    icon: 'check_circle',
    label: t('staffListSummaryActiveStaff'),
    description: t('staffListSummaryActiveStaffHint'),
    count: props.metrics.activeStaff ?? 0,
    testId: staffListTestIds.summaryActive,
  },
  {
    id: 'onLeave',
    tone: 'orange',
    icon: 'event_busy',
    label: t('staffListSummaryOnLeave'),
    description: t('staffListSummaryOnLeaveHint'),
    count: props.metrics.onLeave ?? 0,
    testId: staffListTestIds.summaryOnLeave,
  },
  {
    id: 'expiringCredentials',
    tone: 'red',
    icon: 'warning_amber',
    label: t('staffListSummaryExpiringCredentials'),
    description: t('staffListSummaryExpiringCredentialsHint'),
    count: props.metrics.expiringCredentials ?? 0,
    testId: staffListTestIds.summaryExpiring,
  },
])
</script>
