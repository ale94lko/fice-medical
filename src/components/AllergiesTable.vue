<template>
  <div
    v-if="entries.length"
    class="add-client-form__fmh-table-wrap">
    <table class="add-client-form__fmh-table add-client-form__allergy-table">
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
        <tr v-for="entry in entries" :key="entry.id">
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
              dense
              color="primary"
              icon="edit"
              :aria-label="t('edit')"
              @click="emit('edit', entry)"
            />
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="delete"
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
import { useI18n } from 'vue-i18n'
import {
  clientAllergySeverityValues,
} from 'components/constants.js'

defineProps({
  entries: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['edit', 'delete'])

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
