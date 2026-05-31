<template>
  <div
    v-if="entries.length"
    class="add-client-form__fmh-table-wrap">
    <table
      class="add-client-form__fmh-table
        add-client-form__fmh-table--wide">
      <thead>
        <tr>
          <th>{{ t('vitalsColDateTime') }}</th>
          <th>{{ t('vitalsColBloodPressure') }}</th>
          <th>{{ t('vitalsColHeartRate') }}</th>
          <th>{{ t('vitalsColTemperature') }}</th>
          <th>{{ t('vitalsColSpO2') }}</th>
          <th>{{ t('vitalsColBmi') }}</th>
          <th>{{ t('vitalsColRecordedBy') }}</th>
          <th class="add-client-form__fmh-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id">
          <td>{{ formatRecordedDateTimeDisplay(entry) }}</td>
          <td>{{ formatBloodPressure(entry) }}</td>
          <td>{{ displayValue(entry.heartRate) }}</td>
          <td>{{ displayValue(entry.temperature) }}</td>
          <td>{{ displayValue(entry.oxygenSaturation) }}</td>
          <td>{{ formatBmiDisplay(entry.bmi) }}</td>
          <td>{{ clinicianLabel(entry.recordedBy) }}</td>
          <td class="add-client-form__fmh-table-actions">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              :data-testid="tid.vitalsRowEdit(entry.id)"
              :aria-label="t('edit')"
              @click="emit('edit', entry)"
            />
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="delete"
              :data-testid="tid.vitalsRowDelete(entry.id)"
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
  formatBmiDisplay,
  formatRecordedDateTimeDisplay,
} from 'src/utils/client-vitals.js'
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
  clinicianOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'delete'])

const { t } = useI18n()

function displayValue(value) {
  if (value == null || value === '') {
    return '—'
  }

  return String(value)
}

function formatBloodPressure(row) {
  if (row?.systolic == null || row?.diastolic == null) {
    return '—'
  }

  return `${row.systolic} / ${row.diastolic}`
}

function clinicianLabel(value) {
  const match = props.clinicianOptions.find(
    opt => String(opt.value) === String(value),
  )

  return match?.label ?? value ?? '—'
}
</script>
