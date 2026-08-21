<template>
  <q-table
    v-bind="$attrs"
    :grid="resolvedGrid">
    <template
      v-for="name in passthroughSlotNames"
      :key="name"
      #[name]="scope">
      <slot :name="name" v-bind="scope || {}" />
    </template>

    <template
      v-if="hasNoDataSlot"
      #no-data="scope">
      <slot name="no-data" v-bind="scope || {}" />
    </template>

    <template v-if="hasRowActions" #body-cell-actions="scope">
      <q-td
        :props="scope"
        class="admin-data-table__actions-cell">
        <slot name="row-actions" :row="scope.row" />
      </q-td>
    </template>

    <template #item="scope">
      <AdminTableGridItem
        :table-props="scope"
        :row-class="gridCardClass(scope.row)"
        :card-layout="cardLayout">
        <template v-if="hasRowActions" #actions>
          <slot name="row-actions" :row="scope.row" />
        </template>
        <template
          v-for="slotName in bodyCellSlotNames"
          :key="slotName"
          #[slotName]="cellScope">
          <slot :name="slotName" v-bind="cellScope || {}" />
        </template>
      </AdminTableGridItem>
    </template>
  </q-table>
</template>

<script setup>
import { computed, useAttrs, useSlots } from 'vue'
import AdminTableGridItem from './AdminTableGridItem.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  /**
   * Card/grid mode. List pages pass useAdminTableMobileGrid().showGrid.
   * Default false so embedded tables stay rows on all breakpoints.
   */
  grid: {
    type: Boolean,
    default: false,
  },
  /**
   * Compact mobile card field hierarchy (title/subtitle/status/…).
   * Passed through to AdminTableGridItem.
   */
  cardLayout: {
    type: Object,
    default: null,
  },
})

const RESERVED_SLOTS = [
  'row-actions',
  'body-cell-actions',
  'item',
  'no-data',
]

const slots = useSlots()
const attrs = useAttrs()

const hasRowActions = computed(() => Boolean(slots['row-actions']))
const hasNoDataSlot = computed(() => Boolean(slots['no-data']))

const bodyCellSlotNames = computed(() =>
  Object.keys(slots).filter(name => name.startsWith('body-cell-')),
)

const passthroughSlotNames = computed(() =>
  Object.keys(slots).filter(name => !RESERVED_SLOTS.includes(name)),
)

const resolvedGrid = computed(() => props.grid)

function gridCardClass(row) {
  const fn = attrs.cardClassFn
  if (typeof fn === 'function') {
    return fn(row)
  }

  return ''
}
</script>
