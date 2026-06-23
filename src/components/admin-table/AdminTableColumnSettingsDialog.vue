<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="app-dialog-card app-dialog-card--sm">
      <AppDialogHeader :close-label="t('close')" @close="onCancel">
        {{ t('adminTableColumnSettingsTitle') }}
      </AppDialogHeader>

      <q-card-section class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p class="text-body2 text-grey-7 q-mt-none q-mb-md">
          {{ t('adminTableColumnSettingsHint') }}
        </p>

        <TransitionGroup
          name="admin-table-column-settings-list"
          tag="div"
          class="admin-table-column-settings">
          <div
            v-for="(columnId, index) in draftOrder"
            :key="columnId"
            class="admin-table-column-settings__card"
            :class="{
              'admin-table-column-settings__card--dragging':
                dragSourceColumnId === columnId,
              'admin-table-column-settings__card--locked':
                isLocked(columnId),
            }"
            :draggable="!isLocked(columnId)"
            @dragstart="onDragStart(columnId, $event)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(index, $event)"
            @drop.prevent="onDragEnd">
            <div
              class="admin-table-column-settings__toggle-wrap"
              @mousedown.stop
              @dragstart.stop.prevent>
              <FormToggle
                :model-value="!draftHidden.includes(columnId)"
                :disable="isRequired(columnId)"
                :label="columnLabel(columnId)"
                class="admin-table-column-settings__toggle"
                @update:model-value="value => onToggle(columnId, value)"
              />
            </div>
            <span
              v-if="!isLocked(columnId)"
              class="admin-table-column-settings__handle"
              aria-hidden="true">
              <q-icon name="drag_indicator" size="22px" />
            </span>
          </div>
        </TransitionGroup>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('reset')"
          @click="onReset"
        />
        <q-btn
          no-caps
          flat
          class="app-btn-outline"
          :label="t('cancel')"
          @click="onCancel"
        />
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('save')"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDialogHeader from 'components/AppDialogHeader.vue'
import FormToggle from 'components/FormToggle.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  preferences: {
    type: Object,
    required: true,
  },
  columnLabels: {
    type: Object,
    default: () => ({}),
  },
  defaultOrder: {
    type: Array,
    required: true,
  },
  isRequiredColumn: {
    type: Function,
    default: () => false,
  },
  isLockedColumn: {
    type: Function,
    default: () => false,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'reset'])

const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const draftOrder = ref([])
const draftHidden = ref([])
const dragSourceColumnId = ref(null)
const lastReorderHover = ref(null)

watch(
  () => [props.modelValue, props.preferences],
  ([visible]) => {
    if (!visible) {
      return
    }
    draftOrder.value = [...(props.preferences.order ?? props.defaultOrder)]
    draftHidden.value = [...(props.preferences.hidden ?? [])]
    dragSourceColumnId.value = null
    lastReorderHover.value = null
  },
  { immediate: true, deep: true },
)

function columnLabel(columnId) {
  return props.columnLabels[columnId] ?? columnId
}

function isRequired(columnId) {
  return props.isRequiredColumn(columnId)
}

function isLocked(columnId) {
  return props.isLockedColumn(columnId)
}

function onToggle(columnId, visible) {
  if (isRequired(columnId)) {
    return
  }
  if (visible) {
    draftHidden.value = draftHidden.value.filter(name => name !== columnId)
    return
  }
  if (!draftHidden.value.includes(columnId)) {
    draftHidden.value = [...draftHidden.value, columnId]
  }
}

function getMovableBounds(order) {
  const movableIndices = order
    .map((id, idx) => (!isLocked(id) ? idx : -1))
    .filter(idx => idx >= 0)

  if (!movableIndices.length) {
    return { min: 0, max: 0 }
  }

  return {
    min: Math.min(...movableIndices),
    max: Math.max(...movableIndices),
  }
}

function clampInsertIndex(order, insertIndex) {
  const { min, max } = getMovableBounds(order)
  return Math.max(min, Math.min(max + 1, insertIndex))
}

function computeTargetIndex(order, fromIndex, hoverIndex, after) {
  let rawInsert = after ? hoverIndex + 1 : hoverIndex
  rawInsert = clampInsertIndex(order, rawInsert)

  let targetIndex = rawInsert
  if (fromIndex < targetIndex) {
    targetIndex -= 1
  }

  return targetIndex
}

function moveColumnToIndex(columnId, targetIndex) {
  const order = [...draftOrder.value]
  const fromIndex = order.indexOf(columnId)
  if (fromIndex < 0 || isLocked(columnId) || fromIndex === targetIndex) {
    return false
  }

  const [item] = order.splice(fromIndex, 1)
  order.splice(targetIndex, 0, item)
  draftOrder.value = order

  return true
}

function onDragStart(columnId, event) {
  if (isLocked(columnId)) {
    event.preventDefault()
    return
  }

  dragSourceColumnId.value = columnId
  lastReorderHover.value = null
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', columnId)

  if (event.dataTransfer.setDragImage
    && event.currentTarget instanceof HTMLElement) {
    event.dataTransfer.setDragImage(event.currentTarget, 24, 24)
  }
}

function onDragEnd() {
  dragSourceColumnId.value = null
  lastReorderHover.value = null
}

function onDragOver(hoverIndex, event) {
  const columnId = dragSourceColumnId.value
  if (!columnId) {
    return
  }

  event.dataTransfer.dropEffect = 'move'

  const hoverColumnId = draftOrder.value[hoverIndex]
  if (!hoverColumnId || hoverColumnId === columnId) {
    return
  }

  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) {
    return
  }

  const rect = el.getBoundingClientRect()
  const after = event.clientY >= rect.top + (rect.height / 2)
  const hoverKey = `${hoverColumnId}:${after ? 'after' : 'before'}`
  if (lastReorderHover.value === hoverKey) {
    return
  }

  const order = draftOrder.value
  const fromIndex = order.indexOf(columnId)
  if (fromIndex < 0) {
    return
  }

  const targetIndex = computeTargetIndex(
    order,
    fromIndex,
    hoverIndex,
    after,
  )

  if (fromIndex === targetIndex) {
    lastReorderHover.value = hoverKey
    return
  }

  if (moveColumnToIndex(columnId, targetIndex)) {
    lastReorderHover.value = hoverKey
  }
}

function onCancel() {
  open.value = false
}

function onReset() {
  emit('reset')
  open.value = false
}

function onSave() {
  emit('save', {
    order: [...draftOrder.value],
    hidden: [...draftHidden.value],
  })
  open.value = false
}
</script>
