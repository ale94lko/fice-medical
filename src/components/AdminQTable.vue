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
        :row-class="gridCardClass(scope.row)">
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
import { useQuasar } from 'quasar'
import { siteBreakpointsPx } from 'components/constants.js'
import AdminTableGridItem from './AdminTableGridItem.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  /**
   * When omitted, card/grid mode turns on automatically on mobile.
   * Pass an explicit boolean to override (list pages).
   */
  grid: {
    default: undefined,
    validator: value => value === undefined || typeof value === 'boolean',
  },
})

const RESERVED_SLOTS = ['row-actions', 'body-cell-actions', 'item']

const slots = useSlots()
const attrs = useAttrs()
const $q = useQuasar()

const hasRowActions = computed(() => Boolean(slots['row-actions']))

const bodyCellSlotNames = computed(() =>
  Object.keys(slots).filter(name => name.startsWith('body-cell-')),
)

const passthroughSlotNames = computed(() =>
  Object.keys(slots).filter(name => !RESERVED_SLOTS.includes(name)),
)

const resolvedGrid = computed(() => {
  if (typeof props.grid === 'boolean') {
    return props.grid
  }

  return $q.screen.width <= siteBreakpointsPx.XXS
})

function gridCardClass(row) {
  const fn = attrs.cardClassFn
  if (typeof fn === 'function') {
    return fn(row)
  }

  return ''
}
</script>
