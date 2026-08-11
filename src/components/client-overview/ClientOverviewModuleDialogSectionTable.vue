<template>
  <div class="fmh-list-card client-overview-module-dialog__table-card">
    <div
      class="fmh-table-wrap client-overview-module-dialog__table-scroll">
      <table class="fmh-table client-overview-module-dialog__table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key">
              {{ t(column.labelKey) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in rows"
            :key="`section-row-${rowIndex}`">
            <td
              v-for="column in columns"
              :key="`${rowIndex}-${column.key}`">
              <span :class="cellValueClass(row[column.key])">
                {{ displayCellValue(row[column.key]) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()

function displayCellValue(value) {
  const text = String(value ?? '').trim()

  return text || '—'
}

function cellValueClass(value) {
  const text = String(value ?? '').trim()
  if (!text || text === '—') {
    return 'client-overview-module-dialog__cell-empty'
  }

  return 'client-overview-module-dialog__cell-value'
}
</script>
