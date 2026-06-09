<template>
  <div
    v-if="rows.length"
    class="add-client-form__fmh-table-wrap
      add-client-form__fmh-table-wrap--wide">
    <table
      class="add-client-form__fmh-table
        add-client-form__fmh-table--wide">
      <thead>
        <tr>
          <th>{{ t('labColTestName') }}</th>
          <th>{{ t('labColCategory') }}</th>
          <th>{{ t('labColOrderedDate') }}</th>
          <th>{{ t('labColCollectedDate') }}</th>
          <th>{{ t('labColResultDate') }}</th>
          <th>{{ t('status') }}</th>
          <th>{{ t('labColAbnormal') }}</th>
          <th class="add-client-form__fmh-table-actions-col">
            {{ t('actions') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.testName || '—' }}</td>
          <td>
            <span
              v-if="row.category"
              class="lab-category-badge"
              :class="`lab-category-badge--${row.category}`">
              {{ categoryLabel(row.category) }}
            </span>
            <span v-else>—</span>
          </td>
          <td>{{ row.orderedDate || '—' }}</td>
          <td>{{ row.collectedDate || '—' }}</td>
          <td>{{ row.resultDate || '—' }}</td>
          <td>
            <span
              class="lab-status-badge"
              :class="`lab-status-badge--${row.status}`">
              {{ statusLabel(row.status) }}
            </span>
          </td>
          <td>
            <span
              class="lab-abnormal-badge"
              :class="row.abnormalResult
                ? 'lab-abnormal-badge--yes'
                : 'lab-abnormal-badge--no'">
              {{ row.abnormalResult ? t('yes') : t('no') }}
            </span>
          </td>
          <td class="add-client-form__fmh-table-actions">
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="visibility"
              :data-testid="tid.rowView(row.id)"
              :aria-label="t('labActionView')"
              @click="emit('view', row)"
            />
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="edit"
              :data-testid="tid.rowEdit(row.id)"
              :aria-label="t('edit')"
              @click="emit('edit', row)"
            />
            <q-btn
              flat
              round
              size="sm"
              class="app-btn-icon-action"
              color="primary"
              icon="download"
              :data-testid="tid.rowDownload(row.id)"
              :aria-label="t('labActionDownload')"
              @click="emit('download', row)"
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
import { labTestIds as tid } from 'src/test-ids/index.js'
import { labI18nKey } from 'src/utils/lab-i18n.js'

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  emptyLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['view', 'edit', 'download'])

const { t } = useI18n()

function statusLabel(status) {
  const key = labI18nKey('labStatus', status)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return status || '—'
}

function categoryLabel(category) {
  const key = labI18nKey('labCategory', category)
  const translated = t(key)
  if (translated !== key) {
    return translated
  }

  return category || '—'
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.lab-category-badge,
.lab-status-badge,
.lab-abnormal-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
}

.lab-category-badge--blood_test {
  background: #ede9fe;
  color: #5b21b6;
}

.lab-category-badge--urine_test {
  background: #dbeafe;
  color: #1d4ed8;
}

.lab-category-badge--imaging {
  background: #ffedd5;
  color: #c2410c;
}

.lab-category-badge--microbiology {
  background: #ccfbf1;
  color: #0f766e;
}

.lab-category-badge--pathology {
  background: #fce7f3;
  color: #9d174d;
}

.lab-status-badge--draft {
  background: #f1f5f9;
  color: $text-muted;
}

.lab-status-badge--ordered {
  background: #e0f2fe;
  color: #0369a1;
}

.lab-status-badge--collected {
  background: #fef3c7;
  color: #b45309;
}

.lab-status-badge--resulted {
  background: #dcfce7;
  color: #166534;
}

.lab-status-badge--reviewed {
  background: #dbeafe;
  color: #1d4ed8;
}

.lab-abnormal-badge--yes {
  background: #fee2e2;
  color: #b91c1c;
}

.lab-abnormal-badge--no {
  background: #dcfce7;
  color: #166534;
}
</style>
