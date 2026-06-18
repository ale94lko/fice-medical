<template>
  <div
    v-if="rows.length"
    class="add-client-form__fmh-list-card">
    <div class="add-client-form__fmh-table-wrap">
      <table class="add-client-form__fmh-table">
        <thead>
          <tr>
            <th>{{ t('carePlanInterventionColTitle') }}</th>
            <th>{{ t('carePlanInterventionColFrequency') }}</th>
            <th>{{ t('carePlanInterventionColClinician') }}</th>
            <th class="add-client-form__fmh-table-actions-col">
              {{ t('actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.title || '—' }}</td>
            <td>{{ row.frequency || '—' }}</td>
            <td>{{ clinicianLabel(row) }}</td>
            <td class="add-client-form__fmh-table-actions">
              <q-btn
                flat
                round
                size="sm"
                class="app-btn-icon-action"
                color="primary"
                icon="visibility"
                @click="emit('view', row)"
              />
              <q-btn
                v-if="!readonly"
                flat
                round
                size="sm"
                class="app-btn-icon-action"
                color="primary"
                icon="edit"
                @click="emit('edit', row)"
              />
              <q-btn
                v-if="!readonly"
                flat
                round
                size="sm"
                class="app-btn-icon-action"
                color="primary"
                icon="delete"
                @click="emit('delete', row)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="text-center q-pa-lg">
    <q-icon name="list_alt" size="40px" color="grey-5" />
    <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
      {{ t('carePlanInterventionsEmpty') }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['view', 'edit', 'delete'])

const { t } = useI18n()

function clinicianLabel(row) {
  return row.responsibleClinicianName
    || row.responsible_clinician_name
    || '—'
}
</script>
