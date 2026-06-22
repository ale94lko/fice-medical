<template>
  <aside
    class="client-overview-sidebar column"
    :data-testid="clientOverviewTestIds.sidebar">
    <article
      class="client-overview-sidebar__card
        client-overview-sidebar__card--activity col">
      <header class="client-overview-sidebar__card-header row items-center
        no-wrap">
        <q-icon name="history" size="18px" />
        <h3 class="col q-mb-none">
          {{ t('clientOverviewRecentActivity') }}
        </h3>
      </header>
      <ul
        v-if="activityItems.length"
        class="client-overview-sidebar__activity q-pl-none q-mb-none">
        <li
          v-for="(item, index) in activityItems"
          :key="`activity-${index}`"
          class="client-overview-sidebar__activity-item row no-wrap">
          <q-icon :name="item.icon" size="16px" class="q-mt-xs" />
          <div class="col">
            <p class="q-mb-none">{{ item.label }}</p>
            <p class="q-mb-none text-caption text-grey-7">{{ item.date }}</p>
          </div>
        </li>
      </ul>
      <p v-else class="text-grey-7 q-mb-none">
        {{ t('clientOverviewNoActivity') }}
      </p>
    </article>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

defineProps({
  activityItems: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
</script>
