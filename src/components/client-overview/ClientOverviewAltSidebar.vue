<template>
  <aside
    class="client-overview-alt-sidebar column"
    :data-testid="clientOverviewAltTestIds.sidebar">
    <article
      class="client-overview-alt-sidebar__card
        client-overview-alt-sidebar__card--activity col">
      <header class="client-overview-alt-sidebar__card-header">
        <q-icon name="history" size="18px" />
        <h3 class="col q-mb-none">
          {{ t('clientOverviewRecentActivity') }}
        </h3>
      </header>

      <ul
        v-if="activityItems.length"
        class="client-overview-alt-sidebar__activity q-pl-none q-mb-none">
        <li
          v-for="(item, index) in activityItems"
          :key="`activity-${index}`"
          class="client-overview-alt-sidebar__activity-item">
          <q-icon
            :name="item.icon"
            size="18px"
            class="client-overview-alt-sidebar__activity-icon"
          />
          <div class="client-overview-alt-sidebar__activity-body">
            <p class="client-overview-alt-sidebar__activity-title q-mb-none">
              {{ item.label }}
            </p>
            <p
              v-if="item.subtitle"
              class="client-overview-alt-sidebar__activity-sub q-mb-none">
              {{ item.subtitle }}
            </p>
            <p
              v-if="item.date"
              class="client-overview-alt-sidebar__activity-date q-mb-none">
              {{ item.date }}
            </p>
          </div>
          <q-icon
            name="chevron_right"
            size="18px"
            class="client-overview-alt-sidebar__chevron"
          />
        </li>
      </ul>
      <p
        v-else
        class="text-grey-7 q-mb-none">
        {{ t('clientOverviewNoActivity') }}
      </p>

      <button
        type="button"
        class="client-overview-alt-sidebar__view-all"
        :data-testid="clientOverviewAltTestIds.viewAllActivity"
        @click="emit('view-all-activity')">
        {{ t('clientOverviewAltViewAllActivity') }}
      </button>
    </article>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

defineProps({
  activityItems: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['view-all-activity'])

const { t } = useI18n()
</script>
