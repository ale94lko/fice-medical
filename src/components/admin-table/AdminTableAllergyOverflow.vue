<template>
  <div class="admin-allergy-overflow row items-center no-wrap">
    <span
      v-if="firstEntry"
      :class="primaryBadgeClass(firstEntry)">
      <slot name="value" :entry="firstEntry">
        {{ firstEntry.badgeLabel }}
      </slot>
    </span>
    <AdminTableHoverCard v-if="extraCount > 0">
      <template #anchor>
        <span
          class="admin-contact-overflow__more"
          tabindex="0"
          :aria-label="`+${extraCount}`">
          +{{ extraCount }}
        </span>
      </template>
      <div class="admin-contact-overflow__tip-card">
        <div
          v-for="(entry, index) in extraEntries"
          :key="entryKey(entry, index)"
          class="admin-contact-overflow__tip-item row no-wrap
            items-center">
          <div class="admin-contact-overflow__tip-body col">
            <div class="admin-contact-overflow__tip-value">
              {{ entry.name }}
            </div>
            <div
              v-if="entryMeta(entry)"
              class="admin-contact-overflow__tip-type">
              {{ entryMeta(entry) }}
            </div>
          </div>
          <span
            v-if="entry.severityLabel"
            :class="severityBadgeClass(entry)">
            {{ entry.severityLabel }}
          </span>
        </div>
      </div>
    </AdminTableHoverCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AdminTableHoverCard from
  'components/admin-table/AdminTableHoverCard.vue'
import {
  clientListAllergySeverityBadgeClass,
} from 'src/utils/client-list-allergy-severity.js'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
})

const firstEntry = computed(() => props.entries[0] ?? null)
const extraEntries = computed(() => props.entries.slice(1))
const extraCount = computed(() => extraEntries.value.length)

function entryKey(entry, index) {
  const key = entry?.key
  if (key != null && key !== '') {
    return String(key)
  }

  return entry?.name ?? `allergy-${index}`
}

function entryMeta(entry) {
  const parts = []
  const year = String(entry?.year ?? '').trim()
  if (year) {
    parts.push(year)
  }

  return parts.join(' · ')
}

function primaryBadgeClass(entry) {
  return [
    'allergy-severity-badge',
    'client-list-page__allergy-badge',
    clientListAllergySeverityBadgeClass(entry?.severityModifier),
  ]
}

function severityBadgeClass(entry) {
  return [
    'allergy-severity-badge',
    'admin-allergy-overflow__tip-severity',
    clientListAllergySeverityBadgeClass(entry?.severityModifier),
  ]
}
</script>
