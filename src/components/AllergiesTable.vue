<template>
  <div
    v-if="entries.length"
    class="add-client-form__fmh-table-wrap">
    <table class="add-client-form__fmh-table">
      <thead>
        <tr>
          <th>{{ t('allergyName') }}</th>
          <th>{{ t('allergySeverity') }}</th>
          <th>{{ t('allergyStartYear') }}</th>
          <th class="add-client-form__fmh-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in entries"
          :key="entry.id"
          :class="{
            'add-client-form__fmh-table-row--error':
              invalidRowIdSet.has(entry.id),
          }">
          <td>{{ entry.allergy }}</td>
          <td>
            <span
              :class="[
                'add-client-form__allergy-severity-badge',
                severityBadgeClass(entry.severity),
              ]">
              <span
                :class="[
                  'add-client-form__allergy-severity-dot',
                  severityDotClass(entry.severity),
                ]"
              />
              {{ entry.severity }}
            </span>
          </td>
          <td>{{ formatStartYear(entry.startYear) }}</td>
          <td class="add-client-form__fmh-table-actions">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="edit"
              :data-testid="tid.allergyRowEdit(entry.id)"
              :aria-label="t('edit')"
              @click="emit('edit', entry)"
            />
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="delete"
              :data-testid="tid.allergyRowDelete(entry.id)"
              :aria-label="t('delete')"
              @click="emit('delete', entry)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="add-client-form__fmh-empty text-body2 text-grey-7">
    {{ emptyLabel }}
  </p>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  clientAllergySeverityValues,
} from 'components/constants.js'
import { addClientTestIds as tid } from 'src/test-ids/index.js'

const props = defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
  invalidRowIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'delete'])

const invalidRowIdSet = computed(
  () => new Set(props.invalidRowIds ?? []),
)

const { t } = useI18n()

function formatStartYear(year) {
  if (year == null || year === '') {
    return '—'
  }

  return String(year)
}

function severityBadgeClass(severity) {
  if (severity === clientAllergySeverityValues.severe) {
    return 'add-client-form__allergy-severity-badge--severe'
  }
  if (severity === clientAllergySeverityValues.moderate) {
    return 'add-client-form__allergy-severity-badge--moderate'
  }

  return 'add-client-form__allergy-severity-badge--mild'
}

function severityDotClass(severity) {
  if (severity === clientAllergySeverityValues.severe) {
    return 'add-client-form__allergy-severity-dot--severe'
  }
  if (severity === clientAllergySeverityValues.moderate) {
    return 'add-client-form__allergy-severity-dot--moderate'
  }

  return 'add-client-form__allergy-severity-dot--mild'
}
</script>
