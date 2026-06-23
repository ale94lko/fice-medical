<template>
  <ul
    class="client-overview-allergies-dialog-list"
    :data-testid="clientOverviewTestIds.allergiesDialogList">
    <li
      v-for="(item, index) in items"
      :key="`allergy-dialog-${index}`"
      class="client-overview-allergies-dialog-list__item"
      :class="itemClass(item.severityModifier)">
      <div class="client-overview-allergies-dialog-list__main">
        <div class="client-overview-allergies-dialog-list__icon-wrap">
          <q-icon name="warning" size="18px" />
        </div>
        <div class="client-overview-allergies-dialog-list__info">
          <span class="client-overview-allergies-dialog-list__name">
            {{ item.label }}
          </span>
          <span
            v-if="item.severityModifier"
            :class="[
              'allergy-severity-badge',
              allergySeverityBadgeClass(item.severityModifier),
            ]">
            {{ item.severityLabel }}
          </span>
        </div>
      </div>

      <div
        class="client-overview-allergies-dialog-list__divider"
        aria-hidden="true"
      />

      <div class="client-overview-allergies-dialog-list__year">
        <div class="client-overview-allergies-dialog-list__year-label">
          <q-icon name="event" size="16px" />
          <span>{{ t('clientOverviewAllergyRecordedYear') }}</span>
        </div>
        <strong class="client-overview-allergies-dialog-list__year-value">
          {{ item.year || '—' }}
        </strong>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  clientListAllergySeverityBadgeClass as allergySeverityBadgeClass,
} from 'src/utils/client-list-allergy-severity.js'
import { clientOverviewTestIds } from 'src/test-ids/index.js'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()

function itemClass(modifier) {
  const token = String(modifier ?? '').trim()
  if (!token) {
    return ''
  }

  return `client-overview-allergies-dialog-list__item--${token}`
}
</script>
