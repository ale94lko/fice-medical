<template>
  <div
    class="q-pa-xs col-xs-12 admin-table-grid-item"
    :class="rowClass">
    <q-card flat bordered class="admin-table-grid-card">
      <q-list dense class="admin-table-grid-card__list">
        <q-item
          v-for="col in displayCols"
          :key="col.name"
          class="admin-table-grid-card__field q-px-none">
          <q-item-section>
            <div class="admin-table-grid-card__label">
              {{ col.label }}
            </div>
            <div class="admin-table-grid-card__value">
              <slot
                :name="`body-cell-${col.name}`"
                v-bind="toCellScope(col)">
                <span class="admin-table-grid-card__text">
                  {{ formatColValue(col) }}
                </span>
              </slot>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-actions
        v-if="$slots.actions"
        align="right"
        class="admin-table-grid-actions">
        <slot name="actions" :row="tableProps.row" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isEmpty } from 'src/utils/base.js'

const props = defineProps({
  tableProps: {
    type: Object,
    required: true,
  },
  rowClass: {
    type: [String, Array, Object],
    default: '',
  },
  excludeColumns: {
    type: Array,
    default: () => ['actions'],
  },
})

const displayCols = computed(() => {
  const cols = Array.isArray(props.tableProps?.cols)
    ? props.tableProps.cols
    : []
  const excluded = new Set(props.excludeColumns)

  return cols.filter(col => {
    if (!col?.name || excluded.has(col.name)) {
      return false
    }
    // Quasar selection column has no usable name/field label pair.
    if (col.required === false && !col.field && !col.label) {
      return false
    }

    return true
  })
})

function toCellScope(col) {
  return {
    ...props.tableProps,
    col,
    value: col.value,
    key: col.name,
  }
}

function formatComplexItem(item) {
  if (item == null) {
    return ''
  }
  if (typeof item !== 'object') {
    return String(item)
  }

  if (item.badgeLabel) {
    return String(item.badgeLabel)
  }
  if (item.phone) {
    return item.typeLabel
      ? `${item.phone} ${item.typeLabel}`
      : String(item.phone)
  }
  if (item.email) {
    return item.typeLabel
      ? `${item.email} ${item.typeLabel}`
      : String(item.email)
  }
  if (item.label) {
    return String(item.label)
  }
  if (item.name) {
    return String(item.name)
  }
  if (item.displayName) {
    return String(item.displayName)
  }
  if (item.initials) {
    return String(item.initials)
  }

  return ''
}

function formatColValue(col) {
  const value = col?.value
  if (isEmpty(value)) {
    return '—'
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return '—'
    }
    const parts = value.map(formatComplexItem).filter(Boolean)

    return parts.length ? parts.join(', ') : '—'
  }
  if (typeof value === 'object') {
    return formatComplexItem(value) || '—'
  }

  return String(value)
}
</script>
