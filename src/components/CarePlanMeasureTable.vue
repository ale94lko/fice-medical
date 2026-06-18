<template>
  <div
    v-if="rows.length"
    class="add-client-form__fmh-list-card">
    <div class="add-client-form__fmh-table-wrap">
      <table class="add-client-form__fmh-table">
        <thead>
          <tr>
            <th>{{ t('carePlanMeasureColName') }}</th>
            <th>{{ t('carePlanMeasureColBaseline') }}</th>
            <th>{{ t('carePlanMeasureColTarget') }}</th>
            <th>{{ t('carePlanMeasureColDirection') }}</th>
            <th>{{ t('carePlanColProgress') }}</th>
            <th class="add-client-form__fmh-table-actions-col">
              {{ t('actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.measureName || '—' }}</td>
            <td>{{ row.baseline ?? '—' }}</td>
            <td>{{ row.target ?? '—' }}</td>
            <td>{{ directionLabel(row.direction) }}</td>
            <td>
              <CarePlanProgressCell :progress="row.progress" />
            </td>
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
    <q-icon name="show_chart" size="40px" color="grey-5" />
    <p class="text-body2 text-grey-7 q-mt-sm q-mb-none">
      {{ t('carePlanMeasuresEmpty') }}
    </p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import CarePlanProgressCell from 'components/CarePlanProgressCell.vue'
import { carePlanI18nKey } from 'src/utils/care-plan-i18n.js'

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

function directionLabel(direction) {
  const key = carePlanI18nKey('carePlanDirection', direction)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return direction || '—'
}
</script>
