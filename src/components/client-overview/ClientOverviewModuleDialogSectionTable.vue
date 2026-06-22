<template>
  <div class="add-client-form__fmh-list-card">
    <div class="add-client-form__fmh-table-wrap">
      <table class="add-client-form__fmh-table">
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
              {{ row[column.key] || '—' }}
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
</script>
